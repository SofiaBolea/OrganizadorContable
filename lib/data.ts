import prisma from "./prisma";

// Verifica si el usuario tiene permiso directo para trabajar con vencimientos (crear, modificar, eliminar)
export async function usuarioPuedeTrabajarConVencimientos(clerkId: string, clerkOrganizationId: string) {
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId }
  });

  if (!organizacion) return false;

  const usuario = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId, organizacionId: organizacion.id } },
    select: { permisoVencimiento: true }
  });
  return !!usuario?.permisoVencimiento;
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