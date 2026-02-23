// lib/reportes.ts
import prisma from "./prisma";
import { startOfWeek, startOfMonth, subDays, startOfDay } from "date-fns";

export async function getReporteData(periodo: string, orgId: string) {
  const ahora = new Date();
  let fechaInicio = startOfDay(ahora);

  if (periodo === "semanal") fechaInicio = startOfWeek(ahora, { weekStartsOn: 1 });
  else if (periodo === "quincenal") fechaInicio = subDays(ahora, 15);
  else if (periodo === "mensual") fechaInicio = startOfMonth(ahora);

  // 1. Obtener todas las ocurrencias en el rango de la organización
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

  // 2. Procesar datos para Tremor
  const statsPorAsistente = ocurrencias.reduce((acc: any, curr) => {
    const nombre = curr.tareaAsignacion.asignado.nombreCompleto;
    if (!acc[nombre]) acc[nombre] = { name: nombre, Completadas: 0, Pendientes: 0, Vencidas: 0 };
    
    if (curr.estado === "COMPLETADA") acc[nombre].Completadas++;
    else if (curr.estado === "PENDIENTE") acc[nombre].Pendientes++;
    else if (curr.estado === "VENCIDA") acc[nombre].Vencidas++;
    
    return acc;
  }, {});

  return Object.values(statsPorAsistente);
}