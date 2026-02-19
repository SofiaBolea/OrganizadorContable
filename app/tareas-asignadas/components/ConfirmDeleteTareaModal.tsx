"use client";

import { useState } from "react";

interface ConfirmDeleteTareaModalProps {
  isOpen: boolean;
  titulo: string;
  onClose: () => void;
  onDeleteOne: () => void;
  onDeleteAll: () => void;
}

export default function ConfirmDeleteTareaModal({
  isOpen,
  titulo,
  onClose,
  onDeleteOne,
  onDeleteAll,
}: ConfirmDeleteTareaModalProps) {
  const [opcion, setOpcion] = useState<"one" | "all">("one");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (opcion === "one") {
      onDeleteOne();
    } else {
      onDeleteAll();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-text mb-4">Eliminar Tarea</h3>

        <p className="text-text/70 mb-6 text-center">
          Se eliminará <strong className="text-text">{titulo}</strong>
        </p>

        <div className="space-y-3 mb-8">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="deleteOption"
              checked={opcion === "one"}
              onChange={() => setOpcion("one")}
              className="w-4 h-4 accent-primary-foreground"
            />
            <span className="text-text/80 group-hover:text-text transition-colors">
              Solo esta asignación
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="deleteOption"
              checked={opcion === "all"}
              onChange={() => setOpcion("all")}
              className="w-4 h-4 accent-primary-foreground"
            />
            <span className="text-text/80 group-hover:text-text transition-colors">
              Eliminar la tarea completa (todas las asignaciones)
            </span>
          </label>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-base font-medium transition-opacity border-[3px] bg-danger text-danger-foreground border-danger-foreground hover:opacity-90"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-3 rounded-xl text-base font-medium transition-opacity border-[3px] bg-primary text-primary-foreground border-primary-foreground hover:opacity-90"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
