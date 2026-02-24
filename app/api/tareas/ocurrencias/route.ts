import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { materializarOcurrencia, cancelarDesdeAqui, obtenerOcurrenciaMaterializada, obtenerOcurrenciaYTipoTarea, obtenerAsignacionYTipoTarea, obtenerEstadoOcurrenciaActual } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";

// POST: Materializar una ocurrencia
export async function POST(request: NextRequest) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { tareaAsignacionId, fechaOriginal, estado, refColorId, fechaOverride, tituloOverride, colorOverride, prioridadOverride, descripcionOverride } = await request.json();

    if (!tareaAsignacionId || !fechaOriginal) {
      return NextResponse.json({ error: "Datos requeridos: tareaAsignacionId, fechaOriginal" }, { status: 400 });
    }

    // Buscar tipo de tarea por la asignación
    const result = await obtenerAsignacionYTipoTarea(tareaAsignacionId);
    if (!result) {
      return NextResponse.json({ error: "Asignación o tarea no encontrada" }, { status: 404 });
    }

    // Validación especial: si está cambiando de COMPLETADA a PENDIENTE, requiere permiso especial
    // Este permiso lo tiene solo el admin, el asistente NO lo tiene
    if (estado === "PENDIENTE") {
      const estadoActual = await obtenerEstadoOcurrenciaActual(tareaAsignacionId, fechaOriginal);
      if (estadoActual === "COMPLETADA") {
        const puedeRevertir = result.tipoTarea === "ASIGNADA"
          ? await Permisos.puedeCambiarEstadoTareaAsignada()
          : await Permisos.puedeModificarTarea();
        if (!puedeRevertir) {
          return NextResponse.json({ error: "No tienes permisos para revertir una tarea completada a pendiente" }, { status: 403 });
        }
      }
    }

    const ocurrencia = await materializarOcurrencia(
      tareaAsignacionId,
      fechaOriginal,
      { estado, fechaOverride, tituloOverride, refColorId, colorOverride, prioridadOverride, descripcionOverride }
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


    // Buscar tipo de tarea por la asignación (centralizado)
    const result2 = await obtenerAsignacionYTipoTarea(tareaAsignacionId);
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

// GET: Obtener ocurrencia materializada con overrides
export async function GET(request: NextRequest) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tareaAsignacionId = searchParams.get("tareaAsignacionId");
    const fechaOcurrencia = searchParams.get("fechaOcurrencia");

    if (!tareaAsignacionId || !fechaOcurrencia) {
      return NextResponse.json(
        { error: "Parámetros requeridos: tareaAsignacionId, fechaOcurrencia" },
        { status: 400 }
      );
    }

    // Buscar tipo de tarea por la asignación (centralizado)
    const result = await obtenerAsignacionYTipoTarea(tareaAsignacionId);
    if (!result) {
      return NextResponse.json({ error: "Asignación o tarea no encontrada" }, { status: 404 });
    }
    if (result.tipoTarea === "ASIGNADA") {
      const puedeVer = await Permisos.puedeVerTareaAsignada();
      if (!puedeVer) {
        return NextResponse.json({ error: "No tienes permisos para ver tareas asignadas" }, { status: 403 });
      }
    } else {
      const puedeVer = await Permisos.puedeVerTarea();
      if (!puedeVer) {
        return NextResponse.json({ error: "No tienes permisos para ver tareas propias" }, { status: 403 });
      }
    }

    const ocurrencia = await obtenerOcurrenciaMaterializada(tareaAsignacionId, fechaOcurrencia);

    return NextResponse.json(ocurrencia, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno";
    console.error("Error obteniendo ocurrencia:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
