import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { actualizarEstadoAsignacion, eliminarTareaAsignacion, actualizarRefColorAsignacion } from "@/lib/tareas";
import { obtenerAsignacionYTipoTarea } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";

// PUT: Actualizar estado o refColor de una asignación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }


    const { id } = await params;
    // Buscar tipo de tarea por la asignación (centralizado)
    const result = await obtenerAsignacionYTipoTarea(id);
    if (!result) {
      return NextResponse.json({ error: "Asignación o tarea no encontrada" }, { status: 404 });
    }
    if (result.tipoTarea === "ASIGNADA") {
      const puedeModificar = await Permisos.puedeModificarTareaAsignada();
      if (!puedeModificar) {
        return NextResponse.json({ error: "No tienes permisos para modificar tareas asignadas" }, { status: 403 });
      }
    } else {
      const puedeModificar = await Permisos.puedeModificarTarea();
      if (!puedeModificar) {
        return NextResponse.json({ error: "No tienes permisos para modificar tareas propias" }, { status: 403 });
      }
    }
    const body = await request.json();

    if (body.estado !== undefined) {
      const asignacion = await actualizarEstadoAsignacion(id, body.estado);
      return NextResponse.json({ message: "Estado actualizado", data: asignacion });
    }

    if (body.refColorId !== undefined) {
      const asignacion = await actualizarRefColorAsignacion(id, body.refColorId);
      return NextResponse.json({ message: "Color actualizado", data: asignacion });
    }

    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error actualizando asignación";
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// DELETE: Eliminar una asignación específica
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
    // Buscar tipo de tarea por la asignación (centralizado)
    const result2 = await obtenerAsignacionYTipoTarea(id);
    if (!result2) {
      return NextResponse.json({ error: "Asignación o tarea no encontrada" }, { status: 404 });
    }
    if (result2.tipoTarea === "ASIGNADA") {
      const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
      if (!puedeEliminar) {
        return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
      }
    } else {
      const puedeEliminar = await Permisos.puedeEliminarTarea();
      if (!puedeEliminar) {
        return NextResponse.json({ error: "No tienes permisos para eliminar tareas propias" }, { status: 403 });
      }
    }

    await eliminarTareaAsignacion(id);

    return NextResponse.json(
      { message: "Asignación eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error eliminando asignación";
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
