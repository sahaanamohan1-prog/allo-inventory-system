import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/expiry";

export const dynamic = "force-dynamic";

export async function GET() {
  releaseExpiredReservations().catch(console.error);
  const products = await prisma.product.findMany({
    include: { stockLevels: { include: { warehouse: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    stock: p.stockLevels.map(sl => ({
      warehouseId: sl.warehouseId,
      warehouseName: sl.warehouse.name,
      warehouseLocation: sl.warehouse.location,
      available: Math.max(0, sl.total - sl.reserved),
    })),
  })));
}