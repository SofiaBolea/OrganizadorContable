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

    // Crear el Recurso y Vencimiento dentro de una transacción
    const recurso = await prisma.recurso.create({
      data: {
        organizacionId: orgId,
        tipoRecurso: "VENCIMIENTO",
        nombre: titulo,
        vencimiento: {
          create: {
            usuarioCreadorId: userId,
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

    // No crear ocurrencias aquí - el usuario las agregará después
    return NextResponse.json(
      {
        message: "Vencimiento creado exitosamente. Ahora agrega las fechas de vencimiento.",
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
