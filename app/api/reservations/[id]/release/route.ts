import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const r = await prisma.reservation.findUnique({ where: { id: params.id } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.status !== "PENDING") return NextResponse.json({ id: r.id, status: r.status });
  await prisma.$transaction([
    prisma.reservation.update({ where: { id: r.id }, data: { status: "RELEASED" } }),
    prisma.stockLevel.update({
      where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
      data: { reserved: { decrement: r.quantity } },
    }),
  ]);
  return NextResponse.json({ id: r.id, status: "RELEASED" });
}