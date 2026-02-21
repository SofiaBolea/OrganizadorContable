import { NextRequest, NextResponse } from "next/server";
import { Permisos } from "@/lib/permisos";
import { auth } from "@clerk/nextjs/server";
import { validarYLimpiarDatos } from "../lib/validarYLimpiarDatos"; // Importamos la función de validación desde actions.ts
import prisma from "./prisma";

export async function crearRecursoPropio(req: NextRequest) {
  try {
    // 1. Validar autenticación y organización
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // 2. Extraer datos del formulario (JSON)
    const body = await req.json();
    const { titulo, url, tipo, descripcion } = body;

    if (!titulo || !url) {
      return new NextResponse("Faltan campos obligatorios", { status: 400 });
    }

    const usuarioCreador = await prisma.usuario.findFirst({
      where: { clerkId: userId, organizacionId: orgId },
      select: { id: true }
    });

    if (!usuarioCreador) {
      return new NextResponse("Usuario no encontrado en la organización", { status: 404 });
    }

    // 3. Crear Recurso + RecursoRef en una sola operación (Nested Write)
    // Esto garantiza que si falla uno, no se cree el otro (Transaccionalidad)
    const nuevoRecursoPrivado = await prisma.recurso.create({
      data: {
        nombre: titulo,
        descripcion: descripcion || "",
        tipoRecurso: "REFERENCIA",
        organizacionId: orgId, // Pertenece a la org, pero...
        recursoRef: {
          create: {
            titulo: titulo,
            url: url,
            tipo: "PROPIO",
            usuarioId: usuarioCreador.id, // ...solo lo verá este usuarioId (Privacidad)
          },
        },
      },
      include: {
        recursoRef: true,
      },
    });

    return NextResponse.json(nuevoRecursoPrivado, { status: 201 });

  } catch (error) {
    console.error("[RECURSO_REF_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
