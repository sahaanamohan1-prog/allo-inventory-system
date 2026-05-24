import { prisma } from "./db";

export async function releaseExpiredReservations() {
  const expired = await prisma.reservation.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
  });

  for (const res of expired) {
    try {
      await prisma.$transaction([
        prisma.reservation.update({
          where: { id: res.id },
          data: { status: "RELEASED" },
        }),
        prisma.stockLevel.update({
          where: { productId_warehouseId: { productId: res.productId, warehouseId: res.warehouseId } },
          data: { reserved: { decrement: res.quantity } },
        }),
      ]);
    } catch (e) {
      console.error("Failed to release", res.id, e);
    }
  }
  return expired.length;
}