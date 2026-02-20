"use server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/* ------------------------------------------- */
/*----- Actualizar Información Extra -----------*/
/* ------------------------------------------- */
export async function actualizarInformacionExtra(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const body = await request.json();
    const { emailContacto, telefonoContacto, direccion } = body;
    await prisma.organizacion.updateMany({
      where: { clerkOrganizationId: orgId },
      data: {
        emailContacto,
        telefonoContacto,
        direccion,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en POST /api/organizacion:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}


/* ------------------------------------------- */
/*------------- Listar Organizaciones -------------- */
/* ------------------------------------------- */
export async function listarOrganizaciones(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json([], { status: 401 });
    const organizacion = await prisma.organizacion.findMany({
      where: { clerkOrganizationId: orgId },
      select: {
        id: true,
        nombre: true,
        telefonoContacto: true,
        emailContacto: true,
        direccion: true,
      }
    });

    return NextResponse.json(organizacion);
  } catch (error) {
    console.error("Error en GET /api/organizaciones:", error);
    return NextResponse.json([], { status: 500 });
  }
}
