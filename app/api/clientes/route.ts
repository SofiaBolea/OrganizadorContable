import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { auth } from "@clerk/nextjs/server";
import { Permisos } from "@/lib/permisos";
// --- UTILIDADES DE VALIDACIÓN Y LIMPIEZA ---
function validarYLimpiarDatos(data: any) {
  const errores: string[] = [];
  const nombreLimpio = data.nombreCompleto?.trim() || "";
  const cuitLimpio = data.cuit?.replace(/\D/g, "") || null;
  const emailLimpio = data.email?.trim().toLowerCase() || null;
  const telefonoLimpio = data.telefono?.trim() || null;

  if (nombreLimpio.length === 0) {
    errores.push("El nombre completo es obligatorio.");
  } else if (nombreLimpio.length > 255) {
    errores.push("El nombre no puede superar los 255 caracteres.");
  }
  if (cuitLimpio && cuitLimpio.length !== 11) {
    errores.push("El CUIT debe tener exactamente 11 dígitos numéricos.");
  }
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
      asistentesIds: data.asistentesIds,
      organizacionId: data.organizacionId
    }
  };
}
// POST /api/clientes
export async function POST(request: NextRequest) {
  try {
    // Verificar permisos centralizados
    const autorizado = await Permisos.puedeCrearCliente();
    if (!autorizado) return NextResponse.json({ success: false, error: "No tienes permisos para crear clientes." }, { status: 403 });

    // Obtener datos del usuario autenticado y organización
    const { orgId } = await auth();
    if (!orgId) return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });

    const body = await request.json();
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

export async function GET(request: NextRequest) {
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



