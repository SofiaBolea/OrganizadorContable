import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { orgId, orgRole } = await auth();

    // Validar autenticación y permisos
    if (!orgId || orgRole !== "org:admin") {
      return NextResponse.json(
        { error: "No tienes permisos para agregar ocurrencias" },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const { vencimientoId, fechas } = await request.json();

    // Validar campos requeridos
    if (!vencimientoId || !fechas || !Array.isArray(fechas) || fechas.length === 0) {
      return NextResponse.json(
        { error: "Datos inválidos. Se requiere vencimientoId y un array de fechas" },
        { status: 400 }
      );
    }

    // Verificar que el vencimiento existe y pertenece a la organización
    const vencimiento = await prisma.vencimiento.findFirst({
      where: {
        id: vencimientoId,
        recurso: {
          organizacionId: orgId,
        },
      },
    });

    if (!vencimiento) {
      return NextResponse.json(
        { error: "Vencimiento no encontrado" },
        { status: 404 }
      );
    }

    // Crear las ocurrencias de vencimiento
    const ocurrenciasCreadas = await Promise.all(
      fechas.map((fecha: string) =>
        prisma.vencimientoOcurrencia.create({
          data: {
            vencimientoId: vencimientoId,
            fechaVencimiento: new Date(fecha),
            estado: "PENDIENTE",
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: `${ocurrenciasCreadas.length} fecha(s) de vencimiento agregada(s) exitosamente`,
        data: ocurrenciasCreadas,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error agregando ocurrencias:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
