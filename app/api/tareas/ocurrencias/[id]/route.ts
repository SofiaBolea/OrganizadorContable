import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { cancelarOcurrencia } from "@/lib/tareas";
import { obtenerOcurrenciaYTipoTarea } from "@/lib/tareas";
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

    const { id } = await params;
    // Usar función utilitaria para obtener ocurrencia y tipo de tarea
    const result = await obtenerOcurrenciaYTipoTarea(id);
    if (!result) {
      return NextResponse.json({ error: "Ocurrencia o tarea no encontrada" }, { status: 404 });
    }
    const { tipoTarea } = result;
    if (tipoTarea === "ASIGNADA") {
      const tienePermiso = await Permisos.puedeEliminarTareaAsignada();
      if (!tienePermiso) {
        return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
      }
    } else {
      const tienePermiso = await Permisos.puedeEliminarTarea();
      if (!tienePermiso) {
        return NextResponse.json({ error: "No tienes permisos para eliminar tareas propias" }, { status: 403 });
      }
    }
    const ocurrencia = await cancelarOcurrencia(id);
    return NextResponse.json({ message: "Ocurrencia cancelada", data: ocurrencia }, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error cancelando ocurrencia";
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
