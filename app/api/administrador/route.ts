import { NextResponse } from "next/server";
import { Permisos } from "@/lib/permisos";

export async function GET() {
  const esAdmin = await Permisos.esAdmin();
  return NextResponse.json({ esAdmin });
}