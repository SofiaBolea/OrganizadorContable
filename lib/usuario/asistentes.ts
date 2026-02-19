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
  const { orgId, has } = await auth();
  const canEdit = has({ permission: "org:asistentes:ver_asistentes" });
  if (!orgId || !canEdit) {
    throw new Error("No tenés permisos para editar.");
  }
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { [campo]: valor },
  });
}
