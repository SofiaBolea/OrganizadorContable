import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { startOfWeek, startOfMonth, subDays, startOfDay } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "semanal";
    const { orgId } = await auth();

    if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let fechaInicio = startOfDay(new Date());
    if (periodo === "semanal") fechaInicio = startOfWeek(new Date(), { weekStartsOn: 1 });
    else if (periodo === "quincenal") fechaInicio = subDays(new Date(), 15);
    else if (periodo === "mensual") fechaInicio = startOfMonth(new Date());

    const ocurrencias = await prisma.ocurrencia.findMany({
      where: {
        fechaOriginal: { gte: fechaInicio },
        tareaAsignacion: {
          tarea: { recurso: { organizacionId: orgId } }
        }
      },
      include: {
        tareaAsignacion: {
          include: { asignado: { select: { nombreCompleto: true } } }
        }
      }
    });

    const statsMap: Record<string, any> = {};

    ocurrencias.forEach((curr) => {
      const nombre = curr.tareaAsignacion?.asignado?.nombreCompleto || "Sin Asignar";
      if (!statsMap[nombre]) {
        statsMap[nombre] = { name: nombre, completadas: 0, pendientes: 0, vencidas: 0, total: 0 };
      }
      
      statsMap[nombre].total++;
      if (curr.estado === "COMPLETADA") statsMap[nombre].completadas++;
      else if (curr.estado === "PENDIENTE") statsMap[nombre].pendientes++;
      else if (curr.estado === "VENCIDA") statsMap[nombre].vencidas++;
    });

    return NextResponse.json(Object.values(statsMap));
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}