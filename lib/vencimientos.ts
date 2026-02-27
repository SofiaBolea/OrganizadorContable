import prisma from "./prisma";

export async function crearOcurrenciasVencimiento(
  orgId: string,
  vencimientoId: string,
  fechas: string[]
) {
  // Buscar la organización interna
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });

  if (!organizacion) {
    throw new Error("Organización no encontrada en DB");
  }

  // Verificar que el vencimiento existe y pertenece a la organización
  const vencimiento = await prisma.vencimiento.findFirst({
    where: {
      id: vencimientoId,
      recurso: {
        organizacionId: organizacion.id,
      },
    },
  });

  if (!vencimiento) {
    throw new Error("Vencimiento no encontrado");
  }

  // Crear las ocurrencias
  const ocurrenciasCreadas = await Promise.all(
    fechas.map((fecha) =>
      prisma.vencimientoOcurrencia.create({
        data: {
          vencimientoId,
          fechaVencimiento: new Date(fecha),
          estado: "ACTIVA",
        },
      })
    )
  );

  return ocurrenciasCreadas;
}

export async function eliminarOcurrenciaVencimiento(
  orgId: string,
  ocurrenciaId: string,
  deleteFollowing: boolean = false
) {
  // Buscar la organización interna
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });

  if (!organizacion) {
    throw new Error("Organización no encontrada");
  }

  // Buscar la ocurrencia con su vencimiento y recurso
  const ocurrencia = await prisma.vencimientoOcurrencia.findUnique({
    where: { id: ocurrenciaId },
    include: {
      vencimiento: {
        include: {
          recurso: true,
        },
      },
    },
  });

  if (!ocurrencia) {
    throw new Error("Ocurrencia no encontrada");
  }

  // Verificar que pertenece a la organización del usuario
  if (ocurrencia.vencimiento.recurso.organizacionId !== organizacion.id) {
    throw new Error("No tienes permisos para eliminar esta ocurrencia");
  }

  // Si deleteFollowing es true, eliminar esta y todas las siguientes
  if (deleteFollowing) {
    const idsAEliminar = await prisma.vencimientoOcurrencia.findMany({
      where: {
        vencimientoId: ocurrencia.vencimientoId,
        fechaVencimiento: {
          gte: ocurrencia.fechaVencimiento,
        },
      },
      select: { id: true },
    });

    await prisma.vencimientoOcurrencia.deleteMany({
      where: {
        id: {
          in: idsAEliminar.map((o) => o.id),
        },
      },
    });
  } else {
    await prisma.vencimientoOcurrencia.delete({
      where: { id: ocurrenciaId },
    });
  }

  // Evaluar si el vencimiento padre debe pasar a BAJA
  await evaluarEstadoVencimiento(ocurrencia.vencimientoId);
}

interface DatosCrearVencimiento {
  titulo: string;
  tipoVencimiento: string;
  periodicidad: string;
  jurisdiccion?: string | null;
  fechas?: string[];
}

export async function crearVencimiento(
  orgId: string,
  userId: string,
  datos: DatosCrearVencimiento
) {
  const { titulo, tipoVencimiento, periodicidad, jurisdiccion, fechas } = datos;

  // Buscar organización por clerkOrganizationId
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });

  if (!organizacion) {
    throw new Error("Organización no encontrada en DB");
  }

  // Buscar usuario por clerkId_organizacionId
  const usuario = await prisma.usuario.findUnique({
    where: {
      clerkId_organizacionId: {
        clerkId: userId,
        organizacionId: organizacion.id,
      },
    },
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado en DB");
  }

  // Crear recurso con vencimiento y ocurrencias
  const recurso = await prisma.recurso.create({
    data: {
      organizacionId: organizacion.id,
      tipoRecurso: "VENCIMIENTO",
      vencimiento: {
        create: {
          usuarioCreadorId: usuario.id,
          tipoVencimiento,
          periodicidad,
          jurisdiccion: jurisdiccion || null,
          estado: "ACTIVO",
          titulo,
          ...(fechas && fechas.length > 0 && {
            ocurrencias: {
              create: fechas.map((fecha) => ({
                fechaVencimiento: new Date(fecha),
                estado: "ACTIVA",
              })),
            },
          }),
        },
      },
    },
    include: {
      vencimiento: {
        include: {
          ocurrencias: true,
        },
      },
    },
  });

  return recurso;
}

interface OcurrenciaInput {
  id?: string;
  fecha: string;
  estado?: string;
}

interface DatosActualizarVencimiento {
  titulo: string;
  tipoVencimiento: string;
  periodicidad: string;
  jurisdiccion?: string | null;
  ocurrencias?: OcurrenciaInput[];
}

