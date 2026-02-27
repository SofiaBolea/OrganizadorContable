import { NextRequest, NextResponse } from "next/server";
import { updateUsuarioPermission } from "../../../lib/usuario/asistentes";
import { listarAsistentes } from "../../../lib/usuario/asistentes";

export async function PUT(request: Request) {
  try {
    const { usuarioId, campo, valor } = await request.json();
    await updateUsuarioPermission({ usuarioId, campo, valor });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await listarAsistentes(request);
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
