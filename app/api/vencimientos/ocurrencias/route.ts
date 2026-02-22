import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { crearOcurrenciasVencimiento } from "@/lib/vencimientos";
import { Permisos } from "@/lib/permisos";

export async function POST(request: NextRequest) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 403 }
      );
    }

    const puedeModificar = await Permisos.puedeModificarVencimiento();
    if (!puedeModificar) {
      return NextResponse.json(
        { error: "No tienes permisos para agregar ocurrencias" },
        { status: 403 }
      );
    }

    const { vencimientoId, fechas } = await request.json();

    if (!vencimientoId || !fechas || !Array.isArray(fechas) || fechas.length === 0) {
      return NextResponse.json(
        { error: "Datos inválidos. Se requiere vencimientoId y un array de fechas" },
        { status: 400 }
      );
    }

    const ocurrenciasCreadas = await crearOcurrenciasVencimiento(orgId, vencimientoId, fechas);

    return NextResponse.json(
      {
        message: `${ocurrenciasCreadas.length} fecha(s) de vencimiento agregada(s) exitosamente`,
        data: ocurrenciasCreadas,
      },
      { status: 201 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    const status = mensaje.includes("no encontrad") ? 404 : 500;
    console.error("Error agregando ocurrencias:", error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
