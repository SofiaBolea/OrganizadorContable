"use client";

import { useState } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  fecha: string;
  titulo?: string;
  onClose: () => void;
  onDeleteOne: () => void;
  onDeleteAndFollowing: () => void;
  isLast: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  fecha,
  titulo,
  onClose,
  onDeleteOne,
  onDeleteAndFollowing,
  isLast,
}: ConfirmDeleteModalProps) {
  const [opcion, setOpcion] = useState<"one" | "following">("one");

  if (!isOpen) return null;

  const str = typeof fecha === "string" ? fecha : new Date(fecha).toISOString();
  const [y, m, d] = str.split("T")[0].split("-");
  const fechaFormato = `${d}/${m}/${y}`;

  const handleConfirm = () => {
    if (opcion === "one") {
      onDeleteOne();
    } else {
      onDeleteAndFollowing();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-xl p-8 max-w-md w-full mx-4">
        {/* Título */}
        <h3 className="text-xl font-bold text-text mb-4">Eliminar Vencimiento</h3>

        {/* Descripción */}
        <p className="text-text/70 mb-6 text-center">
          Se eliminará <strong className="text-text">{titulo || "el vencimiento"}</strong> del{" "}
          <strong className="text-text">{fechaFormato}</strong>
        </p>

        {/* Opciones radio */}
        <div className="space-y-3 mb-8">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="deleteOption"
              checked={opcion === "one"}
              onChange={() => setOpcion("one")}
              className="w-4 h-4 accent-primary-foreground"
            />
            <span className="text-text/80 group-hover:text-text transition-colors">Solo esta fecha</span>
          </label>

          {!isLast && (
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="deleteOption"
                checked={opcion === "following"}
                onChange={() => setOpcion("following")}
                className="w-4 h-4 accent-primary-foreground"
              />
              <span className="text-text/80 group-hover:text-text transition-colors">Esta fecha y todas las siguientes</span>
            </label>
          )}
        </div>

        {/* Botones */}
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
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
