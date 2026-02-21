import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { actualizarVencimiento } from "@/lib/vencimientos";
import { Permisos } from "@/lib/permisos/permisos";

export async function PUT(
  req: Request,
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

    const puedeModificar = await Permisos.puedeModificarVencimiento();
    if (!puedeModificar) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar vencimientos" },
        { status: 403 }
      );
    }

    const { id: vencimientoId } = await params;
    const body = await req.json();
    const { titulo, periodicidad, jurisdiccion, tipoVencimiento, ocurrencias } = body;

    const updated = await actualizarVencimiento(vencimientoId, {
      titulo,
      periodicidad,
      jurisdiccion,
      tipoVencimiento,
      ocurrencias,
    });

    return NextResponse.json(
      { message: "Vencimiento actualizado exitosamente", data: updated },
      { status: 200 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error actualizando vencimiento";
    console.error("Error actualizando vencimiento:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
