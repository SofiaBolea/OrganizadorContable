import { NextRequest } from "next/server";
import { Permisos } from "@/lib/permisos";
import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";

export async function listarRecursosPropios(request: NextRequest) {
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

  try {
    const recursosRef = await prisma.recursoRef.findMany({
      where: {
        tipo: "PROPIO",
        usuarioId: usuarioActual.id
      },
      orderBy: { titulo: "asc" },
      select: {
        id: true,
        titulo: true,
        url: true,
        tipo: true,
      }
    });
    return recursosRef;
  } catch (error) {
    console.error("Error en GET /api/recursosRef:", error);
    throw new Error("INTERNAL: Error al obtener recursos de referencia.");
  }
}


export async function crearRecursoRef(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("No autorizado");

  const body = await req.json();
  const { titulo, url, tipo, descripcion } = body; // Recibimos 'tipo' del body

  if (!titulo || !url || !tipo) {
    throw new Error("Faltan campos obligatorios");
  }

  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });
  if (!orgLocal) throw new Error("Organización no encontrada");

  const usuarioCreador = await prisma.usuario.findFirst({
    where: { clerkId: userId, organizacionId: orgLocal.id },
    select: { id: true }
  });

  if (!usuarioCreador) throw new Error("Usuario no encontrado");

  return await prisma.$transaction(async (tx) => {
    const recursoBase = await tx.recurso.create({
      data: {
        descripcion: descripcion || "",
        tipoRecurso: "RECURSO DE REFERENCIA",
        organizacionId: orgLocal.id,
      },
    });

    const detalleReferencia = await tx.recursoRef.create({
      data: {
        id: recursoBase.id,
        titulo: titulo,
        url: url,
        tipo: tipo, // Usamos el tipo dinámico (PROPIO o GLOBAL)
        usuarioId: usuarioCreador.id,
      },
    });

    return { ...recursoBase, recursoRef: detalleReferencia };
  });
}

export async function modificarRecursoPropio(req: NextRequest) {
  // 1. Validar autenticación y organización
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }
  // 2. Extraer datos del formulario (JSON)
  const body = await req.json();
  const { titulo, url, descripcion } = body;
  if (!titulo || !url) {
    throw new Error("Faltan campos obligatorios");
  }
  const usuarioCreador = await prisma.usuario.findFirst({
    where: { clerkId: userId, organizacionId: orgId },
    select: { id: true }
  });
  if (!usuarioCreador) {
    throw new Error("Usuario no encontrado en la organización");
  }
  const nuevoRecursoPrivado = await prisma.$transaction(async (tx) => {
    // 1. Actualizar el Recurso Base
    const recursoBase = await tx.recurso.update({
      where: { id: body.id },
      data: {
        descripcion: descripcion || "",
        tipoRecurso: "RECURSO DE REFERENCIA",
        organizacionId: orgId,
      },
    });
    // 2. Actualizar el Recurso de Referencia vinculado
    const detalleReferencia = await tx.recursoRef.update({
      where: { id: recursoBase.id },
      data: {
        id: recursoBase.id,
        titulo: titulo,
        url: url,
        tipo: "PROPIO",
        usuarioId: usuarioCreador.id,
      },
    });
    return {
      ...recursoBase,
      recursoRef: detalleReferencia,
    };
  });
  return nuevoRecursoPrivado;
}

export async function listarRecursosPropio() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });

  const usuario = await prisma.usuario.findFirst({
    where: { clerkId: userId, organizacionId: orgLocal?.id },
    select: { id: true }
  });

  if (!usuario) {
    throw new Error("Usuario no encontrado");
  }

  // Obtenemos los recursos de tipo "PROPIO" para este usuario
  return await prisma.recursoRef.findMany({
    where: {
      usuarioId: usuario.id,
      tipo: "PROPIO",
    },
    include: {
      recurso: true // Para obtener la descripción que está en la tabla base
    },
    orderBy: {
      id: 'desc'
    }
  });
}