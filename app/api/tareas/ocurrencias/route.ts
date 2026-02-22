import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { materializarOcurrencia, cancelarDesdeAqui } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";
<<<<<<< HEAD
=======

>>>>>>> development

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

    const puedeModificar = await Permisos.puedeCambiarEstadoTareaAsignada();
    if (!puedeModificar) {
      return NextResponse.json({ error: "No tienes permisos para cambiar el estado de tareas asignadas" }, { status: 403 });
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

// PATCH: Cancelar todas las ocurrencias desde una fecha en adelante
export async function PATCH(request: NextRequest) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { tareaAsignacionId, fechaDesde } = await request.json();

    if (!tareaAsignacionId || !fechaDesde) {
      return NextResponse.json({ error: "Datos requeridos: tareaAsignacionId, fechaDesde" }, { status: 400 });
    }

    const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
    if (!puedeEliminar) {
      return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
    }

    const resultado = await cancelarDesdeAqui(tareaAsignacionId, fechaDesde);

    return NextResponse.json(
      { message: "Ocurrencias canceladas desde la fecha indicada", data: resultado },
      { status: 200 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno";
    console.error("Error cancelando ocurrencias:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
