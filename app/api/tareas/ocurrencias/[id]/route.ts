import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { cancelarOcurrencia } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";

// DELETE: Cancelar una ocurrencia materializada (marca como CANCELADA)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
    if (!puedeEliminar) {
      return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
    }

    const { id } = await params;
    const ocurrencia = await cancelarOcurrencia(id);

    return NextResponse.json({ message: "Ocurrencia cancelada", data: ocurrencia }, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error cancelando ocurrencia";
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
