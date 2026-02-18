import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Permisos } from "@/lib/permisos";
import { crearCliente, listarClientes, modificarCliente } from "../../../lib/clientes";
 // Importamos la función de validación desde actions.ts

// POST /api/clientes
export async function POST(request: NextRequest) {
  const body = await request.json();
  return await crearCliente(body);
}

export async function GET(request: NextRequest) {
  return await listarClientes(request);
}




