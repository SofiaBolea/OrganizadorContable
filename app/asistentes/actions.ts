"use server";

import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Actualiza permisos granulares (Clientes/Vencimientos).
 */
export async function updateUsuarioPermission(
  usuarioId: string,
  campo: "permisoClientes" | "permisoVencimiento",
  valor: boolean
) {
  const { orgId, has } = await auth();

  if (!orgId || !has({ permission: "org:asistentes:editar" })) {
    throw new Error("No tenés permiso para editar asistentes.");
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
    console.error("Error en updateUsuarioPermission:", error);
    return { success: false };
  }
}

/**
 * Registra la baja lógica en DB y elimina la membresía en Clerk.
 */
export async function darBajaMiembro(usuarioId: string) {
  const { orgId, has } = await auth();
  const client = await clerkClient();

  // 1. Validación de seguridad por permiso de Clerk
  if (!orgId || !has({ permission: "org:asistentes:eliminar" })) {
    throw new Error("No tenés permiso para eliminar asistentes.");
  }

  try {
    // 2. Buscar el clerkId del usuario para poder eliminarlo en Clerk
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { clerkId: true }
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado en la base de datos local.");
    }

    // 3. ELIMINACIÓN EN CLERK: Remueve al usuario de la organización
    // Esto es lo que solicitaste como 'organizationship.delete'
    await client.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId: usuario.clerkId,
    });

    // 4. BAJA LÓGICA EN DB LOCAL: Setea la fechaBaja en la tabla intermedia
    await prisma.usuarioRol.updateMany({
      where: {
        usuarioId: usuarioId,
        rol: { organizacion: { clerkOrganizationId: orgId } },
        fechaBaja: null 
      },
      data: { fechaBaja: new Date() },
    });

    // 5. Opcional: Desvincular al usuario de la organización en la tabla Usuario
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { organizacionId: null }
    });

    revalidatePath("/asistentes");
    return { success: true };
  } catch (error: any) {
    console.error("Error en darBajaMiembro:", error);
    return { 
      success: false, 
      error: error.message || "Error al procesar la baja del miembro." 
    };
  }
}

/**
 * Envía una invitación de Clerk a un nuevo miembro.
 */
export async function invitarMiembro(email: string) {
  const { orgId, has } = await auth();
  const client = await clerkClient();

  if (!orgId || !has({ permission: "org:asistentes:invitar" })) {
    throw new Error("No tenés permiso para invitar miembros.");
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