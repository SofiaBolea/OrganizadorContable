import { NextRequest } from "next/server";
import { Permisos } from "@/lib/permisos";
import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";


export async function crearRecursoRef(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("No autorizado");

  if (!await Permisos.puedeCrearRecursosReferencia()) {
    throw new Error("No tienes permisos para crear recursos de referencia");
  }

  const body = await req.json();
  const { titulo, url, tipo} = body; // Recibimos 'tipo' del body

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
  const { userId, orgId} = await auth();
  const isAdmin = await Permisos.puedeModificarRecursosRefGlobales();
  
  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }
  if (!await Permisos.puedeModificarRecursosReferencia()) {
    throw new Error("No tienes permisos para modificar recursos de referencia");
  }

  // 2. Extraer datos del formulario (JSON)
  const body = await req.json();
  const { titulo, url} = body;
  if (!titulo || !url) {
    throw new Error("Faltan campos obligatorios");
  }
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });
  
  const usuarioCreador = await prisma.usuario.findFirst({
    where: { clerkId: userId, organizacionId: orgLocal?.id },
    select: { id: true }
  });
  if (!usuarioCreador) {
    throw new Error("Usuario no encontrado en la organización");
  }
  const recursoExistente = await prisma.recursoRef.findUnique({
    where: { id: body.id }
  });

  if (!isAdmin) {
    if (recursoExistente?.tipo === "GLOBAL") throw new Error("No tienes permiso para editar recursos globales");
    if (recursoExistente?.usuarioId !== usuarioCreador?.id) throw new Error("No puedes editar recursos de otros usuarios");
  }

  // Lógica de update (se mantiene el transaction existente)
  return await prisma.$transaction(async (tx) => {

    const detalleReferencia = await tx.recursoRef.update({
      where: { id: body.id },
      data: {
        titulo: body.titulo,
        url: body.url,
        tipo: body.tipo || recursoExistente?.tipo,
      },
    });
    return { recursoRef: detalleReferencia };
  });
}

export async function listarRecursosPropios() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    throw new Error("No autorizado");
  }

  if (!await Permisos.puedeVerRecursosReferencia()) {
    throw new Error("No tienes permisos para ver tus recursos de referencia");
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

  return await prisma.recursoRef.findMany({
    where: {
      OR: [
        { usuarioId: usuario.id, tipo: "PROPIO" },
        { tipo: "GLOBAL", recurso: { organizacionId: orgLocal?.id } }
      ]
    },
    include: { recurso: true },
    orderBy: { id: 'desc' }
  });
}

export async function eliminarRecursoRef(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("No autorizado");

  const body = await req.json();
  const { id } = body;

  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });

  const usuario = await prisma.usuario.findFirst({
    where: { clerkId: userId, organizacionId: orgLocal?.id },
    select: { id: true }
  });

  const recursoExistente = await prisma.recursoRef.findUnique({
    where: { id }
  });

  if (!recursoExistente) throw new Error("Recurso no encontrado");

  // Verificación de permisos
  const puedeBorrarGlobal = await Permisos.puedeEliminarRecursosRefGlobales();
  
  if (recursoExistente.tipo === "GLOBAL") {
    if (!puedeBorrarGlobal) throw new Error("No tienes permiso para eliminar recursos globales");
  } else {
    // Si es PROPIO, debe ser el dueño y tener permiso de eliminación genérico
    const tienePermisoEliminar = await Permisos.puedeEliminarRecursosReferencia();
    if (!tienePermisoEliminar || recursoExistente.usuarioId !== usuario?.id) {
      throw new Error("No puedes eliminar este recurso");
    }
  }

  return await prisma.$transaction(async (tx) => {
    await tx.recursoRef.delete({ where: { id } });
    return await tx.recurso.delete({ where: { id } });
  });
}