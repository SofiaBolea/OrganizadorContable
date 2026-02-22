import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { Permisos } from "@/lib/permisos";


export async function updateUsuarioPermission({
  usuarioId,
  campo,
  valor
}: {
  usuarioId: string;
  campo: "permisoClientes" | "permisoVencimiento";
  valor: boolean;
}) {
  const { userId, orgId, sessionId } = await auth();
  const puedeVer = await Permisos.puedeVerAsistentes();
  const canEdit = await Permisos.puedeEditarAsistentes();
  
  if (!orgId || !canEdit || !puedeVer) {
    throw new Error("No tenés permisos para editar.");
  }
  const usuarioActualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { [campo]: valor },
  });



  // Buscar el usuario ejecutor en la base de datos (debe existir para la FK)
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true }
  });
  if (!orgLocal) {
    throw new Error("Organización no encontrada.");
  }

  const usuarioEjecutor = await prisma.usuario.findUnique({
    where: { clerkId_organizacionId: { clerkId: userId, organizacionId: orgLocal.id } },
    select: { id: true }
  });

  if (!usuarioEjecutor) {
    throw new Error("Usuario ejecutor no encontrado en la base de datos.");
  }
  await prisma.registroAuditoria.create({
    data: {
      organizacionId: orgLocal.id,
      ejecutadoPorId: usuarioEjecutor.id,
      sesionId: sessionId || undefined,
      usuarioAfectadoId: usuarioId,
      accion: `Cambio de permiso ${campo}`,
      detalleAccion: `El permiso '${campo}' fue cambiado a '${valor ? "habilitado" : "deshabilitado"}' para el usuario ${usuarioActualizado.nombreCompleto} (${usuarioActualizado.email})`,
    },
  });

}

export async function listarAsistentes(request: NextRequest) {
  const { userId, orgId } = await auth();

  // Seguridad básica
  if (!userId || !orgId) {
    throw new Error("UNAUTHENTICATED: No autenticado.");
  }

  // Buscar organización local vinculada a Clerk
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true },
  });

  if (!orgLocal) {
    throw new Error("NOT_FOUND: Organización no encontrada.");
  }

  // Query params
  const params = request.nextUrl.searchParams;

  const nombre = params.get("nombre");
  const cargaVencimientos = params.get("cargaVencimientos");
  const cargaClientes = params.get("cargaClientes");

  // Construcción dinámica del where
  const filtroWhere: any = {
    organizacionId: orgLocal.id,
  };

  // Filtro por nombre
  if (nombre && nombre.trim() !== "") {
    filtroWhere.nombreCompleto = {
      contains: nombre.trim(),
      mode: "insensitive",
    };
  }

  // Filtro por permisoVencimiento (true / false explícito)
  if (cargaVencimientos !== null) {
    filtroWhere.permisoVencimiento = cargaVencimientos === "true";
  }

  // Filtro por permisoClientes (true / false explícito)
  if (cargaClientes !== null) {
    filtroWhere.permisoClientes = cargaClientes === "true";
  }

  // Solo usuarios con el rol de "asistente"
  try {
    const asistentes = await prisma.usuario.findMany({
      where: {
        ...filtroWhere,
        roles: {
          some: {
            rol: {
              nombreRol: "org:member"
            },
            fechaBaja: null // Solo roles activos
          }
        }
      },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        telefono: true,
        permisoClientes: true,
        permisoVencimiento: true,
      },
      orderBy: {
        nombreCompleto: "asc",
      },
    });
    return asistentes;
  } catch (error) {
    console.error("Error en GET /api/asistentes:", error);
    throw new Error("INTERNAL: Error al obtener asistentes.");
  }


}

export default async function listarAsistentesIdentificadores(request: NextRequest) {
  const { userId, orgId } = await auth();

  // Seguridad básica
  if (!userId || !orgId) {
    throw new Error("UNAUTHENTICATED: No autenticado.");
  }

  // Buscar organización local vinculada a Clerk
  const orgLocal = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
    select: { id: true },
  });

  if (!orgLocal) {
    throw new Error("NOT_FOUND: Organización no encontrada.");
  }

  const filtroWhere: any = {
    organizacionId: orgLocal.id,
  };

  try {
    // Solo usuarios con el rol de "asistente"
    const asistentes = await prisma.usuario.findMany({
      where: {
        ...filtroWhere,
        roles: {
          some: {
            rol: {
              nombreRol: "org:member"
            },
            fechaBaja: null // Solo roles activos
          }
        }
      },
      select: {
        id: true,
        nombreCompleto: true,
      }
    });
    return asistentes;
  } catch (error) {
    console.error("Error en GET /api/asistentes:", error);
    throw new Error("INTERNAL: Error al obtener asistentes.");
  }

}



