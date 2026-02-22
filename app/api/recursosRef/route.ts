import { NextRequest, NextResponse } from "next/server";
import { crearRecursoPropio, modificarRecursoPropio, listarRecursosPropio } from "@/lib/recursosRef";
import { request } from "http";

export async function GET() {
  try {
    const data = await listarRecursosPropio();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[RECURSO_REF_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await crearRecursoPropio(request);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[RECURSO_REF_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await modificarRecursoPropio(request);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[RECURSO_REF_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
