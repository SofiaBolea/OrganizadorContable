import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { crearVencimiento } from "@/lib/vencimientos";
import { Permisos } from "@/lib/permisos";

export async function POST(request: NextRequest) {
  try {
    const { orgId, userId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 403 }
      );
    }

    const puedeCrear = await Permisos.puedeCrearVencimiento();
    if (!puedeCrear) {
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

    const { titulo, tipoVencimiento, periodicidad, jurisdiccion, fechas } =
      await request.json();

    const recurso = await crearVencimiento(orgId, userId, {
      titulo,
      tipoVencimiento,
      periodicidad,
      jurisdiccion,
      fechas,
    });

    return NextResponse.json(
      {
        message: fechas && fechas.length > 0
          ? `Vencimiento creado exitosamente con ${fechas.length} fecha(s).`
          : "Vencimiento creado exitosamente.",
        data: recurso,
      },
      { status: 201 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    const status = mensaje.includes("no encontrad") ? 404 : 500;
    console.error("Error creando vencimiento:", error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
