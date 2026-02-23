import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { startOfWeek, startOfMonth, subDays, startOfDay } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get("periodo") || "semanal";
  const { orgId } = await auth();

  if (!orgId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let fechaInicio = startOfDay(new Date());
  if (periodo === "semanal") fechaInicio = startOfWeek(new Date(), { weekStartsOn: 1 });
  else if (periodo === "quincenal") fechaInicio = subDays(new Date(), 15);
  else if (periodo === "mensual") fechaInicio = startOfMonth(new Date());

  // Obtenemos las ocurrencias de tareas de la organización
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

  // Formateamos los datos para los gráficos de Tremor
  const statsMap = ocurrencias.reduce((acc: any, curr) => {
    const nombre = curr.tareaAsignacion.asignado.nombreCompleto || "Sin nombre";
    if (!acc[nombre]) acc[nombre] = { name: nombre, Completadas: 0, Pendientes: 0, Vencidas: 0 };
    
    if (curr.estado === "COMPLETADA") acc[nombre].Completadas++;
    else if (curr.estado === "PENDIENTE") acc[nombre].Pendientes++;
    else if (curr.estado === "VENCIDA") acc[nombre].Vencidas++;
    
    return acc;
  }, {});

  return NextResponse.json(Object.values(statsMap));
}