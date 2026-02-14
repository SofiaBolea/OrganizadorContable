import prisma from "./prisma";

export async function getVencimientos(orgId: string) {
  const recursos = await prisma.recurso.findMany({
    where: {
      organizacionId: orgId,
      tipoRecurso: "VENCIMIENTO",
    },
    include: {
      vencimiento: true,
    },
  });

  // Mapeamos a un formato más fácil de usar en la tabla
  return recursos.map((r) => ({
    id: r.id,
    titulo: r.vencimiento?.titulo || "",
    tipoVencimiento: r.vencimiento?.tipoVencimiento || "",
    jurisdiccion: r.vencimiento?.jurisdiccion || null,
    periodicidad: r.vencimiento?.periodicidad || "",
    estado: r.vencimiento?.estado || "",
  }));
}
