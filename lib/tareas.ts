import prisma from "./prisma";
import type { OcurrenciaMaterializada, RecurrenciaData, TareaAsignacionRow } from "./tareas-shared";
import { generarFechasRecurrencia, formatDateISO } from "./tareas-shared";

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
              estado: "ACTIVA",
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
          fechaOverride: true,
          colorOverride: true,
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  // Marcar como VENCIDA las que correspondan
  await marcarVencidasAlLeer(asignaciones);

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
      estado: { not: "REVOCADA" }, // No mostrar asignaciones revocadas al asistente
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
          fechaOverride: true,
          colorOverride: true,
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  // Marcar como VENCIDA las que correspondan
  await marcarVencidasAlLeer(asignaciones);

  return asignaciones.map(mapToRow);
}

/**
 * Mis Tareas: Tareas PROPIA donde el usuario es el asignado
 */
export async function getTareasPropias(
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
          fechaOverride: true,
          colorOverride: true,
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  // Marcar como VENCIDA las que correspondan
  await marcarVencidasAlLeer(asignaciones);

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
      select: { id: true, asignadoId: true, estado: true },
    });

    const idsActuales = asignacionesActuales.map((a) => a.asignadoId);
    const idsNuevos = datos.asignadoIds;

    // Revocar asignaciones que ya no están (en vez de eliminar)
    const asignacionesARevocar = asignacionesActuales
      .filter((a) => !idsNuevos.includes(a.asignadoId) && a.estado !== "REVOCADA");

    if (asignacionesARevocar.length > 0) {
      await prisma.tareaAsignacion.updateMany({
        where: { id: { in: asignacionesARevocar.map((a) => a.id) } },
        data: { estado: "REVOCADA" },
      });
    }

    // Crear nuevas asignaciones
    // Excluir los que ya tienen asignación (incluso REVOCADA, se reactiva)
    const idsAAgregar = idsNuevos.filter((id) => !idsActuales.includes(id));
    if (idsAAgregar.length > 0) {
      await prisma.tareaAsignacion.createMany({
        data: idsAAgregar.map((uid) => ({
          tareaId,
          asignadoId: uid,
          asignadoPorId: usuario.id,
          estado: "ACTIVA",
        })),
      });
    }

    // Reactivar asignaciones que estaban REVOCADA y ahora vuelven a estar asignadas
    const idsAReactivar = asignacionesActuales
      .filter((a) => idsNuevos.includes(a.asignadoId) && a.estado === "REVOCADA")
      .map((a) => a.id);

    if (idsAReactivar.length > 0) {
      await prisma.tareaAsignacion.updateMany({
        where: { id: { in: idsAReactivar } },
        data: { estado: "ACTIVA" },
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

/**
 * Evalúa si una TareaAsignacion debe cambiar a COMPLETADA o FINALIZADA.
 * Se llama después de cambiar el estado de una ocurrencia.
 * 
 * - COMPLETADA: todas las ocurrencias son COMPLETADA
 * - FINALIZADA: todas tienen estado final (COMPLETADA + VENCIDA + CANCELADA),
 *   pero no todas son COMPLETADA (hay al menos una VENCIDA o CANCELADA)
 * - Si hay alguna PENDIENTE, no cambia nada
 */
async function evaluarEstadoAsignacion(tareaAsignacionId: string): Promise<void> {
  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { id: tareaAsignacionId },
    include: {
      ocurrencias: { select: { estado: true } },
    },
  });

  if (!asignacion) return;
  // No tocar REVOCADA
  if (asignacion.estado === "REVOCADA") return;

  const ocurrencias = asignacion.ocurrencias;
  if (ocurrencias.length === 0) return; // Aún no hay materializadas

  const estados = ocurrencias.map((o) => o.estado);
  const hayPendientes = estados.some((e) => e === "PENDIENTE");

  if (hayPendientes) {
    // Si hay pendientes pero la asignación ya estaba COMPLETADA/FINALIZADA,
    // revertir a ACTIVA (el usuario deshizo la completación)
    if (["COMPLETADA", "FINALIZADA"].includes(asignacion.estado)) {
      await prisma.tareaAsignacion.update({
        where: { id: tareaAsignacionId },
        data: { estado: "ACTIVA" },
      });
    }
    return;
  }

  // Todas las ocurrencias tienen estado final (COMPLETADA, VENCIDA, CANCELADA)
  const todasCompletadas = estados.every((e) => e === "COMPLETADA");
  const nuevoEstado = todasCompletadas ? "COMPLETADA" : "FINALIZADA";

  if (asignacion.estado !== nuevoEstado) {
    await prisma.tareaAsignacion.update({
      where: { id: tareaAsignacionId },
      data: { estado: nuevoEstado },
    });
  }
}

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

  let resultado;

  if (existente) {
    resultado = await prisma.ocurrencia.update({
      where: { id: existente.id },
      data: {
        estado: datos.estado !== undefined ? datos.estado : existente.estado,
        fechaOverride: datos.fechaOverride !== undefined
          ? (datos.fechaOverride ? new Date(datos.fechaOverride) : null)
          : existente.fechaOverride,
        tituloOverride: datos.tituloOverride !== undefined ? datos.tituloOverride : existente.tituloOverride,
        colorOverride: datos.colorOverride !== undefined ? datos.colorOverride : existente.colorOverride,
        fechaEjecucion: datos.estado === "COMPLETADA" ? new Date() : existente.fechaEjecucion,
      },
    });
  } else {
    resultado = await prisma.ocurrencia.create({
      data: {
        tareaAsignacionId,
        fechaOriginal: new Date(fechaOriginal),
        estado: datos.estado || "PENDIENTE",
        fechaOverride: datos.fechaOverride ? new Date(datos.fechaOverride) : null,
        tituloOverride: datos.tituloOverride || null,
        colorOverride: datos.colorOverride !== undefined ? datos.colorOverride : null,
        fechaEjecucion: datos.estado === "COMPLETADA" ? new Date() : null,
      },
    });
  }

  // Después de cambiar estado, evaluar si la asignación debe cambiar
  if (datos.estado) {
    await evaluarEstadoAsignacion(tareaAsignacionId);
  }

  return resultado;
}

