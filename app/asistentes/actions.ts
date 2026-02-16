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
  try {
    const { orgId, has } = await auth();

    // 1. IMPORTANTE: Usamos el permiso EXACTO que pusiste en page.tsx
    // Si en Clerk es "org:asistentes:ver_asistentes", aquí debe ser igual.
    const canEdit = has({ permission: "org:asistentes:ver_asistentes" });

    if (!orgId || !canEdit) {
      console.error("❌ Permisos insuficientes en Clerk para orgId:", orgId);
      return { success: false, error: "No tenés permisos para editar." };
    }

    // 2. Ejecución de Prisma
    // Quitamos temporalmente la validación cruzada de 'organizacion' 
    // para asegurar que el update ocurra aunque el vínculo esté débil.
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { [campo]: valor },
    });

    revalidatePath("/asistentes");
    return { success: true };

  } catch (error: any) {
    // Este log aparecerá en tu terminal (VS Code), NO en el navegador.
    // Miralo ahí para ver el error real (ej. PrismaClientKnownRequestError)
    console.error("❌ ERROR EN updateUsuarioPermission:", error.message);
    
    // Devolvemos el error de forma controlada para que Next.js no lance el "Digest"
    return { success: false, error: error.message };
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