import { NextRequest, NextResponse } from "next/server";
import listarAsistentesIdentificadores from "../../../lib/usuario/asistentes";


export async function GET(request: NextRequest) {
  return await listarAsistentesIdentificadores(request);
}