export async function actualizarVencimiento(
  vencimientoId: string,
  datos: DatosActualizarVencimiento
) {
  const { titulo, tipoVencimiento, periodicidad, jurisdiccion, ocurrencias } = datos;

  // Actualizar ocurrencias si se proporcionan
  if (ocurrencias && Array.isArray(ocurrencias) && ocurrencias.length > 0) {
    const ocurrenciasExistentes = ocurrencias.filter((o) => o.id);
    const ocurrenciasNuevas = ocurrencias.filter((o) => !o.id);
    const idsEnRequest = ocurrenciasExistentes.map((o) => o.id!);

    // Traer ocurrencias actuales de la BD
    const ocurrenciasAnteriores = await prisma.vencimientoOcurrencia.findMany({
      where: { vencimientoId },
    });

    // Eliminar las que no están en la request
    const idsAEliminar = ocurrenciasAnteriores
      .map((o) => o.id)
      .filter((id) => !idsEnRequest.includes(id));

    if (idsAEliminar.length > 0) {
      await prisma.vencimientoOcurrencia.deleteMany({
        where: { id: { in: idsAEliminar } },
      });
    }

    // Actualizar ocurrencias existentes
    for (const o of ocurrenciasExistentes) {
      await prisma.vencimientoOcurrencia.update({
        where: { id: o.id },
        data: {
          fechaVencimiento: new Date(o.fecha),
          estado: o.estado || "ACTIVA",
        },
      });
    }

    // Crear nuevas ocurrencias
    if (ocurrenciasNuevas.length > 0) {
      await prisma.vencimientoOcurrencia.createMany({
        data: ocurrenciasNuevas.map((o) => ({
          vencimientoId,
          fechaVencimiento: new Date(o.fecha),
          estado: o.estado || "ACTIVA",
        })),
      });
    }
  } else if (ocurrencias && Array.isArray(ocurrencias) && ocurrencias.length === 0) {
    // Si array vacío, eliminar todas las ocurrencias
    await prisma.vencimientoOcurrencia.deleteMany({
      where: { vencimientoId },
    });
  }

  // Update principal del vencimiento
  const updated = await prisma.vencimiento.update({
    where: { id: vencimientoId },
    data: {
      titulo,
      periodicidad,
      jurisdiccion,
      tipoVencimiento,
    },
    include: {
      ocurrencias: {
        orderBy: { fechaVencimiento: "asc" },
      },
    },
  });

  return updated;
}

/**
 * Evalúa si un vencimiento padre debe pasar a "BAJA".
 * Si no le quedan ocurrencias, se pone en estado "BAJA".
 */
async function evaluarEstadoVencimiento(vencimientoId: string) {
  const count = await prisma.vencimientoOcurrencia.count({
    where: { vencimientoId },
  });

  if (count === 0) {
    await prisma.vencimiento.update({
      where: { id: vencimientoId },
      data: { estado: "BAJA" },
    });
  }
}

/**
 * Elimina de la BD todas las ocurrencias cuya fechaVencimiento ya pasó.
 * Luego evalúa si cada vencimiento padre afectado debe pasar a "BAJA".
 */
async function eliminarOcurrenciasVencidasAlLeer(organizacionId: string) {
  // Crear fecha de hoy a medianoche UTC para comparación consistente
  const hoy = new Date();
  const hoyDate = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), 0, 0, 0, 0));

  // Buscar ocurrencias vencidas para saber qué vencimientos padres se afectan
  const ocurrenciasVencidas = await prisma.vencimientoOcurrencia.findMany({
    where: {
      fechaVencimiento: { lt: hoyDate },
      vencimiento: {
        recurso: { organizacionId },
      },
    },
    select: { id: true, vencimientoId: true },
  });

  if (ocurrenciasVencidas.length === 0) return;

  // Eliminar las ocurrencias vencidas
  await prisma.vencimientoOcurrencia.deleteMany({
    where: {
      id: { in: ocurrenciasVencidas.map((o) => o.id) },
    },
  });

  // Evaluar cada vencimiento padre afectado
  const vencimientoIdsAfectados = [...new Set(ocurrenciasVencidas.map((o) => o.vencimientoId))];
  for (const vId of vencimientoIdsAfectados) {
    await evaluarEstadoVencimiento(vId);
  }
}

export async function getVencimientosParaTabla(orgId: string) {
  try {
    const organizacion = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
    });

    if (!organizacion) {
      console.warn(`Organización no encontrada para clerkOrganizationId: ${orgId}`);
      return [];
    }

    // Eliminar ocurrencias vencidas y evaluar padres
    await eliminarOcurrenciasVencidasAlLeer(organizacion.id);

    return await prisma.vencimientoOcurrencia.findMany({
      where: {
        vencimiento: {
          recurso: {
            organizacionId: organizacion.id,
          },
        },
      },
      include: {
        vencimiento: true,
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    });
  } catch (error) {
    console.error("Error en getVencimientosParaTabla:", error);
    return [];
  }
}