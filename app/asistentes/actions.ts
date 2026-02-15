"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Actualiza permisos granulares en la base de datos local.
 */
export async function updateUsuarioPermission(
  usuarioId: string,
  campo: "permisoClientes" | "permisoVencimiento",
  valor: boolean
) {
  const { orgId, orgRole } = await auth();

  if (!orgId || orgRole !== "org:admin") {
    throw new Error("No tenés permisos para realizar esta acción.");
  }

  try {
    await prisma.usuario.update({
      where: { 
        id: usuarioId,
        organizacion: { clerkOrganizationId: orgId } 
      },
      data: { [campo]: valor },
    });

    revalidatePath("/asistentes");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar permisos:", error);
    return { success: false };
  }
}

/**
 * Registra la baja de un miembro en la tabla intermedia UsuarioRol.
 */
export async function darBajaMiembro(usuarioId: string) {
  const { orgId, orgRole } = await auth();

  if (!orgId || orgRole !== "org:admin") {
    throw new Error("No autorizado.");
  }

  try {
    await prisma.usuarioRol.updateMany({
      where: {
        usuarioId: usuarioId,
        rol: { organizacion: { clerkOrganizationId: orgId } },
        fechaBaja: null 
      },
      data: { fechaBaja: new Date() },
    });

    revalidatePath("/asistentes");
    return { success: true };
  } catch (error) {
    console.error("Error al procesar baja:", error);
    return { success: false };
  }
}

/**
 * Envía una invitación oficial por correo a través de Clerk.
 */
export async function invitarMiembro(email: string) {
  const { orgId, orgRole } = await auth();
  const client = await clerkClient();

  if (!orgId || orgRole !== "org:admin") {
    throw new Error("Solo los administradores pueden invitar miembros.");
  }

  try {
    await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: "org:member", 
    });

    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.errors?.[0]?.message || "Error al enviar invitación." 
    };
  }
}