import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { acquireLock } from "@/lib/lock";

export const dynamic = "force-dynamic";

const Schema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = Schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { productId, warehouseId, quantity } = body.data;

  const release = await acquireLock(`stock:${productId}:${warehouseId}`);
  if (!release) {
    return NextResponse.json(
      { error: "Stock is being updated, please try again" },
      { status: 409 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stockLevel.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
      });
      if (!stock) return { ok: false, status: 404, error: "Not available at this warehouse" };
      const available = stock.total - stock.reserved;
      if (available < quantity) {
        return { ok: false, status: 409, error: `Only ${available} unit(s) available` };
      }
      await tx.stockLevel.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { reserved: { increment: quantity } },
      });
      const reservation = await tx.reservation.create({
        data: {
          productId, warehouseId, quantity,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        include: {
          product: { select: { name: true } },
          warehouse: { select: { name: true } },
        },
      });
      return { ok: true, reservation };
    });

    if (!result.ok || !result.reservation) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const r = result.reservation;
    return NextResponse.json({
      id: r.id, productId: r.productId, productName: r.product.name,
      warehouseId: r.warehouseId, warehouseName: r.warehouse.name,
      quantity: r.quantity, status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }, { status: 201 });
  } finally {
    await release();
  }
}