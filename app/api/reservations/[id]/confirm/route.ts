import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await prisma.reservation.findUnique({ where: { id: params.id } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.status === "CONFIRMED") return NextResponse.json({ id: r.id, status: "CONFIRMED" });
  if (r.status === "RELEASED") return NextResponse.json({ error: "Already released" }, { status: 410 });
  if (new Date() > r.expiresAt) {
    await prisma.$transaction([
      prisma.reservation.update({ where: { id: r.id }, data: { status: "RELEASED" } }),
      prisma.stockLevel.update({
        where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
        data: { reserved: { decrement: r.quantity } },
      }),
    ]);
    return NextResponse.json({ error: "Reservation expired" }, { status: 410 });
  }
  await prisma.$transaction([
    prisma.reservation.update({ where: { id: r.id }, data: { status: "CONFIRMED" } }),
    prisma.stockLevel.update({
      where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
      data: { total: { decrement: r.quantity }, reserved: { decrement: r.quantity } },
    }),
  ]);
  return NextResponse.json({ id: r.id, status: "CONFIRMED" });
}