export async function cancelarOcurrencia(ocurrenciaId: string) {
  const ocurrencia = await prisma.ocurrencia.update({
    where: { id: ocurrenciaId },
    data: { estado: "CANCELADA" },
  });

  // Evaluar si la asignación debe cambiar de estado
  await evaluarEstadoAsignacion(ocurrencia.tareaAsignacionId);

  return ocurrencia;
}

/**
 * Cancelar una ocurrencia virtual (que aún no existe en BD).
 * La materializa con estado CANCELADA.
 */
export async function cancelarOcurrenciaVirtual(
  tareaAsignacionId: string,
  fechaOriginal: string
) {
  const ocurrencia = await prisma.ocurrencia.create({
    data: {
      tareaAsignacionId,
      fechaOriginal: new Date(fechaOriginal),
      estado: "CANCELADA",
    },
  });

  await evaluarEstadoAsignacion(tareaAsignacionId);

  return ocurrencia;
}

/**
 * Cancelar todas las ocurrencias desde una fecha en adelante.
 * - Modifica la recurrencia hastaFecha al día anterior
 * - Marca como CANCELADA las ocurrencias materializadas que estén en esa fecha o después
 */
export async function cancelarDesdeAqui(
  tareaAsignacionId: string,
  fechaDesde: string
) {
  const asignacion = await prisma.tareaAsignacion.findUnique({
    where: { id: tareaAsignacionId },
    include: {
      tarea: { include: { recurrencia: true } },
      ocurrencias: true,
    },
  });

  if (!asignacion) throw new Error("Asignación no encontrada");
  if (!asignacion.tarea.recurrencia) throw new Error("Solo se puede cancelar desde aquí en tareas recurrentes");

  // Calcular el día anterior como nueva hastaFecha
  const fechaCorte = new Date(fechaDesde.split("T")[0] + "T12:00:00");
  const diaAnterior = new Date(fechaCorte);
  diaAnterior.setDate(diaAnterior.getDate() - 1);

  // Actualizar hastaFecha de la recurrencia
  await prisma.recurrencia.update({
    where: { tareaId: asignacion.tareaId },
    data: { hastaFecha: diaAnterior },
  });

  // Marcar como CANCELADA las ocurrencias materializadas en esa fecha o después
  const ocurrenciasACancelar = asignacion.ocurrencias.filter((oc) => {
    const fechaOc = new Date(oc.fechaOriginal);
    fechaOc.setHours(0, 0, 0, 0);
    fechaCorte.setHours(0, 0, 0, 0);
    return fechaOc >= fechaCorte && oc.estado === "PENDIENTE";
  });

  if (ocurrenciasACancelar.length > 0) {
    await prisma.ocurrencia.updateMany({
      where: { id: { in: ocurrenciasACancelar.map((oc) => oc.id) } },
      data: { estado: "CANCELADA" },
    });
  }

  await evaluarEstadoAsignacion(tareaAsignacionId);

  return { canceladas: ocurrenciasACancelar.length, nuevaHastaFecha: diaAnterior.toISOString() };
}

