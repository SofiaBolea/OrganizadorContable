"use client";

import React from "react";
import { X } from "lucide-react";

interface DetalleTareaModalProps {
  tarea: {
    titulo: string;
    descripcion?: string | null;
    fechaOcurrencia?: string | null;
    prioridad?: string;
    estado?: string;
  };
  onClose: () => void;
}

const DetalleTareaModal = ({ tarea, onClose }: DetalleTareaModalProps) => {
  const getPrioridadStyle = (prioridad: string) => {
    if (prioridad?.toLowerCase() === "baja") return "bg-[#a3c981] text-white";
    if (prioridad?.toLowerCase() === "media")
      return "bg-yellow-400 text-white";
    return "bg-red-400 text-white";
  };

  function formatFecha(fechaStr: string | null | undefined) {
    if (!fechaStr) return "Sin fecha";
    const parts = fechaStr.split("T")[0].split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm font-['Montserrat',sans-serif]">
      <div className="relative bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden p-8 md:p-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-2xl font-medium text-gray-500 tracking-tight">
            Detalle Tarea
          </h2>

          <div className="flex items-center gap-5">
            <span className="text-2xl font-semibold text-[#f5b041]">
              {tarea.estado}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-gray-300 hover:text-gray-600"
          >
            <X size={28} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Título Input-like */}
          <div className="bg-[#f2f2f0] py-3 px-6 rounded-2xl">
            <span className="text-sm text-gray-600 font-medium tracking-wide">
              {tarea.titulo}
            </span>
          </div>

          {/* Descripción Input-like */}
          {tarea.descripcion && (
            <div className="bg-[#f2f2f0] p-6 rounded-[25px] min-h-[150px]">
              <h4 className="text-gray-400 font-bold mb-3 text-xs uppercase tracking-widest">
                Descripción
              </h4>
              <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-line font-medium">
                {tarea.descripcion}
              </div>
            </div>
          )}

          {/* Footer: Vence y Prioridad */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Vence */}
            <div className="flex-1 bg-[#f2f2f0] py-3 px-7 rounded-full flex justify-between items-center">
              <span className="text-gray-500 font-bold text-sm">Vence</span>
              <span className="text-gray-700 font-bold text-sm">
                {formatFecha(tarea.fechaOcurrencia)}
              </span>
            </div>

            {/* Prioridad */}
            <div className="flex-[0.8] bg-[#f2f2f0] py-3 px-7 rounded-full flex justify-between items-center">
              <span className="text-gray-500 font-bold text-sm mr-4">
                Prioridad
              </span>
              <span
                className={`px-5 py-0.5 rounded-full font-bold text-xs ${getPrioridadStyle(
                  tarea.prioridad || "Baja"
                )}`}
              >
                {tarea.prioridad || "Baja"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleTareaModal;
