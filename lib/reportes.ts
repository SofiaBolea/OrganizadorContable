// lib/reportes.ts
import prisma from "./prisma";
import { startOfWeek, startOfMonth, subDays, startOfDay, endOfDay } from "date-fns";
import { expandirTareasADisplayRows, TareaAsignacionRow } from "./tareas-shared";

export async function getReporteData(periodo: string, clerkOrgId: string) {
    console.log("1. Buscando reporte para Clerk OrgId:", clerkOrgId);
    const ahora = new Date();
    const fechaFin = endOfDay(ahora); // Reporte hasta el final de hoy
    let fechaInicio = startOfDay(ahora);

    if (periodo === "semanal") fechaInicio = startOfWeek(ahora, { weekStartsOn: 1 });
    else if (periodo === "quincenal") fechaInicio = subDays(ahora, 15);
    else if (periodo === "mensual") fechaInicio = startOfMonth(ahora);

    const fechaInicioStr = fechaInicio.toISOString().split("T")[0];
    const fechaFinStr = fechaFin.toISOString().split("T")[0];

    // 1. IMPORTANTE: Buscar el ID interno de la organización usando el de Clerk
    const organizacion = await prisma.organizacion.findUnique({
        where: { clerkOrganizationId: clerkOrgId },
    });

    if (!organizacion) {
        console.error("Organización no encontrada en DB para el Clerk ID:", clerkOrgId);
        return [];
    }
    console.log("3. Organización encontrada en DB interna:", organizacion.id);
    // 2. Obtener las asignaciones con sus tareas y recurrencias
    const asignacionesDB = await prisma.tareaAsignacion.findMany({
        where: {
            tarea: { recurso: { organizacionId: organizacion.id } }, // Ahora usamos el ID interno correcto
            estado: { not: "REVOCADA" }
        },
        include: {
            tarea: { include: { recurrencia: true } },
            asignado: { select: { id: true, nombreCompleto: true } },
            asignadoPor: { select: { id: true, nombreCompleto: true } },
            refColor: { select: { id: true, titulo: true, codigoHexa: true } },
            ocurrencias: true
        }
    });

    console.log(`4. Tareas encontradas en DB: ${asignacionesDB.length}`);

    // 3. Mapear al tipo TareaAsignacionRow para la lógica compartida
    const asignacionesMapped: TareaAsignacionRow[] = asignacionesDB.map((asig) => ({
        tareaAsignacionId: asig.id,
        tareaId: asig.tareaId,
        titulo: asig.tarea.titulo,
        prioridad: asig.tarea.prioridad,
        tipoTarea: asig.tarea.tipoTarea,
        fechaVencimientoBase: asig.tarea.fechaVencimientoBase?.toISOString() || null,
        descripcion: asig.tarea.descripcion,
        asignadoId: asig.asignado.id,
        asignadoNombre: asig.asignado.nombreCompleto,
        asignadoPorId: asig.asignadoPor.id,
        asignadoPorNombre: asig.asignadoPor.nombreCompleto,
        estado: asig.estado,
        fechaAsignacion: asig.fechaAsignacion.toISOString(),
        refColorId: asig.refColor?.id || null,
        refColorTitulo: asig.refColor?.titulo || null,
        refColorHexa: asig.refColor?.codigoHexa || null,
        recurrencia: asig.tarea.recurrencia ? {
            frecuencia: asig.tarea.recurrencia.frecuencia,
            intervalo: asig.tarea.recurrencia.intervalo,
            diaSemana: asig.tarea.recurrencia.diaSemana,
            diaDelMes: asig.tarea.recurrencia.diaDelMes,
            mesDelAnio: asig.tarea.recurrencia.mesDelAnio,
            hastaFecha: asig.tarea.recurrencia.hastaFecha?.toISOString() || null,
            conteoMaximo: asig.tarea.recurrencia.conteoMaximo,
        } : null,
        ocurrenciasMaterializadas: asig.ocurrencias.map((o) => ({
            id: o.id,
            fechaOriginal: o.fechaOriginal.toISOString(),
            estado: o.estado,
            tituloOverride: o.tituloOverride,
            fechaOverride: o.fechaOverride?.toISOString() || null,
            colorOverride: o.colorOverride,
            descripcionOverride: o.descripcionOverride,
            prioridadOverride: o.prioridadOverride,
        })),
    }));

    // 4. Aplicar Lazy Expansion para incluir tareas virtuales
    const todasLasFilas = expandirTareasADisplayRows(asignacionesMapped);
    console.log(`5. Tareas tras expansión (reales + virtuales): ${todasLasFilas.length}`);
    // 5. Filtrar por el rango de fechas del reporte
    const filasFiltradas = todasLasFilas.filter(fila => {
        if (!fila.fechaOcurrencia) return false;
        const fechaStr = fila.fechaOcurrencia.split("T")[0];
        return fechaStr >= fechaInicioStr && fechaStr <= fechaFinStr;
    });

    // 6. Agrupar estadísticas por asistente
    const statsMap: Record<string, any> = {};

    filasFiltradas.forEach((fila) => {
        const nombre = fila.asignadoNombre;
        if (!statsMap[nombre]) {
            statsMap[nombre] = { name: nombre, completadas: 0, pendientes: 0, vencidas: 0, total: 0 };
        }

        statsMap[nombre].total++;
        if (fila.estado === "COMPLETADA") statsMap[nombre].completadas++;
        else if (fila.estado === "PENDIENTE") statsMap[nombre].pendientes++;
        else if (fila.estado === "VENCIDA") statsMap[nombre].vencidas++;
    });

    return Object.values(statsMap);
}