// ═══════════════════════════════════════
// REF COLORES
// ═══════════════════════════════════════

export async function getRefColores(orgId: string, clerkUserId: string) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return [];

  return await prisma.refColor.findMany({
    where: {
      usuarioId: usuario.id,
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
  clerkUserId: string,
  titulo: string,
  codigoHexa: string
) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) throw new Error("Organización no encontrada");

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) throw new Error("Usuario no encontrado");

  const recurso = await prisma.recurso.create({
    data: {
      organizacionId: organizacion.id,
      tipoRecurso: "REF_COLOR",
      refColor: {
        create: {
          titulo,
          codigoHexa,
          usuarioId: usuario.id,
        },
      },
    },
    include: { refColor: true },
  });

  return recurso.refColor!;
}

export async function actualizarRefColor(
  orgId: string,
  clerkUserId: string,
  refColorId: string,
  titulo: string,
  codigoHexa: string
) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) throw new Error("Organización no encontrada");

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) throw new Error("Usuario no encontrado");

  // Verificar que pertenece al usuario
  const refColor = await prisma.refColor.findFirst({
    where: { id: refColorId, usuarioId: usuario.id, recurso: { organizacionId: organizacion.id } },
  });
  if (!refColor) throw new Error("Color de referencia no encontrado");

  const updated = await prisma.refColor.update({
    where: { id: refColorId },
    data: { titulo, codigoHexa },
  });

  // Actualizar nombre del recurso tambié
  return updated;
}

export async function eliminarRefColor(orgId: string, clerkUserId: string, refColorId: string) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) throw new Error("Organización no encontrada");

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) throw new Error("Usuario no encontrado");

  const refColor = await prisma.refColor.findFirst({
    where: { id: refColorId, usuarioId: usuario.id, recurso: { organizacionId: organizacion.id } },
  });
  if (!refColor) throw new Error("Color de referencia no encontrado");

  // Al borrar el recurso, se borra en cascada el refColor
  await prisma.recurso.delete({ where: { id: refColorId } });
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

/**
 * Marca como VENCIDA las ocurrencias PENDIENTES cuya fecha ya pasó.
 * Para tareas sin recurrencia, crea una ocurrencia con estado VENCIDA
 * si su fechaVencimientoBase ya pasó y la asignación está ACTIVA.
 * 
 * Se ejecuta al leer las tareas para mantener los estados actualizados
 * sin necesidad de un cron job.
 */
