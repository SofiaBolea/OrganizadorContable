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
          estado: "PENDIENTE",
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
      nombre: titulo,
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
                estado: "PENDIENTE",
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
          estado: o.estado || "PENDIENTE",
        },
      });
    }

    // Crear nuevas ocurrencias
    if (ocurrenciasNuevas.length > 0) {
      await prisma.vencimientoOcurrencia.createMany({
        data: ocurrenciasNuevas.map((o) => ({
          vencimientoId,
          fechaVencimiento: new Date(o.fecha),
          estado: o.estado || "PENDIENTE",
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

export async function getVencimientosParaTabla(orgId: string) {
  try {
    // orgId es el clerkOrganizationId, lo usamos directamente
    // Primero buscamos la organización en la BD
    const organizacion = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
    });

    if (!organizacion) {
      console.warn(`Organización no encontrada para clerkOrganizationId: ${orgId}`);
      return [];
    }

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