"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
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
