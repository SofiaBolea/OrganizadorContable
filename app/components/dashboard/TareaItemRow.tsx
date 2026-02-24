"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckSquare, Square } from "lucide-react";
import ConfirmEstadoModal from "./ConfirmEstadoModal";
import type { TareaDisplayRow } from "@/lib/tareas-shared";

interface TareaItemRowProps {
    tarea: TareaDisplayRow;
    esAsignada: boolean;
    colorHexa?: string | null;
    onVerDetalle: () => void;
    onEstadoChange?: (nuevoEstado: string) => Promise<void>;
}

function formatFecha(fechaStr: string | null) {
    if (!fechaStr) return "Sin fecha";
    const parts = fechaStr.split("T")[0].split("-");
    return `${parts[2]}/${parts[1]}`;
}

export default function TareaItemRow({
    tarea,
    esAsignada,
    colorHexa,
    onVerDetalle,
    onEstadoChange,
}: TareaItemRowProps) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const esCompletada = tarea.estado === "COMPLETADA";

    const handleToggleEstado = async () => {
        if (esAsignada) {
            // Para tareas asignadas, solo permitir marcar como completada con confirmación
            if (!esCompletada) {
                setShowConfirmModal(true);
            }
            return;
        }

        // Para tareas propias, togglear sin confirmación
        setLoading(true);
        try {
            const nuevoEstado = esCompletada ? "PENDIENTE" : "COMPLETADA";
            if (onEstadoChange) {
                await onEstadoChange(nuevoEstado);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmEstado = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        try {
            if (onEstadoChange) {
                await onEstadoChange("COMPLETADA");
            }
        } finally {
            setLoading(false);
        }
    };

    const styleVariant = colorHexa
        ? {
            backgroundColor: colorHexa.startsWith('#')
                ? `${colorHexa}60`  // 40 en hex = ~25% opacity
                : `#${colorHexa}60`
        }
        : {};

    return (
        <>
            <div
                className="dashboard-tarea-item"
                style={styleVariant}
            >
                {/* Checkbox */}
                <button
                    onClick={handleToggleEstado}
                    disabled={loading || (esAsignada && esCompletada)}
                    className="dashboard-tarea-checkbox"
                >
                    {esCompletada ? (
                        <div className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center">
                            <Check size={14} className="text-white" />
                        </div>
                    ) : (
                        <div className="w-5 h-5 border border-gray-400 rounded-sm" />
                    )}
                </button>

                {/* Contenido */}
                <div className="dashboard-tarea-content">
                    <div className="flex items-center gap-2">
                        <span className={`dashboard-tarea-titulo ${esCompletada ? "line-through opacity-60" : ""}`}>
                            {tarea.titulo}
                        </span>
                        {!esAsignada && colorHexa && (
                            <div
                                className="dashboard-tarea-color-dot"
                                style={{ backgroundColor: colorHexa }}
                            />
                        )}
                    </div>
                    <div className="dashboard-tarea-meta">
                        <span className="dashboard-tarea-fecha">{formatFecha(tarea.fechaOcurrencia)}</span>
                        <span className={`dashboard-tarea-prioridad badge-prioridad ${tarea.prioridad === "ALTA"
                                ? "badge-prioridad-alta"
                                : tarea.prioridad === "MEDIA"
                                    ? "badge-prioridad-media"
                                    : "badge-prioridad-baja"
                            }`}>
                            {tarea.prioridad}
                        </span>
                    </div>
                </div>

                {/* Ver Detalle */}
                <button
                    onClick={onVerDetalle}
                    className="dashboard-tarea-detalle"
                >
                    Ver detalle
                </button>
            </div>

            {esAsignada && (
                <ConfirmEstadoModal
                    isOpen={showConfirmModal}
                    titulo={tarea.titulo}
                    nuevoEstado="COMPLETADA"
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleConfirmEstado}
                />
            )}
        </>
    );
}
