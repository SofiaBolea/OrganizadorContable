"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateUsuarioPermission(
  usuarioId: string,
  campo: "permisoClientes" | "permisoVencimiento",
  valor: boolean
) {
  const { orgId } = await auth();

  if (!orgId) throw new Error("No autorizado");

  try {
    await prisma.usuario.update({
      where: { 
        id: usuarioId,
        // Seguridad: Solo actualizar si pertenece a la misma organización
        organizacion: { clerkOrganizationId: orgId } 
      },
      data: { [campo]: valor },
    });

    revalidatePath("/asistentes");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando permiso:", error);
    return { success: false };
  }
}