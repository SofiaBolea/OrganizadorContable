import prisma from "./prisma";

export async function getClientes(orgId: string) {
  // Buscar la organización por su clerkOrganizationId
  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });
  if (!organizacion) return [];

  // Buscar los recursos tipo CLIENTE de la organización y traer el modelo Cliente relacionado
  const recursos = await prisma.recurso.findMany({
    where: {
      organizacionId: organizacion.id,
      tipoRecurso: "CLIENTE",
    },
    include: {
      cliente: true,
    },
  });

  // Mapeamos a un formato más fácil de usar en la tabla
  return recursos
    .filter((r) => r.cliente)
    .map((r) => ({
      id: r.id,
      nombreCompleto: r.cliente?.nombreCompleto || "",
      email: r.cliente?.email || "",
      telefono: r.cliente?.telefono || "",
      estado: r.cliente?.estado || "",
    }));
}
