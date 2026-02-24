import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getTareaDetalle, limpiarOverridesOcurrencias } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";

/**
 * POST: Limpiar overrides en ocurrencias materializadas
 * Se llama después de actualizar campos base de una tarea
 * para que las ocurrencias heredenn los nuevos valores
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { camposParaLimpiar } = body;

    // Verificar que la tarea existe y obtener su tipo
    const tarea = await getTareaDetalle(id);
    if (!tarea) {
      return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
    }

    // Verificar permisos según tipo de tarea
    if (tarea.tipoTarea === "ASIGNADA") {
      const puedeModificar = await Permisos.puedeModificarTareaAsignada();
      if (!puedeModificar) {
        return NextResponse.json(
          { error: "No tienes permisos para modificar tareas asignadas" },
          { status: 403 }
        );
      }
    } else {
      const puedeModificar = await Permisos.puedeModificarTarea();
      if (!puedeModificar) {
        return NextResponse.json(
          { error: "No tienes permisos para modificar tareas" },
          { status: 403 }
        );
      }
    }

    // Validar que camposParaLimpiar sea un objeto
    if (!camposParaLimpiar || typeof camposParaLimpiar !== "object") {
      return NextResponse.json(
        { error: "camposParaLimpiar debe ser un objeto" },
        { status: 400 }
      );
    }

    // Limpiar los overrides especificados
    await limpiarOverridesOcurrencias(id, camposParaLimpiar);

    return NextResponse.json(
      { message: "Overrides limpios exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error limpiando overrides";
    console.error("Error limpiando overrides:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
