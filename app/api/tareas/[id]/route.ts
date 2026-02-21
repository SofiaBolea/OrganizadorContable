import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { actualizarTarea, eliminarTareaCompleta, getTareaDetalle } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";

// GET: Detalle de tarea
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const tarea = await getTareaDetalle(id);

    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    const puedeVer = await Permisos.puedeVerTareaAsignada();
    if (!puedeVer) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    return NextResponse.json(tarea);
  } catch (error) {
    console.error("Error obteniendo tarea:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT: Actualizar tarea
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
    const body = await request.json();

    // Verificar si es tarea ASIGNADA (requiere admin) o PROPIA
    const tarea = await getTareaDetalle(id);
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    if (tarea.tipoTarea === "ASIGNADA") {
      const puedeModificar = await Permisos.puedeModificarTareaAsignada();
      if (!puedeModificar) {
        return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
      }
    }

    const updated = await actualizarTarea(id, orgId, userId, body);

    return NextResponse.json(
      { message: "Tarea actualizada exitosamente", data: updated },
      { status: 200 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error actualizando tarea";
    console.error("Error actualizando tarea:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// DELETE: Eliminar tarea completa
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

    const tarea = await getTareaDetalle(id);
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    if (tarea.tipoTarea === "ASIGNADA") {
      const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
      if (!puedeEliminar) {
        return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
      }
    }

    await eliminarTareaCompleta(id);

    return NextResponse.json(
      { message: "Tarea eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error eliminando tarea";
    console.error("Error eliminando tarea:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