async function marcarVencidasAlLeer(asignaciones: any[]): Promise<void> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const idsOcurrenciasAVencer: string[] = [];
  // Para tareas únicas sin ocurrencia existente: crear una con VENCIDA
  const ocurrenciasACrear: { tareaAsignacionId: string; fechaOriginal: Date; asigIndex: number }[] = [];

  for (let i = 0; i < asignaciones.length; i++) {
    const asig = asignaciones[i];
    const tieneRecurrencia = !!asig.tarea.recurrencia;

    // Marcar ocurrencias materializadas PENDIENTES cuya fecha ya pasó
    for (const oc of asig.ocurrencias || []) {
      if (oc.estado === "PENDIENTE") {
        const fechaOc = new Date(oc.fechaOriginal);
        fechaOc.setHours(0, 0, 0, 0);
        if (fechaOc < hoy) {
          idsOcurrenciasAVencer.push(oc.id);
          oc.estado = "VENCIDA"; // Actualizar en memoria también
        }
      }
    }

    // Para tareas sin recurrencia: si no tiene ocurrencia y la fecha pasó,
    // crear una ocurrencia con estado VENCIDA
    if (
      !tieneRecurrencia &&
      asig.tarea.fechaVencimientoBase &&
      asig.estado === "ACTIVA"
    ) {
      const fechaVenc = new Date(asig.tarea.fechaVencimientoBase);
      fechaVenc.setHours(0, 0, 0, 0);
      if (fechaVenc < hoy) {
        const ocurrencias = asig.ocurrencias || [];
        const yaResuelta = ocurrencias.some(
          (oc: any) => ["COMPLETADA", "VENCIDA", "CANCELADA"].includes(oc.estado)
        );
        if (!yaResuelta && !ocurrencias.some((oc: any) => idsOcurrenciasAVencer.includes(oc.id))) {
          ocurrenciasACrear.push({
            tareaAsignacionId: asig.id,
            fechaOriginal: asig.tarea.fechaVencimientoBase,
            asigIndex: i,
          });
        }
      }
    }

    // Para tareas CON recurrencia: materializar ocurrencias virtuales vencidas
    if (tieneRecurrencia && asig.estado === "ACTIVA" && asig.tarea.recurrencia) {
      const rec = asig.tarea.recurrencia;
      const recData: RecurrenciaData = {
        frecuencia: rec.frecuencia,
        intervalo: rec.intervalo,
        diaSemana: rec.diaSemana,
        diaDelMes: rec.diaDelMes,
        mesDelAnio: rec.mesDelAnio,
        hastaFecha: rec.hastaFecha ? rec.hastaFecha.toISOString() : null,
        conteoMaximo: rec.conteoMaximo,
      };
      const fechaBaseStr = asig.tarea.fechaVencimientoBase
        ? asig.tarea.fechaVencimientoBase.toISOString()
        : null;
      const fechasGeneradas = generarFechasRecurrencia(recData, fechaBaseStr);
      const hoyStr = formatDateISO(hoy);
      const ocurrencias = asig.ocurrencias || [];

      // Índice de ocurrencias materializadas por fechaOriginal (YYYY-MM-DD)
      const matPorFecha = new Map<string, any>();
      for (const oc of ocurrencias) {
        const key = formatDateISO(new Date(oc.fechaOriginal));
        matPorFecha.set(key, oc);
      }

      for (const fechaStr of fechasGeneradas) {
        if (fechaStr >= hoyStr) break; // Solo fechas pasadas
        if (matPorFecha.has(fechaStr)) continue; // Ya materializada
        ocurrenciasACrear.push({
          tareaAsignacionId: asig.id,
          fechaOriginal: new Date(fechaStr + "T12:00:00"),
          asigIndex: i,
        });
      }
    }
  }

  // Batch update: ocurrencias existentes PENDIENTE → VENCIDA
  if (idsOcurrenciasAVencer.length > 0) {
    await prisma.ocurrencia.updateMany({
      where: { id: { in: idsOcurrenciasAVencer } },
      data: { estado: "VENCIDA" },
    });
  }

  // Crear ocurrencias nuevas para tareas únicas vencidas
  for (const { tareaAsignacionId, fechaOriginal, asigIndex } of ocurrenciasACrear) {
    const nuevaOc = await prisma.ocurrencia.create({
      data: {
        tareaAsignacionId,
        fechaOriginal: new Date(fechaOriginal),
        estado: "VENCIDA",
      },
    });
    // Agregar a la memoria para que mapToRow la incluya
    if (!asignaciones[asigIndex].ocurrencias) {
      asignaciones[asigIndex].ocurrencias = [];
    }
    asignaciones[asigIndex].ocurrencias.push({
      id: nuevaOc.id,
      fechaOriginal: nuevaOc.fechaOriginal,
      estado: "VENCIDA",
      tituloOverride: null,
      fechaOverride: null,
      colorOverride: null,
    });
  }

  // Evaluar si alguna asignación afectada debe pasar a COMPLETADA/FINALIZADA
  const asignacionesAfectadas = new Set<string>();
  for (const asig of asignaciones) {
    if ((asig.ocurrencias || []).some((oc: any) => idsOcurrenciasAVencer.includes(oc.id))) {
      asignacionesAfectadas.add(asig.id);
    }
  }
  for (const { tareaAsignacionId } of ocurrenciasACrear) {
    asignacionesAfectadas.add(tareaAsignacionId);
  }
  for (const asigId of asignacionesAfectadas) {
    await evaluarEstadoAsignacion(asigId);
  }
}

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
      fechaOverride: o.fechaOverride ? o.fechaOverride.toISOString() : null,
      colorOverride: o.colorOverride,
    })),
  };
}
