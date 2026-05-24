import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      product: { select: { name: true } },
      warehouse: { select: { name: true } },
    },
  });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: r.id, productId: r.productId, productName: r.product.name,
    warehouseId: r.warehouseId, warehouseName: r.warehouse.name,
    quantity: r.quantity, status: r.status,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  });
}