import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { crearTarea, getTareasAsignadasAdmin, getTareasAsignadasAsistente, getTareasPropias } from "@/lib/tareas";
import { Permisos } from "@/lib/permisos";

// POST: Crear nueva tarea
export async function POST(request: NextRequest) {
  try {
    const { orgId, userId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 403 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { tipoTarea } = body;

    // Verificar permisos para crear tareas
    const puedeCrearTarea = await Permisos.puedeCrearTarea();
    if (!puedeCrearTarea) {
      return NextResponse.json({ error: "No tienes permisos para crear tareas" }, { status: 403 });
    }
    // Para tareas ASIGNADA, solo admin puede crear
    if (tipoTarea === "ASIGNADA") {
      const puedeCrearAsignada = await Permisos.puedeCrearTareaAsignada();
      if (!puedeCrearAsignada) {
        return NextResponse.json({ error: "No tienes permisos para crear tareas asignadas" }, { status: 403 });
      }
    }

    const recurso = await crearTarea(orgId, userId, body);

    return NextResponse.json(
      { message: "Tarea creada exitosamente", data: recurso },
      { status: 201 }
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error interno del servidor";
    console.error("Error creando tarea:", error);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}

// GET: Obtener tareas
export async function GET(request: NextRequest) {
  try {
    const { orgId, userId } = await auth();

    if (!orgId || !userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const tipo = request.nextUrl.searchParams.get("tipo"); // "asignadas" | "tareas-propias"
    const esAdmin = await Permisos.esAdmin();

    const puedeVerTarea = await Permisos.puedeVerTarea();
    if (!puedeVerTarea) {
      return NextResponse.json({ error: "No tienes permisos para ver tareas" }, { status: 403 });
    }

    if (tipo === "asignadas") {
      // Verificar permisos para ver tareas
      const puedeVer = await Permisos.puedeVerTareaAsignada();
      if (!puedeVer) {
        return NextResponse.json({ error: "No tienes permisos para ver tareas asignadas" }, { status: 403 });
      }
    }

    let tareas;
    if (tipo === "asignadas") {
      tareas = esAdmin
        ? await getTareasAsignadasAdmin(orgId, userId)
        : await getTareasAsignadasAsistente(orgId, userId);
    } else {
      tareas = await getTareasPropias(orgId, userId);
    }

    return NextResponse.json(tareas);
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
