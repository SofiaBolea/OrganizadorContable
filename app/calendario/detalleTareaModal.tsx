"use client";

import { Pencil, Trash2, X } from 'lucide-react';

interface DetalleTareaModalProps {
  tarea: {
    titulo: string;
    descripcion?: string;
    fecha: string;
    prioridad?: string;
    estado?: string;
    recurrencia?: string;
  };
  onClose: () => void;
}

const DetalleTareaModal = ({ tarea, onClose }: DetalleTareaModalProps) => {
  const getPrioridadStyle = (prioridad: string) => {
    if (prioridad?.toLowerCase() === 'baja') return 'bg-[#90BF77] ';
    if (prioridad?.toLowerCase() === 'media') return 'bg-[#F7D78C] ';
    return 'bg-[#E87A58] ';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm font-['Montserrat',sans-serif]">
      <div className="relative bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden p-8 md:p-10 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-2xl font-medium text-gray-500 tracking-tight">Detalle</h2>

          <div className="flex items-center gap-5">
            <span className="text-2xl font-semibold text-[#F9C56D]">
              {tarea.estado}
            </span>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-[#90BF77] transition-colors">
                <Pencil size={20} />
              </button>
            </div>
          </div>
          <button onClick={onClose} className="ml-2 text-gray-300 hover:text-gray-600">
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
          <div className="bg-[#f2f2f0] p-6 rounded-[25px] min-h-[150px]">
            <h4 className="text-gray-400 font-bold mb-3 text-xs uppercase tracking-widest">Descripción</h4>
            <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-line font-medium">
              {tarea.descripcion}
            </div>
          </div>

          {/* Recurrencia */}
          <div className="bg-[#f2f2f0] py-3 px-7 rounded-full flex justify-between items-center">
            <span className="text-gray-500 font-bold text-sm">Recurrencia</span>
            <span className="text-gray-700 font-bold text-sm">
              {tarea.recurrencia || '1 vez a la semana'}
            </span>
          </div>

          {/* Footer: Vence y Prioridad */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Vence */}
            <div className="flex-1 bg-[#f2f2f0] py-3 px-7 rounded-full flex justify-between items-center">
              <span className="text-gray-500 font-bold text-sm">Vence</span>
              <span className="text-gray-700 font-bold text-sm">{tarea.fecha}</span>
            </div>

            {/* Prioridad */}
            <div className="flex-[0.8] bg-[#f2f2f0] py-3 px-7 rounded-full flex justify-between items-center">
              <span className="text-gray-500 font-bold text-sm mr-4">Prioridad</span>
              <span className={`px-5 py-0.5 rounded-full font-bold text-xs ${getPrioridadStyle(tarea.prioridad || 'Baja')}`}>
                {tarea.prioridad || 'Baja'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetalleTareaModal;