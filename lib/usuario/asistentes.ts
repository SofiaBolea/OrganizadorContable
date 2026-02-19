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
  const { orgId, has } = await auth();
  const canEdit = has({ permission: "org:asistentes:ver_asistentes" });
  if (!orgId || !canEdit) {
    throw new Error("No tenés permisos para editar.");
  }
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { [campo]: valor },
  });
}

export async function listarAsistentes(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    // Seguridad básica
    if (!userId || !orgId) {
      return NextResponse.json([], { status: 401 });
    }

    // Buscar organización local vinculada a Clerk
    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true },
    });

    if (!orgLocal) {
      return NextResponse.json([], { status: 404 });
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

    return NextResponse.json(asistentes);
  } catch (error) {
    console.error("Error en GET /api/asistentes:", error);
    return NextResponse.json([], { status: 500 });
  }
}

