import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function updateUsuarioPermission({
  usuarioId,
  campo,
  valor
}: {
  usuarioId: string;
  campo: "permisoClientes" | "permisoVencimiento";
  valor: boolean;
}) {
  const { userId, orgId, has } = await auth();
  const canEdit = has({ permission: "org:asistentes:ver_asistentes" });
  if (!orgId || !canEdit) {
    throw new Error("No tenés permisos para editar.");
  }
  const usuarioActualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { [campo]: valor },
  });



  // Buscar el usuario ejecutor en la base de datos (debe existir para la FK)
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });
  if (!orgLocal) {
    throw new Error("Organización no encontrada.");
  }

  const usuarioEjecutor = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: userId, organizacionId: orgLocal.id } },
    select: { id: true }
  });
  if (!usuarioEjecutor) {
    const usuarioEjecutor = await prisma.usuario.findUnique({
      where: { clerkId_organizacionId: { clerkId: userId, organizacionId: orgId } },
      select: { id: true }
    });
    if (!usuarioEjecutor) {
      throw new Error("Usuario ejecutor no encontrado en la base de datos.");
    }
    await prisma.registroAuditoria.create({
      data: {
        organizacionId: orgId,
        ejecutadoPorId: usuarioEjecutor.id,
        usuarioAfectadoId: usuarioId,
        accion: `Cambio de permiso ${campo}`,
        detalleAccion: `El permiso '${campo}' fue cambiado a '${valor ? "habilitado" : "deshabilitado"}' para el usuario ${usuarioActualizado.nombreCompleto} (${usuarioActualizado.email})`,
      },
    });
  }
}
