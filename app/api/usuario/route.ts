import { NextRequest } from "next/server";
import { listarInfoUsuario } from "@/lib/usuario/usuario";
import { actualizarInformacionExtraUsuario } from "@/lib/usuario/usuario";


export async function GET(request: NextRequest) {
    return await listarInfoUsuario(request);
}

export async function POST(request: NextRequest) {
  return await actualizarInformacionExtraUsuario(request);
}
