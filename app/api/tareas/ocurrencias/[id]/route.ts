import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eliminarOcurrencia } from "@/lib/tareas";

// DELETE: Eliminar una ocurrencia materializada
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    await eliminarOcurrencia(id);

    return NextResponse.json({ message: "Ocurrencia eliminada" }, { status: 200 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error eliminando ocurrencia";
    console.error("Error:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
