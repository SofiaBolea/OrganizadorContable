import { NextRequest, NextResponse } from "next/server";
import { crearRecursoPropio, modificarRecursoPropio } from "@/lib/recursosRef";

export async function POST(request: NextRequest) {
  try {
    const result = await crearRecursoPropio(request);
    return result;
  } catch (error: any) {
    console.error("[RECURSO_REF_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await modificarRecursoPropio(request);
    return result;
  } catch (error: any) {
    console.error("[RECURSO_REF_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
