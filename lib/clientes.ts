"use server";
import { NextRequest, NextResponse } from "next/server";
import { Permisos } from "@/lib/permisos/permisos";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { validarYLimpiarDatos } from "../lib/validarYLimpiarDatos"; // Importamos la función de validación desde actions.ts


/* ------------------------------------------- */
/*------------- Crear clientes --------------- */
/* ------------------------------------------- */

export async function crearCliente(body: any) {
  // Verificar permisos centralizados
  const autorizado = await Permisos.puedeCrearCliente();
  if (!autorizado) throw new Error("UNAUTHORIZED: No tienes permisos para crear clientes.");

  // Obtener datos del usuario autenticado y organización
  const { orgId } = await auth();
  if (!orgId) throw new Error("UNAUTHENTICATED: No autenticado.");

  const { esValido, errorMsg, datos } = validarYLimpiarDatos(body);
  if (!esValido) throw new Error(`INVALID: ${errorMsg}`);

  // Buscar organización por clerkOrganizationId
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });
  if (!orgLocal) throw new Error("NOT_FOUND: Organización no encontrada.");

  try {
    await prisma.$transaction(async (tx) => {
      const recurso = await tx.recurso.create({
        data: {
          organizacionId: orgLocal.id,
          nombre: datos.nombreCompleto,
          tipoRecurso: "CLIENTE",
        },
      });
      await tx.cliente.create({
        data: {
          id: recurso.id,
          nombreCompleto: datos.nombreCompleto,
          cuit: datos.cuit,
          email: datos.email,
          telefono: datos.telefono,
          estado: "ACTIVO",
          asignaciones: {
            create: (datos.asistentesIds || []).map((uId: string) => ({ usuarioId: uId })),
          },
        },
      });
    });
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      const err = new Error("DUPLICATE: Ya existe un cliente con ese CUIT.");
      // @ts-ignore
      err.status = 400;
      throw err;
    }
    throw new Error("INTERNAL: Error interno al procesar el registro.");
  }
}

/* ------------------------------------------- */
/*------------- Listar Clientes -------------- */
/* ------------------------------------------- */
export async function listarClientes(request: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("UNAUTHENTICATED: No autenticado.");

  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });
  if (!orgLocal) throw new Error("NOT_FOUND: Organización no encontrada.");

  const usuarioActual = await prisma.usuario.findFirst({
    where: { clerkId: userId, organizacionId: orgLocal.id },
    select: { id: true }
  });
  if (!usuarioActual) throw new Error("NOT_FOUND: Usuario no encontrado.");

  // Capturamos los filtros de la URL
  const params = request.nextUrl.searchParams;
  const nombre = params.get("nombre") || undefined;
  const cuit = params.get("cuit") || undefined;
  const asistenteId = params.get("asistenteId") || undefined;

  const puedeVerTodo = await Permisos.puedeVerTodosLosClientes();
  const soloAsignados = await Permisos.puedeVerClientes();

  let filtroWhere: any = {
    recurso: { organizacionId: orgLocal.id },
    estado: "ACTIVO",
  };

  if (nombre) filtroWhere.nombreCompleto = { contains: nombre, mode: 'insensitive' };
  if (cuit) filtroWhere.cuit = { contains: cuit };

  // Lógica de permisos TPT (Table Per Type)
  if (puedeVerTodo) {
    if (asistenteId) {
      filtroWhere.asignaciones = { some: { usuarioId: asistenteId } };
    }
  } else if (soloAsignados) {
    filtroWhere.asignaciones = { some: { usuarioId: usuarioActual.id } };
  } else {
    return [];
  }

  try {
    const clientes = await prisma.cliente.findMany({
      where: filtroWhere,
      include: {
        recurso: true,
        asignaciones: { select: { usuarioId: true } }
      },
      orderBy: { nombreCompleto: "asc" },
    });
    return clientes;
  } catch (error) {
    console.error("Error en GET /api/clientes:", error);
    throw new Error("INTERNAL: Error al obtener clientes.");
  }
}

/* ------------------------------------------- */
/*----------- Modificar Clientes ------------- */
/* ------------------------------------------- */

interface DatosUpdateCliente {
  nombreCompleto: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  asistentesIds: string[];
}

export async function modificarCliente(id: string, datos: DatosUpdateCliente) {
  return await prisma.$transaction(async (tx) => {
    // 1. Actualizar el Recurso asociado (Nombre)
    await tx.recurso.update({
      where: { id },
      data: { nombre: datos.nombreCompleto },
    });

    // 2. Actualizar los datos del Cliente
    const clienteActualizado = await tx.cliente.update({
      where: { id },
      data: {
        nombreCompleto: datos.nombreCompleto,
        cuit: datos.cuit?.replace(/\D/g, "") || null,
        email: datos.email || null,
        telefono: datos.telefono || null,
      },
    });

    // 3. Sincronizar Asistentes (Limpiar y Crear)
    await tx.clienteAsignacion.deleteMany({
      where: { clienteId: id },
    });

    if (datos.asistentesIds && datos.asistentesIds.length > 0) {
      await tx.clienteAsignacion.createMany({
        data: datos.asistentesIds.map((uId:string) => ({
          clienteId: id,
          usuarioId: uId,
        })),
      });
    }

    return clienteActualizado;
  });
}

// lib/clientes.ts
export async function eliminarClienteService(id: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("UNAUTHORIZED");

  return await prisma.$transaction(async (tx) => {
    // 1. Verificamos propiedad y existencia en un solo paso
    const clienteExistente = await tx.cliente.findFirst({
      where: { 
        id,
        recurso: { organizacion: { clerkOrganizationId: orgId } } 
      },
      select: { nombreCompleto: true }
    });

    if (!clienteExistente) throw new Error("NOT_FOUND");

    // 2. DELETE físico para las asignaciones (como pediste)
    await tx.clienteAsignacion.deleteMany({
      where: { clienteId: id },
    });

    // 3. SOFT DELETE para el Cliente y el Recurso
    // En Prisma 7, las actualizaciones anidadas son extremadamente eficientes
    await tx.cliente.update({
      where: { id },
      data: { 
        estado: "INACTIVO",
      },
    });

    return { success: true };
  });
}