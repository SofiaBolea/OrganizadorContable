"use client";

interface ConfirmEstadoModalProps {
  isOpen: boolean;
  titulo: string;
  nuevoEstado: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmEstadoModal({
  isOpen,
  titulo,
  nuevoEstado,
  onClose,
  onConfirm,
}: ConfirmEstadoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-text mb-4">Confirmar Cambio de Estado</h3>

        <p className="text-text/70 mb-2 text-center">
          Estás por marcar <strong className="text-text">{titulo}</strong> como{" "}
          <strong className="text-text">{nuevoEstado.replace("_", " ")}</strong>.
        </p>

        <p className="text-danger-foreground text-sm text-center mb-8 font-medium">
          Una vez marcada como completada, solo el administrador podrá revertir el estado.
        </p>

        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-base font-medium transition-opacity border-[3px] bg-danger text-danger-foreground border-danger-foreground hover:opacity-90"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-3 rounded-xl text-base font-medium transition-opacity border-[3px] bg-primary text-primary-foreground border-primary-foreground hover:opacity-90"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
