// app/api/calendario/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { obtenerEventosCalendario } from "@/lib/calendario";

export async function GET() {
    try {
        const { userId, orgId } = await auth();
        if (!userId || !orgId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const eventos = await obtenerEventosCalendario(orgId, userId);
        return NextResponse.json(eventos);
    } catch (error) {
        console.error("Error en API calendario:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}