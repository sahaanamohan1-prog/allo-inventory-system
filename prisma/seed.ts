import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const [sydney, melbourne, brisbane] = await Promise.all([
    prisma.warehouse.create({ data: { name: "Sydney DC", location: "Sydney, NSW" } }),
    prisma.warehouse.create({ data: { name: "Melbourne Hub", location: "Melbourne, VIC" } }),
    prisma.warehouse.create({ data: { name: "Brisbane Store", location: "Brisbane, QLD" } }),
  ]);

  const [headphones, keyboard, webcam, dock] = await Promise.all([
    prisma.product.create({ data: {
      name: "Wireless Headphones",
      description: "Premium ANC headphones, 30hr battery",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    }}),
    prisma.product.create({ data: {
      name: "Mechanical Keyboard",
      description: "TKL, hot-swap switches, RGB backlit",
      imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400",
    }}),
    prisma.product.create({ data: {
      name: "4K Webcam Pro",
      description: "Ultra-wide lens, AI background removal",
      imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400",
    }}),
    prisma.product.create({ data: {
      name: "USB-C Docking Station",
      description: "12-in-1, dual 4K HDMI, 100W PD charging",
      imageUrl: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400",
    }}),
  ]);

  await prisma.stockLevel.createMany({ data: [
    { productId: headphones.id, warehouseId: sydney.id,    total: 12, reserved: 0 },
    { productId: headphones.id, warehouseId: melbourne.id, total: 4,  reserved: 0 },
    { productId: headphones.id, warehouseId: brisbane.id,  total: 1,  reserved: 0 },
    { productId: keyboard.id,   warehouseId: sydney.id,    total: 1,  reserved: 0 },
    { productId: keyboard.id,   warehouseId: melbourne.id, total: 0,  reserved: 0 },
    { productId: webcam.id,     warehouseId: sydney.id,    total: 6,  reserved: 0 },
    { productId: webcam.id,     warehouseId: brisbane.id,  total: 2,  reserved: 0 },
    { productId: dock.id,       warehouseId: melbourne.id, total: 8,  reserved: 0 },
    { productId: dock.id,       warehouseId: brisbane.id,  total: 3,  reserved: 0 },
  ]});

  console.log("✅ Database seeded!");
}

main().catch(console.error).finally(() => prisma.$disconnect());