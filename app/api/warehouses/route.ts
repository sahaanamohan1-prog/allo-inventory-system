import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await prisma.warehouse.findMany());
}