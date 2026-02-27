import { NextRequest, NextResponse } from "next/server";
import { listarOrganizaciones, actualizarInformacionExtra } from "@/lib/organizacion";

export async function GET(request: NextRequest) {

    return await listarOrganizaciones(request);
}

export async function POST(request: NextRequest) {
  return await actualizarInformacionExtra(request);
}

