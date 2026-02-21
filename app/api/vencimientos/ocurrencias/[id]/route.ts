import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eliminarOcurrenciaVencimiento } from "@/lib/vencimientos";
import { Permisos } from "@/lib/permisos/permisos";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 403 }
      );
    }

    const puedeEliminar = await Permisos.puedeEliminarVencimiento();
    if (!puedeEliminar) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar ocurrencias" },
        { status: 403 }
      );
    }

    const { id: ocurrenciaId } = await params;
    const body = await request.json();
    const { deleteFollowing = false } = body;

    await eliminarOcurrenciaVencimiento(orgId, ocurrenciaId, deleteFollowing);

    return NextResponse.json(
      { message: "Ocurrencia(s) eliminada(s) exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error eliminando ocurrencia";
    const status = mensaje.includes("no encontrad") ? 404 : mensaje.includes("permisos") ? 403 : 500;
    console.error("Error eliminando ocurrencia:", error);
    return NextResponse.json({ error: mensaje }, { status });
  }
}
