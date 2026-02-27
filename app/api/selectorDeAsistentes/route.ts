import { NextRequest, NextResponse } from "next/server";
import listarAsistentesIdentificadores from "../../../lib/usuario/asistentes";


export async function GET(request: NextRequest) {
  try {
    const result = await listarAsistentesIdentificadores(request);
    return NextResponse.json(result);
  } catch (error: any) {
    let status = 500;
    let message = error.message || "Error interno";
    if (message.startsWith("UNAUTHORIZED")) status = 403;
    else if (message.startsWith("UNAUTHENTICATED")) status = 401;
    else if (message.startsWith("NOT_FOUND")) status = 404;
    else if (message.startsWith("INVALID")) status = 400;
    else if (message.startsWith("DUPLICATE")) status = 400;
    return NextResponse.json({ success: false, error: message.replace(/^[A-Z_]+: /,"") }, { status });
  }
}
