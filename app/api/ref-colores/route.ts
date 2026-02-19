import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getRefColores, crearRefColor } from "@/lib/tareas";

// GET: Obtener colores de referencia
export async function GET() {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const colores = await getRefColores(orgId);
    return NextResponse.json(colores);
  } catch (error) {
    console.error("Error obteniendo colores:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Crear nuevo color de referencia
export async function POST(request: NextRequest) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { titulo, codigoHexa } = await request.json();

    if (!titulo || !codigoHexa) {
      return NextResponse.json({ error: "Se requiere titulo y codigoHexa" }, { status: 400 });
    }

    const refColor = await crearRefColor(orgId, titulo, codigoHexa);

    return NextResponse.json(
      { message: "Color creado exitosamente", data: refColor },
      { status: 201 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error creando color";
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
