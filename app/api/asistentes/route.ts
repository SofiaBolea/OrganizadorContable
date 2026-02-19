import { NextResponse } from "next/server";
import { updateUsuarioPermission } from "../../../lib/usuario/asistentes";

export async function PUT(request: Request) {
  try {
    const { usuarioId, campo, valor } = await request.json();
    await updateUsuarioPermission({ usuarioId, campo, valor });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
