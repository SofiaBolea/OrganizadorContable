import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAsistentesOrganizacion } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";

// GET: Obtener asistentes de la organización
export async function GET() {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const puedeVer = await Permisos.asistentes();
    if (!puedeVer) {
      return NextResponse.json({ error: "No tienes permisos para ver asistentes" }, { status: 403 });
    }

    const asistentes = await getAsistentesOrganizacion(orgId);
    return NextResponse.json(asistentes);
  } catch (error) {
    console.error("Error obteniendo asistentes:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
