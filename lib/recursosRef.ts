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


export async function crearRecursoPropio(req: NextRequest) {
  // 1. Validar autenticación y organización
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }
  // 2. Extraer datos del formulario (JSON)
  const body = await req.json();
  const { titulo, url, tipo, descripcion } = body;
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
  // 3. Crear Recurso + RecursoRef en una sola operación (Nested Write)
  // Esto garantiza que si falla uno, no se cree el otro (Transaccionalidad)
  const nuevoRecursoPrivado = await prisma.$transaction(async (tx) => {
    // 1. Crear el Recurso Base
    // Esta tabla contiene los datos comunes y genera el ID (cuid)
    const recursoBase = await tx.recurso.create({
      data: {
        descripcion: descripcion || "",
        tipoRecurso: "RECURSO DE REFERENCIA",
        organizacionId: orgId,
      },
    });
    // 2. Crear el Recurso de Referencia vinculado
    // IMPORTANTE: En TPT, el ID del hijo debe ser el mismo que el del padre
    const detalleReferencia = await tx.recursoRef.create({
      data: {
        id: recursoBase.id,
        titulo: titulo,
        url: url,
        tipo: "PROPIO",
        usuarioId: usuarioCreador.id,
      },
    });
    // Devolvemos el objeto combinado para que la respuesta sea igual a la anterior
    return {
      ...recursoBase,
      recursoRef: detalleReferencia,
    };
  });
  return nuevoRecursoPrivado;
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

  const usuario = await prisma.usuario.findFirst({
    where: { clerkId: userId, organizacionId: orgId },
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