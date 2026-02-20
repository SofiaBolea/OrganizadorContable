"use client";

import { Button } from "../components/Button";

interface Props {
  nombreCliente: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ModalConfirmacionEliminar({ nombreCliente, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-white text-center">
        <h2 className="text-2xl font-medium text-slate-700 mb-8 text-left">Eliminar Cliente</h2>
        
        <p className="text-slate-600 mb-10 text-lg">
          ¿Seguro desea eliminar a <span className="font-bold text-slate-800">{nombreCliente}</span>?
        </p>

        <div className="flex justify-between gap-4">
          <Button
            onClick={onCancel}
            variant="peligro"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            variant="primario"
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}