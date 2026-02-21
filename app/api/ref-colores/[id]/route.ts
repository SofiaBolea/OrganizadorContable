import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { actualizarRefColor, eliminarRefColor } from "@/lib/tareas";

// PUT: Actualizar color de referencia del usuario actual
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const { titulo, codigoHexa } = await request.json();

    if (!titulo || !codigoHexa) {
      return NextResponse.json(
        { error: "Se requiere titulo y codigoHexa" },
        { status: 400 }
      );
    }

    const updated = await actualizarRefColor(orgId, userId, id, titulo, codigoHexa);

    return NextResponse.json(
      { message: "Color actualizado exitosamente", data: updated },
      { status: 200 }
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error actualizando color";
    const status = mensaje.includes("no encontrad") ? 404 : 500;
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}

// DELETE: Eliminar color de referencia del usuario actual
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await auth();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    await eliminarRefColor(orgId, userId, id);

    return NextResponse.json(
      { message: "Color eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error eliminando color";
    const status = mensaje.includes("no encontrad") ? 404 : 500;
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
