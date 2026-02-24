"use client";

import { useState, useCallback } from "react";
import TareaItemRow from "./TareaItemRow";
import DetalleTareaModal from "./DetalleTareaModal";
import type { TareaAsignacionRow, TareaDisplayRow } from "@/lib/tareas-shared";
import { expandirTareasADisplayRows } from "@/lib/tareas-shared";

interface TareasAsignadasCardProps {
  tareasAsignacion: TareaAsignacionRow[];
}

export default function TareasAsignadasCard({
  tareasAsignacion,
}: TareasAsignadasCardProps) {
  const [tareas, setTareas] = useState<TareaDisplayRow[]>(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hastaDia = new Date(hoy);
    hastaDia.setDate(hastaDia.getDate() + 7);
    hastaDia.setHours(23, 59, 59, 999);

    // Expandir y filtrar por rango de 7 días
    return expandirTareasADisplayRows(tareasAsignacion).filter((t) => {
      if (!t.fechaOcurrencia) return false;
      const fecha = new Date(t.fechaOcurrencia);
      return fecha >= hoy && fecha <= hastaDia;
    });
  });
  const [modalTarea, setModalTarea] = useState<TareaDisplayRow | null>(null);

  const handleVerDetalle = useCallback((tarea: TareaDisplayRow) => {
    setModalTarea(tarea);
  }, []);

  const handleEstadoChange = useCallback(
    async (tarea: TareaDisplayRow, nuevoEstado: string) => {
      try {
        const fechaOriginal = tarea.fechaOriginalOcurrencia || tarea.fechaOcurrencia || new Date().toISOString().split("T")[0];
        const response = await fetch("/api/tareas/ocurrencias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tareaAsignacionId: tarea.tareaAsignacionId,
            fechaOriginal,
            estado: nuevoEstado,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error("Error:", data.error || "Error al actualizar estado");
          return;
        }

        setTareas((prev) =>
          prev.map((t) =>
            t.ocurrenciaId === tarea.ocurrenciaId ? { ...t, estado: nuevoEstado } : t
          )
        );
      } catch (error) {
        console.error("Error:", error);
      }
    },
    []
  );

  return (
    <>
      <div className="dashboard-card dashboard-card-tareas-asignadas">
        <h2 className="dashboard-card-title">Tareas Asignadas</h2>

        <div className="dashboard-tareas-list">
          {tareas.length === 0 ? (
            <div className="dashboard-empty-state">
              <p>No hay tareas asignadas esta semana</p>
            </div>
          ) : (
            tareas.map((tarea) => (
              <TareaItemRow
                key={tarea.key}
                tarea={tarea}
                esAsignada={true}
                onVerDetalle={() => handleVerDetalle(tarea)}
                onEstadoChange={(nuevoEstado) =>
                  handleEstadoChange(tarea, nuevoEstado)
                }
              />
            ))
          )}
        </div>
      </div>

      {modalTarea && (
        <DetalleTareaModal
          tarea={modalTarea}
          onClose={() => setModalTarea(null)}
        />
      )}
    </>
  );
}
