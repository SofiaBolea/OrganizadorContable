"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Definimos la interfaz para los datos que recibimos del formulario
interface CrearClienteInput {
  nombreCompleto: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  asistentesIds: string[]; // IDs internos de nuestra DB (CUIDs)
}

export async function crearClienteAction(data: CrearClienteInput) {
  const { orgId, has } = await auth();

  // 1. Verificación de Seguridad (Clerk)
  // Validamos que el usuario esté en una organización y tenga el permiso específico
  if (!orgId || !has({ permission: "org:clientes:crear_cliente" })) {
    return { 
      success: false, 
      error: "No tienes los permisos necesarios para realizar esta acción." 
    };
  }

  // 2. Validación básica de campos obligatorios (Caso de Uso Paso 4)
  if (!data.nombreCompleto || data.nombreCompleto.trim().length === 0) {
    return { success: false, error: "El nombre completo es obligatorio." };
  }

  if (data.nombreCompleto.length > 255) {
    return { success: false, error: "El nombre no puede superar los 255 caracteres." };
  }

  try {
    // 3. Buscar el ID interno de la Organización en nuestra DB
    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true }
    });

    if (!orgLocal) {
      return { success: false, error: "La organización no está sincronizada localmente." };
    }

    // 4. Iniciar Transacción Atómica (Paso 5 del Caso de Uso)
    // Usamos $transaction para que si algo falla, no se cree nada a medias
    const nuevoCliente = await prisma.$transaction(async (tx) => {
      
      // A. Crear el Recurso base (TPT)
      const recurso = await tx.recurso.create({
        data: {
          organizacionId: orgLocal.id,
          nombre: data.nombreCompleto,
          tipoRecurso: "CLIENTE",
          descripcion: `Recurso cliente creado para ${data.nombreCompleto}`
        },
      });

      // B. Crear el Cliente vinculado al Recurso
      // Usamos el mismo ID que el recurso para mantener la relación 1:1 (TPT)
      const cliente = await tx.cliente.create({
        data: {
          id: recurso.id,
          nombreCompleto: data.nombreCompleto,
          cuit: data.cuit || null,
          email: data.email || null,
          telefono: data.telefono || null,
          estado: "ACTIVO",
        },
      });

      // C. Registrar asignaciones a asistentes (Si hay seleccionados)
      if (data.asistentesIds.length > 0) {
        // En tu esquema actual no estaba la tabla intermedia, 
        // asumimos la creación según el caso de uso
        await tx.clienteAsignacion.createMany({
          data: data.asistentesIds.map((asistenteId) => ({
            clienteId: cliente.id,
            usuarioId: asistenteId,
          })),
        });
      }

      return cliente;
    });

    // 5. Revalidar la ruta para que los cambios aparezcan al instante
    revalidatePath("/clientes");

    return { 
      success: true, 
      data: { id: nuevoCliente.id, nombre: nuevoCliente.nombreCompleto } 
    };

  } catch (error: any) {
    console.error("Error en crearClienteAction:", error);
    
    // Manejo de errores de base de datos (ej: CUIT duplicado)
    if (error.code === 'P2002') {
      return { success: false, error: "Ya existe un cliente con ese CUIT registrado." };
    }

    return { 
      success: false, 
      error: "Ocurrió un error inesperado al registrar el cliente." 
    };
  }
}