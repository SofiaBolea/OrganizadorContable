"use server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


export async function listarInfoUsuario(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json([], { status: 401 });
    const organizacion = await prisma.organizacion.findFirst({
      where: { clerkOrganizationId: orgId },
      select: {
        id: true,
        nombre: true,
        telefonoContacto: true,
        emailContacto: true,
        direccion: true,
      }
    });

    const usuario = await prisma.usuario.findFirst({
      where: { clerkId: userId, organizacionId: organizacion?.id },
      select: {
        id: true,
        nombreCompleto: true,
        dni: true,
        email: true,
        telefono: true,
      }
    });

    return NextResponse.json({usuario});
  } catch (error) {
    console.error("Error en GET /api/organizaciones:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function actualizarInformacionExtraUsuario(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const body = await request.json();
    const { dni, telefono } = body;
    await prisma.usuario.updateMany({
      where: { clerkId: userId },
      data: {
        dni,
        telefono,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en POST /api/usuario:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
