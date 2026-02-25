// app/calendario/logic.ts
import { TareaAsignacionRow } from "@/lib/tareas";

export function colapsarAsignacionesPorTarea(rows: TareaAsignacionRow[]): TareaAsignacionRow[] {
  const map = new Map<string, TareaAsignacionRow>();

  rows.forEach((row) => {
    if (!map.has(row.tareaId)) {
      // Importante: Clonamos para no mutar el array original
      map.set(row.tareaId, { 
        ...row,
        // Usaremos una propiedad temporal para guardar los nombres de los asistentes
        asignadoNombre: row.asignadoNombre 
      });
    } else {
      const existing = map.get(row.tareaId)!;
      // Acumulamos nombres si no están repetidos
      if (!existing.asignadoNombre.includes(row.asignadoNombre)) {
        existing.asignadoNombre += `, ${row.asignadoNombre}`;
      }
      
      // Unificamos ocurrencias materializadas por fecha original
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