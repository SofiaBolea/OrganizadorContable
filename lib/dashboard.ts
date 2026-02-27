import prisma from "./prisma";
import type { TareaAsignacionRow } from "./tareas-shared";
import { marcarVencidasAlLeer, mapToRow } from "./tareas";

/**
 * Obtiene vencimientos próximos ordenados cronológicamente
 */
export async function obtenerVencimientosProximos(
  orgId: string,
  clerkUserId: string,
  dias: number = 30
) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return [];

  // Usar UTC para comparación con campos @db.Date (Prisma los almacena a medianoche UTC)
  const ahora = new Date();
  const hoy = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0));
  
  const hastaDia = new Date(hoy);
  hastaDia.setUTCDate(hastaDia.getUTCDate() + dias);
  hastaDia.setUTCHours(23, 59, 59, 999);

  const vencimientos = await prisma.vencimientoOcurrencia.findMany({
    where: {
      vencimiento: {
        recurso: {
          organizacionId: organizacion.id,
        },
        estado: "ACTIVO",
      },
      fechaVencimiento: {
        gte: hoy,
        lte: hastaDia,
      },
      estado: "ACTIVA",
    },
    include: {
      vencimiento: {
        select: {
          id: true,
          titulo: true,
          tipoVencimiento: true,
          jurisdiccion: true,
        },
      },
    },
    orderBy: {
      fechaVencimiento: "asc",
    },
  });

  return vencimientos;
}

/**
 * Obtiene tareas propias de los próximos 7 días
 */
export async function obtenerTareasPropiasSemanales(
  orgId: string,
  clerkUserId: string,
  dias: number = 7
): Promise<TareaAsignacionRow[]> {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const hastaDia = new Date(hoy);
  hastaDia.setDate(hastaDia.getDate() + dias);
  hastaDia.setHours(23, 59, 59, 999);

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
          descripcionOverride: true,
          fechaOverride: true,
          refColorId: true,
          prioridadOverride: true,
          refColor: { select: { id: true, titulo: true, codigoHexa: true } },
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  await marcarVencidasAlLeer(asignaciones);

  return asignaciones.map(mapToRow);
}

/**
 * Obtiene tareas asignadas de los próximos 7 días
 */
export async function obtenerTareasAsignadasSemanales(
  orgId: string,
  clerkUserId: string,
  dias: number = 7
): Promise<TareaAsignacionRow[]> {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const hastaDia = new Date(hoy);
  hastaDia.setDate(hastaDia.getDate() + dias);
  hastaDia.setHours(23, 59, 59, 999);

  const asignaciones = await prisma.tareaAsignacion.findMany({
    where: {
      asignadoId: usuario.id,
      estado: { not: "REVOCADA" },
      tarea: {
        tipoTarea: "ASIGNADA",
        recurso: { organizacionId: organizacion.id },
      },
    },
    include: {
      tarea: {
        include: {
          recurrencia: true,
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
          descripcionOverride: true,
          fechaOverride: true,
          refColorId: true,
          prioridadOverride: true,
        },
      },
    },
    orderBy: { fechaAsignacion: "desc" },
  });

  await marcarVencidasAlLeer(asignaciones);

  return asignaciones.map(mapToRow);
}

/**
 * Verifica si un usuario tiene tareas asignadas activas
 */
export async function esAsistente(
  orgId: string,
  clerkUserId: string
): Promise<boolean> {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return false;

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: clerkUserId, organizacionId: organizacion.id } },
  });
  if (!usuario) return false;

  const tareaAsignada = await prisma.tareaAsignacion.findFirst({
    where: {
      asignadoId: usuario.id,
      estado: { not: "REVOCADA" },
      tarea: {
        tipoTarea: "ASIGNADA",
        recurso: {
          organizacionId: organizacion.id,
        },
      },
    },
  });

  return !!tareaAsignada;
}
