"use server";
import { NextRequest, NextResponse } from "next/server";
import { Permisos } from "@/lib/permisos";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { validarYLimpiarDatos } from "../lib/validarYLimpiarDatos"; // Importamos la función de validación desde actions.ts


export async function crearCliente(body: any) {
  try {
    // Verificar permisos centralizados
    const autorizado = await Permisos.puedeCrearCliente();
    if (!autorizado) return NextResponse.json({ success: false, error: "No tienes permisos para crear clientes." }, { status: 403 });

    // Obtener datos del usuario autenticado y organización
    const { orgId } = await auth();
    if (!orgId) return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });

    const { esValido, errorMsg, datos } = validarYLimpiarDatos(body);
    if (!esValido) return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });

    // Buscar organización por clerkOrganizationId
    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true }
    });
    if (!orgLocal) return NextResponse.json({ success: false, error: "Organización no encontrada." }, { status: 404 });

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
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: "Ya existe un cliente con ese CUIT." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Error interno al procesar el registro." }, { status: 500 });
  }
}

export async function listarClientes(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json([], { status: 401 });

    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true }
    });
    if (!orgLocal) return NextResponse.json([], { status: 404 });

    const usuarioActual = await prisma.usuario.findFirst({
      where: { clerkId: userId, organizacionId: orgLocal.id },
      select: { id: true }
    });
    if (!usuarioActual) return NextResponse.json([], { status: 404 });

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
      return NextResponse.json([]);
    }

    const clientes = await prisma.cliente.findMany({
      where: filtroWhere,
      include: {
        recurso: true,
        asignaciones: { select: { usuarioId: true } }
      },
      orderBy: { nombreCompleto: "asc" },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error en GET /api/clientes:", error);
    return NextResponse.json([], { status: 500 });
  }
}


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
        data: datos.asistentesIds.map((uId) => ({
          clienteId: id,
          usuarioId: uId,
        })),
      });
    }

    return clienteActualizado;
  });
}