// app/api/clientes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Permisos } from "@/lib/permisos";
import { modificarCliente } from "../../../../lib/clientes"; // Importamos la función de negocio
import { revalidatePath } from "next/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Verificación de Seguridad
    const { userId, orgId } = await auth();
    const autorizado = await Permisos.puedeEditarCliente();

    if (!autorizado || !userId || !orgId) {
      return NextResponse.json(
        { success: false, error: "No tienes permisos para realizar esta acción." },
        { status: 403 }
      );
    }

    // 2. Obtener y validar el cuerpo de la petición
    const body = await request.json();
    
    // 3. LLAMADA A LA FUNCIÓN DE NEGOCIO
    await modificarCliente(id, body);

    // 4. Actualizar la caché de Next.js
    revalidatePath("/clientes");

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error en API PUT Cliente:", error);
    return NextResponse.json(
      { success: false, error: "Error al intentar actualizar el cliente." },
      { status: 500 }
    );
  }
}