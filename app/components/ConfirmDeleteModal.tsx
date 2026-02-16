"use client";

import { X } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  fecha: string;
  onClose: () => void;
  onDeleteOne: () => void;
  onDeleteAndFollowing: () => void;
  isLast: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  fecha,
  onClose,
  onDeleteOne,
  onDeleteAndFollowing,
  isLast,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const str = typeof fecha === "string" ? fecha : new Date(fecha).toISOString();
  const [y, m, d] = str.split("T")[0].split("-");
  const fechaFormato = `${d}/${m}/${y}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Confirmar eliminación</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-700 mb-6">
          ¿Qué deseas hacer con la fecha del <strong>{fechaFormato}</strong>?
        </p>

        <div className="space-y-3">
          <button
            onClick={onDeleteOne}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
          >
            Eliminar solo esta fecha
          </button>

          {!isLast && (
            <button
              onClick={onDeleteAndFollowing}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-semibold"
            >
              Eliminar esta y las siguientes
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
