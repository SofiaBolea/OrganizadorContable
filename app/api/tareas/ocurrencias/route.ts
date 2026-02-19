import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { materializarOcurrencia } from "@/lib/tareas";

// POST: Materializar una ocurrencia
export async function POST(request: NextRequest) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { tareaAsignacionId, fechaOriginal, estado, fechaOverride, tituloOverride, colorOverride } = await request.json();

    if (!tareaAsignacionId || !fechaOriginal) {
      return NextResponse.json({ error: "Datos requeridos: tareaAsignacionId, fechaOriginal" }, { status: 400 });
    }

    const ocurrencia = await materializarOcurrencia(
      tareaAsignacionId,
      fechaOriginal,
      { estado, fechaOverride, tituloOverride, colorOverride }
    );

    return NextResponse.json(
      { message: "Ocurrencia materializada", data: ocurrencia },
      { status: 201 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno";
    console.error("Error materializando ocurrencia:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
