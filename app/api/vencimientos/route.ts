import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { orgId, orgRole, userId } = await auth();

    // Validar autenticación y permisos
    if (!orgId || orgRole !== "org:admin") {
      return NextResponse.json(
        { error: "No tienes permisos para crear vencimientos" },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener datos del request
    const { titulo, tipoVencimiento, periodicidad, jurisdiccion } =
      await request.json();

    // 🔹 1️⃣ Buscar organización por clerkOrganizationId
    const organizacion = await prisma.organizacion.findUnique({
      where: {
        clerkOrganizationId: orgId,
      },
    });

    if (!organizacion) {
      return NextResponse.json(
        { error: "Organización no encontrada en DB" },
        { status: 400 }
      );
    }

    // 🔹 2️⃣ Buscar usuario por clerkId_organizacionId (Ahora es uni) 
    const usuario = await prisma.usuario.findUnique({
  where: {
    clerkId_organizacionId: {
      clerkId: userId,
      organizacionId: organizacion.id, // 👈 ID interno
    },
  },
});

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado en DB" },
        { status: 400 }
      );
    }

    // 🔹 3️⃣ Crear recurso usando IDs internos
    const recurso = await prisma.recurso.create({
      data: {
        organizacionId: organizacion.id, // ✅ ID interno
        tipoRecurso: "VENCIMIENTO",
        nombre: titulo,
        vencimiento: {
          create: {
            usuarioCreadorId: usuario.id, // ✅ ID interno
            tipoVencimiento,
            periodicidad,
            jurisdiccion: jurisdiccion || null,
            estado: "ACTIVO",
            titulo,
          },
        },
      },
      include: {
        vencimiento: true,
      },
    });

    return NextResponse.json(
      {
        message:
          "Vencimiento creado exitosamente. Ahora agrega las fechas de vencimiento.",
        data: recurso,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando vencimiento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
