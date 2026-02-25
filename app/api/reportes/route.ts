// app/api/reportes/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getReporteData } from "@/lib/reportes";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const periodo = searchParams.get("periodo") || "semanal";
        const { orgId, userId } = await auth();

        if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const data = await getReporteData(periodo, orgId, userId);
        return NextResponse.json(data);
        // En app/api/reportes/route.ts
    } catch (error) {
        console.error("DETALLE DEL ERROR EN API:", error); // Esto aparecerá en tu terminal
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}