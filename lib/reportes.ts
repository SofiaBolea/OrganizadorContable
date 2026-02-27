// lib/reportes.ts
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, startOfDay } from "date-fns";
import { expandirTareasADisplayRows, TareaAsignacionRow } from "./tareas-shared";
import prisma from "./prisma";

export async function getReporteData(periodo: string, clerkOrgId: string, userId: string) {
    const ahora = new Date();
    let fechaInicio = startOfDay(ahora);
    let fechaFin = endOfWeek(ahora, { weekStartsOn: 1 });

    if (periodo === "semanal") {
        fechaInicio = startOfWeek(ahora, { weekStartsOn: 1 });
        fechaFin = endOfWeek(ahora, { weekStartsOn: 1 });
    } else if (periodo === "quincenal") {
        fechaInicio = subDays(ahora, 15);
        fechaFin = ahora;
    } else if (periodo === "mensual") {
        fechaInicio = startOfMonth(ahora);
        fechaFin = endOfMonth(ahora);
    }

    const fechaInicioStr = fechaInicio.toISOString().split("T")[0];
    const fechaFinStr = fechaFin.toISOString().split("T")[0];

    const organizacion = await prisma.organizacion.findUnique({
        where: { clerkOrganizationId: clerkOrgId },
    });

    if (!organizacion) return { stats: [], rango: { inicio: fechaInicioStr, fin: fechaFinStr } };

    const usuarioActual = await prisma.usuario.findFirst({
        where: { clerkId: userId, organizacionId: organizacion.id },
        select: { id: true }
    });

    const asignacionesDB = await prisma.tareaAsignacion.findMany({
        where: {
            asignadoPorId: usuarioActual?.id,
            tarea: { recurso: { organizacionId: organizacion.id } },
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
            colorOverride: null,
            descripcionOverride: o.descripcionOverride,
            prioridadOverride: o.prioridadOverride,
            // FIX: Agregamos estos campos como null para cumplir con la interfaz
            // sin tocar los archivos de tareas.
            refColorId: null,
            refColorHexa: null,
            refColorTitulo: null,
        })),
    }));

    const todasLasFilas = expandirTareasADisplayRows(asignacionesMapped);

    const filasFiltradas = todasLasFilas.filter(fila => {
        if (!fila.fechaOcurrencia) return false;
        const fechaStr = fila.fechaOcurrencia.split("T")[0];
        return fechaStr >= fechaInicioStr && fechaStr <= fechaFinStr;
    });

    const statsMap: Record<string, any> = {};

    filasFiltradas.forEach((fila) => {
        const nombre = fila.asignadoNombre || "Sin nombre";
        if (!statsMap[nombre]) {
            statsMap[nombre] = { 
                name: nombre, completadas: 0, pendientes: 0, vencidas: 0, total: 0,
                alta: 0, media: 0, baja: 0 
            };
        }
        statsMap[nombre].total++;
        if (fila.estado === "COMPLETADA") statsMap[nombre].completadas++;
        else if (fila.estado === "PENDIENTE") statsMap[nombre].pendientes++;
        else if (fila.estado === "VENCIDA") statsMap[nombre].vencidas++;

        const p = fila.prioridad?.toUpperCase();
        if (p === "ALTA") statsMap[nombre].alta++;
        else if (p === "MEDIA") statsMap[nombre].media++;
        else if (p === "BAJA") statsMap[nombre].baja++;
    });

    return {
        stats: Object.values(statsMap),
        rango: { inicio: fechaInicioStr, fin: fechaFinStr }
    };
}