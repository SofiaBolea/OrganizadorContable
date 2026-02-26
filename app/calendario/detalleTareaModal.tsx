"use client";

import { Pencil, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Importamos el router para la navegación

interface DetalleTareaModalProps {
  tarea: {
    id: string;
    type: 'tarea' | 'vencimiento'; // Agregamos discriminador
    tareaId?: string;
    taId?: string;
    vencimientoId?: string; // ID base del vencimiento
    fechaOc: string;
    titulo: string;
    descripcion?: string;
    fecha: string;
    prioridad?: string;
    estado?: string;
    tipoTarea?: string;
  };
  onClose: () => void;
}

const DetalleTareaModal = ({ tarea, onClose }: DetalleTareaModalProps) => {
  const router = useRouter(); // Inicializamos el router

  const getPrioridadStyle = (prioridad: string) => {
    if (prioridad?.toLowerCase() === 'baja') return 'bg-[#a3c981] text-white';
    if (prioridad?.toLowerCase() === 'media') return 'bg-yellow-400 text-white';
    return 'bg-red-400 text-white';
  };

  const handleEdit = () => {
    if (tarea.type === 'vencimiento') {
      // Ruta para vencimientos: /vencimientos/[id]/modificar?voId=...&fechaOc=...
      const url = `/vencimientos/${tarea.vencimientoId}/modificar?voId=${tarea.id}&fechaOc=${tarea.fechaOc}`;
      router.push(url);
    } else {
      // Ruta para tareas (existente)
      const basePath = tarea.tipoTarea === 'PROPIA' ? 'tareas-propias' : 'tareas-asignadas';
      const url = `/${basePath}/${tarea.tareaId}/modificar?taId=${tarea.taId}&fechaOc=${tarea.fechaOc}`;
      router.push(url);
    }
  };

  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm font-['Montserrat',sans-serif]">
      <div className="relative bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden p-8 md:p-10 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-2xl font-medium text-gray-500 tracking-tight">Detalle</h2>

          <div className="flex items-center gap-5">
            <span className="text-2xl font-semibold text-[#f5b041]">
              {tarea.estado}
            </span>
            <div className="flex items-center gap-3">
              {/* Botón de Edición */}
              <button
                onClick={handleEdit}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Pencil size={20} />
              </button>
             
            </div>
          </div>
          <button onClick={onClose} className="ml-2 text-gray-300 hover:text-gray-600">
            <X size={28} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-[#f2f2f0] py-3 px-6 rounded-2xl">
            <span className="text-sm text-gray-600 font-medium tracking-wide">
              {tarea.titulo}
            </span>
          </div>

          <div className="bg-[#f2f2f0] p-6 rounded-[25px] min-h-[150px]">
            <h4 className="text-gray-400 font-bold mb-3 text-xs uppercase tracking-widest">Descripción</h4>
            <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-line font-medium">
              {tarea.descripcion}
            </div>
          </div>

          <div className="bg-[#f2f2f0] py-3 px-7 rounded-full flex justify-between items-center">
            <span className="text-gray-500 font-bold text-sm">Tipo </span>
            <span className="text-gray-700 font-bold text-sm uppercase">
              {tarea.tipoTarea || 'Vencimiento'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 bg-[#f2f2f0] py-3 px-7 rounded-full flex justify-between items-center">
              <span className="text-gray-500 font-bold text-sm">Vence</span>
              <span className="text-gray-700 font-bold text-sm">{tarea.fecha}</span>
            </div>

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