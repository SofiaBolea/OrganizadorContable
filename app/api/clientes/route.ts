import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Permisos } from "@/lib/permisos";
import { crearCliente, listarClientes, modificarCliente } from "../../../lib/clientes";
 // Importamos la función de validación desde actions.ts

// POST /api/clientes
export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const result = await crearCliente(body);
    return NextResponse.json(result);
  } catch (error: any) {
    let status = 500;
    let message = error.message || "Error interno";
    if (message.startsWith("UNAUTHORIZED")) status = 403;
    else if (message.startsWith("UNAUTHENTICATED")) status = 401;
    else if (message.startsWith("NOT_FOUND")) status = 404;
    else if (message.startsWith("INVALID")) status = 400;
    else if (message.startsWith("DUPLICATE")) status = 400;
    return NextResponse.json({ success: false, error: message.replace(/^[A-Z_]+: /,"") }, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const result = await listarClientes(request);
    return NextResponse.json(result);
  } catch (error: any) {
    let status = 500;
    let message = error.message || "Error interno";
    if (message.startsWith("UNAUTHORIZED")) status = 403;
    else if (message.startsWith("UNAUTHENTICATED")) status = 401;
    else if (message.startsWith("NOT_FOUND")) status = 404;
    else if (message.startsWith("INVALID")) status = 400;
    return NextResponse.json({ success: false, error: message.replace(/^[A-Z_]+: /,"") }, { status });
  }
}




