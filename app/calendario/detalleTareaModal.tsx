"use client";
import { X, Clock, AlignLeft, ExternalLink, AlertCircle } from 'lucide-react';

interface DetalleTareaModalProps {
  tarea: {
    titulo: string;
    descripcion?: string;
    fecha: string;
    color: string;
    prioridad?: string;
    estado?: string;
    type?: string;
  };
  onClose: () => void;
  onVerMas: () => void;
}

const DetalleTareaModal = ({ tarea, onClose, onVerMas }: DetalleTareaModalProps) => {
  return (
    // Fondo translúcido con desenfoque (no negro sólido)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Barra lateral de color - DISPOSICIÓN IGUAL A LA IMAGEN */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-3" 
          style={{ backgroundColor: tarea.color }}
        />
        
        <div className="p-10 pl-12"> {/* Más padding izquierdo por la barra */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-3">
              <span className={`text-[11px] uppercase tracking-[0.15em] px-3 py-1 rounded-full font-extrabold ${
                tarea.type === 'vencimiento' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {tarea.type || 'Tarea'}
              </span>
              <h3 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">
                {tarea.titulo}
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-black"
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Sección Fecha */}
            <div className="flex items-start gap-5">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Clock size={20} className="text-gray-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-base">{tarea.fecha}</span>
                <span className="text-gray-400 text-sm font-semibold">Todo el día</span>
              </div>
            </div>

            {/* Sección Prioridad/Estado */}
            <div className="flex items-center gap-5">
              <div className="p-2 bg-gray-50 rounded-lg">
                <AlertCircle size={20} className="text-gray-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                {tarea.prioridad && (
                  <span className={`text-[11px] px-3 py-1 rounded-lg font-black border ${
                    tarea.prioridad === 'ALTA' ? 'bg-red-50 text-red-600 border-red-100' : 
                    tarea.prioridad === 'MEDIA' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                    'bg-green-50 text-green-700 border-green-100'
                  }`}>
                    {tarea.prioridad}
                  </span>
                )}
                {tarea.estado && (
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-black border border-gray-200">
                    {tarea.estado}
                  </span>
                )}
              </div>
            </div>

            {/* Sección Descripción */}
            {tarea.descripcion && (
              <div className="flex items-start gap-5 pt-2 border-t border-gray-50 mt-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <AlignLeft size={20} className="text-gray-400" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</span>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    {tarea.descripcion}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción - COLORES Y DISPOSICIÓN IGUAL A LA IMAGEN */}
          <div className="mt-12 flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 px-4 bg-gray-50 hover:bg-gray-100 text-gray-900 font-extrabold rounded-2xl transition-all border border-gray-200 text-sm shadow-sm"
            >
              Cerrar
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleTareaModal;