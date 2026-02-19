import prisma from "./prisma";
import type { OcurrenciaMaterializada, RecurrenciaData, TareaAsignacionRow } from "./tareas-shared";

// Re-exportar tipos y funciones puras para que los server components
// puedan seguir importando desde "@/lib/tareas"
export type { OcurrenciaMaterializada, RecurrenciaData, TareaAsignacionRow, TareaDisplayRow } from "./tareas-shared";
export { expandirTareasADisplayRows } from "./tareas-shared";

// ═══════════════════════════════════════
// TIPOS INTERNOS (server-only)
// ═══════════════════════════════════════

interface DatosCrearTarea {
  titulo: string;
  prioridad?: string;
  tipoTarea: "PROPIA" | "ASIGNADA";
  fechaVencimientoBase?: string | null;
  descripcion?: string;
  recurrencia?: {
    frecuencia: string;
    intervalo?: number;
    diaSemana?: string | null;
    diaDelMes?: string | null;
    mesDelAnio?: string | null;
    posicionConjunto?: number | null;
    hastaFecha?: string | null;
    conteoMaximo?: number | null;
  } | null;
  asignadoIds?: string[];
  refColorId?: string | null;
}

interface DatosActualizarTarea {
  titulo?: string;
  prioridad?: string;
  fechaVencimientoBase?: string | null;
  descripcion?: string;
  recurrencia?: {
    frecuencia: string;
    intervalo?: number;
    diaSemana?: string | null;
    diaDelMes?: string | null;
    mesDelAnio?: string | null;
    posicionConjunto?: number | null;
    hastaFecha?: string | null;
    conteoMaximo?: number | null;
  } | null;
  asignadoIds?: string[];
}

// ═══════════════════════════════════════
// CREAR TAREA
// ═══════════════════════════════════════

export async function crearTarea(
  orgId: string,
  clerkUserId: string,
  datos: DatosCrearTarea
) {
  const { titulo, prioridad, tipoTarea, fechaVencimientoBase, descripcion, recurrencia, asignadoIds, refColorId } = datos;

  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) throw new Error("Organización no encontrada");

  const usuarioCreador = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuarioCreador) throw new Error("Usuario no encontrado");

  // Para tareas PROPIA, el asignado es uno mismo
  const idsAsignados = tipoTarea === "PROPIA"
    ? [usuarioCreador.id]
    : (asignadoIds || []);

  if (idsAsignados.length === 0) {
    throw new Error("Debe asignar al menos un usuario");
  }

  const recurso = await prisma.recurso.create({
    data: {
      organizacionId: organizacion.id,
      nombre: titulo,
      descripcion: descripcion || null,
      tipoRecurso: "TAREA",
      tarea: {
        create: {
          titulo,
          prioridad: prioridad || "MEDIA",
          tipoTarea,
          fechaVencimientoBase: fechaVencimientoBase ? new Date(fechaVencimientoBase) : null,
          ...(recurrencia && {
            recurrencia: {
              create: {
                frecuencia: recurrencia.frecuencia,
                intervalo: recurrencia.intervalo || 1,
                diaSemana: recurrencia.diaSemana || null,
                diaDelMes: recurrencia.diaDelMes || null,
                mesDelAnio: recurrencia.mesDelAnio || null,
                posicionConjunto: recurrencia.posicionConjunto || null,
                hastaFecha: recurrencia.hastaFecha ? new Date(recurrencia.hastaFecha) : null,
                conteoMaximo: recurrencia.conteoMaximo || null,
              },
            },
          }),
          asignaciones: {
            create: idsAsignados.map((uid) => ({
              asignadoId: uid,
              asignadoPorId: usuarioCreador.id,
              estado: "PENDIENTE",
              refColorId: tipoTarea === "PROPIA" ? (refColorId || null) : null,
            })),
          },
        },
      },
    },
    include: {
      tarea: {
        include: {
          recurrencia: true,
          asignaciones: {
            include: {
              asignado: { select: { id: true, nombreCompleto: true } },
            },
          },
        },
      },
    },
  });

  return recurso;
}

// ═══════════════════════════════════════
// OBTENER TAREAS PARA TABLA
// ═══════════════════════════════════════

/**
 * Tareas Asignadas - Vista Admin:
 * Todas las tareas ASIGNADA donde el admin es el asignadoPor
 */
export async function getTareasAsignadasAdmin(
  orgId: string,
  clerkUserId: string
): Promise<TareaAsignacionRow[]> {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return [];

  const asignaciones = await prisma.tareaAsignacion.findMany({
    where: {
      asignadoPorId: usuario.id,
      tarea: {
        tipoTarea: "ASIGNADA",
        recurso: { organizacionId: organizacion.id },
      },
    },
    include: {
      tarea: {
        include: {
          recurrencia: true,
          recurso: { select: { descripcion: true } },
        },
      },
      asignado: { select: { id: true, nombreCompleto: true } },
      asignadoPor: { select: { id: true, nombreCompleto: true } },
      refColor: { select: { id: true, titulo: true, codigoHexa: true } },
      ocurrencias: {
        orderBy: { fechaOriginal: "asc" },
        select: {
          id: true,
          fechaOriginal: true,
          estado: true,
          tituloOverride: true,
          colorOverride: true,
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  return asignaciones.map(mapToRow);
}

/**
 * Tareas Asignadas - Vista Asistente:
 * Solo las tareas ASIGNADA donde el asistente es el asignado
 */
export async function getTareasAsignadasAsistente(
  orgId: string,
  clerkUserId: string
): Promise<TareaAsignacionRow[]> {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return [];

  const asignaciones = await prisma.tareaAsignacion.findMany({
    where: {
      asignadoId: usuario.id,
      tarea: {
        tipoTarea: "ASIGNADA",
        recurso: { organizacionId: organizacion.id },
      },
    },
    include: {
      tarea: {
        include: {
          recurrencia: true,
          recurso: { select: { descripcion: true } },
        },
      },
      asignado: { select: { id: true, nombreCompleto: true } },
      asignadoPor: { select: { id: true, nombreCompleto: true } },
      refColor: { select: { id: true, titulo: true, codigoHexa: true } },
      ocurrencias: {
        orderBy: { fechaOriginal: "asc" },
        select: {
          id: true,
          fechaOriginal: true,
          estado: true,
          tituloOverride: true,
          colorOverride: true,
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  return asignaciones.map(mapToRow);
}

/**
 * Mis Tareas: Tareas PROPIA donde el usuario es el asignado
 */
export async function getMisTareas(
  orgId: string,
  clerkUserId: string
): Promise<TareaAsignacionRow[]> {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return [];

  const asignaciones = await prisma.tareaAsignacion.findMany({
    where: {
      asignadoId: usuario.id,
      tarea: {
        tipoTarea: "PROPIA",
        recurso: { organizacionId: organizacion.id },
      },
    },
    include: {
      tarea: {
        include: {
          recurrencia: true,
          recurso: { select: { descripcion: true } },
        },
      },
      asignado: { select: { id: true, nombreCompleto: true } },
      asignadoPor: { select: { id: true, nombreCompleto: true } },
      refColor: { select: { id: true, titulo: true, codigoHexa: true } },
      ocurrencias: {
        orderBy: { fechaOriginal: "asc" },
        select: {
          id: true,
          fechaOriginal: true,
          estado: true,
          tituloOverride: true,
          colorOverride: true,
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  return asignaciones.map(mapToRow);
}

// ═══════════════════════════════════════
// DETALLE DE TAREA (por TareaAsignacion ID)
// ═══════════════════════════════════════

export async function getTareaDetalle(tareaId: string) {
  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: {
      recurso: { select: { organizacionId: true, descripcion: true } },
      recurrencia: true,
      asignaciones: {
        include: {
          asignado: { select: { id: true, nombreCompleto: true, email: true } },
          asignadoPor: { select: { id: true, nombreCompleto: true } },
          refColor: { select: { id: true, titulo: true, codigoHexa: true } },
          ocurrencias: {
            orderBy: { fechaOriginal: "asc" },
          },
        },
      },
    },
  });

  return tarea;
}

// ═══════════════════════════════════════
// ACTUALIZAR TAREA
// ═══════════════════════════════════════

export async function actualizarTarea(
  tareaId: string,
  orgId: string,
  clerkUserId: string,
  datos: DatosActualizarTarea
) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) throw new Error("Organización no encontrada");

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) throw new Error("Usuario no encontrado");

  // Verificar que la tarea pertenece a la organización
  const tareaExistente = await prisma.tarea.findFirst({
    where: {
      id: tareaId,
      recurso: { organizacionId: organizacion.id },
    },
    include: { recurrencia: true },
  });
  if (!tareaExistente) throw new Error("Tarea no encontrada");

  // Actualizar datos de la tarea
  await prisma.tarea.update({
    where: { id: tareaId },
    data: {
      titulo: datos.titulo ?? tareaExistente.titulo,
      prioridad: datos.prioridad ?? tareaExistente.prioridad,
      fechaVencimientoBase: datos.fechaVencimientoBase !== undefined
        ? (datos.fechaVencimientoBase ? new Date(datos.fechaVencimientoBase) : null)
        : tareaExistente.fechaVencimientoBase,
      recurso: {
        update: {
          nombre: datos.titulo ?? tareaExistente.titulo,
          descripcion: datos.descripcion ?? undefined,
        },
      },
    },
  });

  // Actualizar recurrencia
  if (datos.recurrencia !== undefined) {
    if (datos.recurrencia === null) {
      // Eliminar recurrencia si existe
      if (tareaExistente.recurrencia) {
        await prisma.recurrencia.delete({
          where: { tareaId },
        });
      }
    } else {
      if (tareaExistente.recurrencia) {
        await prisma.recurrencia.update({
          where: { tareaId },
          data: {
            frecuencia: datos.recurrencia.frecuencia,
            intervalo: datos.recurrencia.intervalo || 1,
            diaSemana: datos.recurrencia.diaSemana || null,
            diaDelMes: datos.recurrencia.diaDelMes || null,
            mesDelAnio: datos.recurrencia.mesDelAnio || null,
            posicionConjunto: datos.recurrencia.posicionConjunto || null,
            hastaFecha: datos.recurrencia.hastaFecha ? new Date(datos.recurrencia.hastaFecha) : null,
            conteoMaximo: datos.recurrencia.conteoMaximo || null,
          },
        });
      } else {
        await prisma.recurrencia.create({
          data: {
            tareaId,
            frecuencia: datos.recurrencia.frecuencia,
            intervalo: datos.recurrencia.intervalo || 1,
            diaSemana: datos.recurrencia.diaSemana || null,
            diaDelMes: datos.recurrencia.diaDelMes || null,
            mesDelAnio: datos.recurrencia.mesDelAnio || null,
            posicionConjunto: datos.recurrencia.posicionConjunto || null,
            hastaFecha: datos.recurrencia.hastaFecha ? new Date(datos.recurrencia.hastaFecha) : null,
            conteoMaximo: datos.recurrencia.conteoMaximo || null,
          },
        });
      }
    }
  }

  // Actualizar asignaciones si es tarea ASIGNADA
  if (datos.asignadoIds && tareaExistente.tipoTarea === "ASIGNADA") {
    const asignacionesActuales = await prisma.tareaAsignacion.findMany({
      where: { tareaId },
      select: { id: true, asignadoId: true },
    });

    const idsActuales = asignacionesActuales.map((a) => a.asignadoId);
    const idsNuevos = datos.asignadoIds;

    // Eliminar asignaciones que ya no están
    const idsAEliminar = asignacionesActuales
      .filter((a) => !idsNuevos.includes(a.asignadoId))
      .map((a) => a.id);

    if (idsAEliminar.length > 0) {
      await prisma.tareaAsignacion.deleteMany({
        where: { id: { in: idsAEliminar } },
      });
    }

    // Crear nuevas asignaciones
    const idsAAgregar = idsNuevos.filter((id) => !idsActuales.includes(id));
    if (idsAAgregar.length > 0) {
      await prisma.tareaAsignacion.createMany({
        data: idsAAgregar.map((uid) => ({
          tareaId,
          asignadoId: uid,
          asignadoPorId: usuario.id,
          estado: "PENDIENTE",
        })),
      });
    }
  }

  return await getTareaDetalle(tareaId);
}

// ═══════════════════════════════════════
// ELIMINAR
// ═══════════════════════════════════════

/**
 * Eliminar solo una asignación específica
 */
export async function eliminarTareaAsignacion(asignacionId: string) {
  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { id: asignacionId },
    include: { tarea: { include: { asignaciones: true } } },
  });
  if (!asignacion) throw new Error("Asignación no encontrada");

  await prisma.tareaAsignacion.delete({
    where: { id: asignacionId },
  });

  // Si era la última asignación, eliminar la tarea completa
  if (asignacion.tarea.asignaciones.length <= 1) {
    await prisma.tarea.delete({ where: { id: asignacion.tareaId } });
    await prisma.recurso.delete({ where: { id: asignacion.tareaId } });
  }
}

/**
 * Eliminar tarea completa con todas sus asignaciones
 */
export async function eliminarTareaCompleta(tareaId: string) {
  // Cascade delete: Recurso → Tarea → TareaAsignacion → Ocurrencia
  await prisma.recurso.delete({
    where: { id: tareaId },
  });
}

// ═══════════════════════════════════════
// ACTUALIZAR ESTADO DE ASIGNACIÓN
// ═══════════════════════════════════════

export async function actualizarEstadoAsignacion(
  asignacionId: string,
  estado: string
) {
  const asignacion = await prisma.tareaAsignacion.update({
    where: { id: asignacionId },
    data: { estado },
  });
  return asignacion;
}

// ═══════════════════════════════════════
// ACTUALIZAR REF COLOR EN ASIGNACIÓN
// ═══════════════════════════════════════

export async function actualizarRefColorAsignacion(
  asignacionId: string,
  refColorId: string | null
) {
  return await prisma.tareaAsignacion.update({
    where: { id: asignacionId },
    data: { refColorId },
  });
}

// ═══════════════════════════════════════
// OCURRENCIAS (Materializar)
// ═══════════════════════════════════════

export async function materializarOcurrencia(
  tareaAsignacionId: string,
  fechaOriginal: string,
  datos: {
    estado?: string;
    fechaOverride?: string | null;
    tituloOverride?: string | null;
    colorOverride?: string | null;
  }
) {
  // Buscar si ya existe una ocurrencia materializada para esta fecha
  const existente = await prisma.ocurrencia.findFirst({
    where: {
      tareaAsignacionId,
      fechaOriginal: new Date(fechaOriginal),
    },
  });

  if (existente) {
    return await prisma.ocurrencia.update({
      where: { id: existente.id },
      data: {
        estado: datos.estado ?? existente.estado,
        fechaOverride: datos.fechaOverride ? new Date(datos.fechaOverride) : existente.fechaOverride,
        tituloOverride: datos.tituloOverride ?? existente.tituloOverride,
        colorOverride: datos.colorOverride ?? existente.colorOverride,
        fechaEjecucion: datos.estado === "REALIZADA" ? new Date() : existente.fechaEjecucion,
      },
    });
  }

  return await prisma.ocurrencia.create({
    data: {
      tareaAsignacionId,
      fechaOriginal: new Date(fechaOriginal),
      estado: datos.estado || "PENDIENTE",
      fechaOverride: datos.fechaOverride ? new Date(datos.fechaOverride) : null,
      tituloOverride: datos.tituloOverride || null,
      colorOverride: datos.colorOverride || null,
      fechaEjecucion: datos.estado === "REALIZADA" ? new Date() : null,
    },
  });
}

export async function eliminarOcurrencia(ocurrenciaId: string) {
  await prisma.ocurrencia.delete({
    where: { id: ocurrenciaId },
  });
}

// ═══════════════════════════════════════
// REF COLORES
// ═══════════════════════════════════════

export async function getRefColores(orgId: string) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  return await prisma.refColor.findMany({
    where: {
      recurso: { organizacionId: organizacion.id },
    },
    select: {
      id: true,
      titulo: true,
      codigoHexa: true,
    },
    orderBy: { titulo: "asc" },
  });
}

export async function crearRefColor(
  orgId: string,
  titulo: string,
  codigoHexa: string
) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) throw new Error("Organización no encontrada");

  const recurso = await prisma.recurso.create({
    data: {
      organizacionId: organizacion.id,
      nombre: titulo,
      tipoRecurso: "REF_COLOR",
      refColor: {
        create: {
          titulo,
          codigoHexa,
        },
      },
    },
    include: { refColor: true },
  });

  return recurso.refColor!;
}

// ═══════════════════════════════════════
// OBTENER ASISTENTES DE LA ORGANIZACIÓN
// ═══════════════════════════════════════

export async function getAsistentesOrganizacion(orgId: string) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  return await prisma.usuario.findMany({
    where: {
      organizacionId: organizacion.id,
      roles: {
        some: { rol: { nombreRol: "org:member" }, fechaBaja: null },
        none: { rol: { nombreRol: "org:admin" } },
      },
    },
    select: {
      id: true,
      nombreCompleto: true,
      email: true,
    },
    orderBy: { nombreCompleto: "asc" },
  });
}

// ═══════════════════════════════════════
// HELPERS INTERNOS
// ═══════════════════════════════════════

function mapToRow(asignacion: any): TareaAsignacionRow {
  const rec = asignacion.tarea.recurrencia;
  return {
    tareaAsignacionId: asignacion.id,
    tareaId: asignacion.tareaId,
    titulo: asignacion.tarea.titulo,
    prioridad: asignacion.tarea.prioridad,
    tipoTarea: asignacion.tarea.tipoTarea,
    fechaVencimientoBase: asignacion.tarea.fechaVencimientoBase
      ? asignacion.tarea.fechaVencimientoBase.toISOString()
      : null,
    descripcion: asignacion.tarea.recurso?.descripcion || null,
    asignadoId: asignacion.asignado.id,
    asignadoNombre: asignacion.asignado.nombreCompleto,
    asignadoPorId: asignacion.asignadoPor.id,
    asignadoPorNombre: asignacion.asignadoPor.nombreCompleto,
    estado: asignacion.estado,
    fechaAsignacion: asignacion.fechaAsignacion.toISOString(),
    refColorId: asignacion.refColor?.id || null,
    refColorTitulo: asignacion.refColor?.titulo || null,
    refColorHexa: asignacion.refColor?.codigoHexa || null,
    recurrencia: rec
      ? {
          frecuencia: rec.frecuencia,
          intervalo: rec.intervalo,
          diaSemana: rec.diaSemana,
          diaDelMes: rec.diaDelMes,
          mesDelAnio: rec.mesDelAnio,
          hastaFecha: rec.hastaFecha ? rec.hastaFecha.toISOString() : null,
          conteoMaximo: rec.conteoMaximo,
        }
      : null,
    ocurrenciasMaterializadas: (asignacion.ocurrencias || []).map((o: any) => ({
      id: o.id,
      fechaOriginal: o.fechaOriginal.toISOString(),
      estado: o.estado,
      tituloOverride: o.tituloOverride,
      colorOverride: o.colorOverride,
    })),
  };
}
