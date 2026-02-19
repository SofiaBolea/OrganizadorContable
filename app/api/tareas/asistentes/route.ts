import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAsistentesOrganizacion } from "@/lib/tareas";

// GET: Obtener asistentes de la organización
export async function GET() {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const asistentes = await getAsistentesOrganizacion(orgId);
    return NextResponse.json(asistentes);
  } catch (error) {
    console.error("Error obteniendo asistentes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
