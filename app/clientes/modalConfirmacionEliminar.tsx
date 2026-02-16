"use client";

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
          <button
            onClick={onCancel}
            className="flex-1 bg-[#f4a28c] text-[#8e4a3a] py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#98c18c] text-[#3e5a34] py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}