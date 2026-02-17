"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// --- INTERFACES ---
interface ClienteInput {
  nombreCompleto: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  asistentesIds: string[];
}

// --- UTILIDADES DE VALIDACIÓN Y LIMPIEZA ---

/**
 * Valida los datos según las reglas de negocio:
 * 1. Nombre obligatorio (max 255)
 * 2. CUIT exacto 11 dígitos si se provee.
 * 3. Formato de Email válido si se provee.
 */
function validarYLimpiarDatos(data: ClienteInput) {
  const errores: string[] = [];

  // Limpieza de strings
  const nombreLimpio = data.nombreCompleto?.trim() || "";
  const cuitLimpio = data.cuit?.replace(/\D/g, "") || null; // Solo números
  const emailLimpio = data.email?.trim().toLowerCase() || null;
  const telefonoLimpio = data.telefono?.trim() || null;

  // Validación de Nombre
  if (nombreLimpio.length === 0) {
    errores.push("El nombre completo es obligatorio.");
  } else if (nombreLimpio.length > 255) {
    errores.push("El nombre no puede superar los 255 caracteres.");
  }

  // Validación de CUIT
  if (cuitLimpio && cuitLimpio.length !== 11) {
    errores.push("El CUIT debe tener exactamente 11 dígitos numéricos.");
  }

  // Validación de Email
  if (emailLimpio) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLimpio)) {
      errores.push("El formato del correo electrónico es inválido.");
    }
  }

  return {
    esValido: errores.length === 0,
    errorMsg: errores.join(" "),
    datos: {
      nombreCompleto: nombreLimpio,
      cuit: cuitLimpio,
      email: emailLimpio,
      telefono: telefonoLimpio,
      asistentesIds: data.asistentesIds
    }
  };
}

import { Permisos } from "@/lib/permisos";

// --- ACCIONES ---



export async function modificarClienteAction(id: string, rawInput: ClienteInput) {
  const autorizado = await Permisos.puedeEditarCliente();
  if (!autorizado) return { success: false, error: "No tienes permisos para modificar." };

  const { esValido, errorMsg, datos } = validarYLimpiarDatos(rawInput);
  if (!esValido) return { success: false, error: errorMsg };

  try {
    await prisma.$transaction(async (tx) => {
      // Sincronizar Recurso
      await tx.recurso.update({
        where: { id },
        data: { nombre: datos.nombreCompleto }
      });

      // Sincronizar Cliente
      await tx.cliente.update({
        where: { id },
        data: {
          nombreCompleto: datos.nombreCompleto,
          cuit: datos.cuit,
          email: datos.email,
          telefono: datos.telefono,
        }
      });

      // Sincronizar Asistentes
      await tx.clienteAsignacion.deleteMany({ where: { clienteId: id } });
      if (datos.asistentesIds.length > 0) {
        await tx.clienteAsignacion.createMany({
          data: datos.asistentesIds.map(uId => ({
            clienteId: id,
            usuarioId: uId
          }))
        });
      }
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar los datos." };
  }
}

export async function eliminarClienteAction(id: string) {
  const autorizado = await Permisos.puedeEliminarCliente();
  if (!autorizado) return { success: false, error: "No tienes permisos para eliminar." };

  try {
    // BAJA LÓGICA
    await prisma.cliente.update({
      where: { id },
      data: { estado: "INACTIVO" }
    });

    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al procesar la baja." };
  }
}