// lib/calendario.ts
import prisma from "@/lib/prisma";
import { 
    getTareasAsignadasAdmin, 
    getTareasAsignadasAsistente, 
    getTareasPropias 
} from "@/lib/tareas";
import { expandirTareasADisplayRows, TareaAsignacionRow } from "@/lib/tareas-shared";

/**
 * Agrupa asignaciones por tareaId.
 * Esto garantiza que si una tarea está asignada a 5 personas, solo se vea 1 vez en el calendario.
 */
function colapsarAsignacionesPorTarea(rows: TareaAsignacionRow[]): TareaAsignacionRow[] {
    const map = new Map<string, TareaAsignacionRow>();
    
    rows.forEach(row => {
        if (!map.has(row.tareaId)) {
            // Clonamos la primera asignación que encontramos para esta tarea
            map.set(row.tareaId, { ...row });
        } else {
            const existing = map.get(row.tareaId)!;
            
            // 1. Unificamos nombres de asistentes para el detalle
            if (!existing.asignadoNombre.includes(row.asignadoNombre)) {
                existing.asignadoNombre += `, ${row.asignadoNombre}`;
            }
            
            // 2. Mezclamos ocurrencias materializadas evitando duplicados por FECHA ORIGINAL
            // Esto evita que si dos personas marcaron como completada la misma ocurrencia, salga duplicada.
            const fechasExistentes = new Set(existing.ocurrenciasMaterializadas.map(o => o.fechaOriginal));
            row.ocurrenciasMaterializadas.forEach(oc => {
                if (!fechasExistentes.has(oc.fechaOriginal)) {
                    existing.ocurrenciasMaterializadas.push(oc);
                }
            });
        }
    });
    return Array.from(map.values());
}

export async function obtenerEventosCalendario(clerkOrgId: string, clerkUserId: string) {
    const orgLocal = await prisma.organizacion.findUnique({
        where: { clerkOrganizationId: clerkOrgId },
        select: { id: true }
    });
    if (!orgLocal) throw new Error("Organización no encontrada");

    // 1. Obtenemos todas las fuentes posibles de tareas
    const [propias, creadasPorMi, asignadasAMi] = await Promise.all([
        getTareasPropias(clerkOrgId, clerkUserId),
        getTareasAsignadasAdmin(clerkOrgId, clerkUserId),
        getTareasAsignadasAsistente(clerkOrgId, clerkUserId)
    ]);

    // 2. Unimos todo en un solo array eliminando duplicados de la MISMA asignación
    // (Una asignación puede estar en 'creadasPorMi' y 'asignadasAMi' a la vez)
    const mapaAsignacionesUnicas = new Map<string, TareaAsignacionRow>();
    [...propias, ...creadasPorMi, ...asignadasAMi].forEach(a => {
        mapaAsignacionesUnicas.set(a.tareaAsignacionId, a);
    });

    // 3. APLICAMOS EL COLAPSO POR TAREA (Paso crítico para evitar duplicados visuales)
    // Esto se ejecuta para todos los usuarios, asegurando la "vista general" solicitada.
    const asignacionesUnificadas = colapsarAsignacionesPorTarea(Array.from(mapaAsignacionesUnicas.values()));

    // 4. Expandir recurrencias y generar eventos
    const tareasExpandidas = expandirTareasADisplayRows(asignacionesUnificadas);
    
    const eventosTareas = tareasExpandidas
        .filter(t => t.fechaOcurrencia) // Filtro de seguridad para evitar crashes
        .map(t => ({
            title: t.titulo,
            start: t.fechaOcurrencia, 
            end: t.fechaOcurrencia,
            allDay: true,
            resource: {
                type: 'tarea',
                id:  t.tareaAsignacionId,
                descripcion: t.descripcion,
                prioridad: t.prioridad,
                estado: t.estado,
                color: t.refColorHexa,
                asistentes: t.asignadoNombre,
                tipoTarea: t.tipoTarea
            }
        }));

    // 5. Vencimientos
    const vencimientos = await prisma.vencimientoOcurrencia.findMany({
        where: { vencimiento: { recurso: { organizacionId: orgLocal.id } } },
        include: { vencimiento: true }
    });

    const eventosVencimientos = vencimientos.map(v => ({
        title: v.vencimiento.titulo,
        start: v.fechaVencimiento.toISOString(),
        end: v.fechaVencimiento.toISOString(),
        allDay: true,
        resource: {
            type: 'vencimiento',
            id: v.id,
            descripcion: `Jurisdicción: ${v.vencimiento.jurisdiccion || 'N/A'}`,
            prioridad: 'ALTA'
        }
    }));

    return [...eventosTareas, ...eventosVencimientos];
}