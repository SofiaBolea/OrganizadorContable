import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, orgRole } = await auth();

    if (!orgId || orgRole !== "org:admin") {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar ocurrencias" },
        { status: 403 }
      );
    }

    const { id: ocurrenciaId } = await params;
    const body = await request.json();
    const { deleteFollowing = false } = body;

    // Buscar la organización interna con el clerkOrganizationId
    const organizacion = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
    });

    if (!organizacion) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 400 }
      );
    }

    // Buscar la ocurrencia
    const ocurrencia = await prisma.vencimientoOcurrencia.findUnique({
      where: { id: ocurrenciaId },
      include: {
        vencimiento: {
          include: {
            recurso: true,
          },
        },
      },
    });

    if (!ocurrencia) {
      return NextResponse.json(
        { error: "Ocurrencia no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que pertenece a la organización del usuario (usando ID interno)
    if (ocurrencia.vencimiento.recurso.organizacionId !== organizacion.id) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar esta ocurrencia" },
        { status: 403 }
      );
    }

    // Si deleteFollowing es true, eliminar esta y todas las siguientes
    if (deleteFollowing) {
      const idsAEliminar = await prisma.vencimientoOcurrencia.findMany({
        where: {
          vencimientoId: ocurrencia.vencimientoId,
          fechaVencimiento: {
            gte: ocurrencia.fechaVencimiento,
          },
        },
        select: { id: true },
      });

      await prisma.vencimientoOcurrencia.deleteMany({
        where: {
          id: {
            in: idsAEliminar.map((o) => o.id),
          },
        },
      });
    } else {
      // Eliminar solo esta ocurrencia
      await prisma.vencimientoOcurrencia.delete({
        where: { id: ocurrenciaId },
      });
    }

    return NextResponse.json(
      { message: "Ocurrencia(s) eliminada(s) exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error eliminando ocurrencia:", error);
    return NextResponse.json(
      { error: "Error eliminando ocurrencia" },
      { status: 500 }
    );
  }
}
