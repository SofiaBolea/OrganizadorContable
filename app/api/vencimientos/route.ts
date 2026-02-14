import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { orgId, orgRole } = await auth();

    // Validar autenticación y permisos
    if (!orgId || orgRole !== "org:admin") {
      return NextResponse.json(
        { error: "No tienes permisos para crear vencimientos" },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const { titulo, tipoVencimiento, periodicidad, jurisdiccion } =
      await request.json();

    // Validar campos requeridos
    if (!titulo || !tipoVencimiento || !periodicidad) {
      return NextResponse.json(
        { error: "Falta información requerida" },
        { status: 400 }
      );
    }

    // Obtener userId de Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

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
          },
        },
      },
      include: {
        vencimiento: true,
      },
    });

    // Generar la primera ocurrencia de vencimiento (para hoy)
    await prisma.vencimientoOcurrencia.create({
      data: {
        vencimientoId: recurso.id,
        fechaVencimiento: new Date(),
        estado: "PENDIENTE",
      },
    });

    return NextResponse.json(
      {
        message: "Vencimiento creado exitosamente",
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
