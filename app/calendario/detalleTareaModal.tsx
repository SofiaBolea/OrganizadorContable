"use client";

import { Pencil, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Importamos el router para la navegación

interface DetalleTareaModalProps {
  tarea: {
    id: string; // Asegúrate de que el objeto tarea incluya el ID
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

  // Función para ir a la página de edición según el tipo de tarea
  const handleEdit = () => {
    const basePath = tarea.tipoTarea === 'PROPIA' ? 'tareas-propias' : 'tareas-asignadas';
    router.push(`/${basePath}/${tarea.id}/modificar`);
  };

  // Función para eliminar la asignación de la tarea
  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;

    try {
      // Llamada al endpoint de eliminación de asignaciones
      const response = await fetch(`/api/tareas/asignaciones/${tarea.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onClose();
        router.refresh(); // Refresca la página para actualizar el calendario
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar: ${errorData.error || 'Intente nuevamente'}`);
      }
    } catch (error) {
      console.error("Error eliminando la tarea:", error);
      alert("Hubo un error en la conexión.");
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
              {/* Botón de Eliminación */}
              <button 
                onClick={handleDelete}
                className="text-[#e67e22] hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
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
            <span className="text-gray-500 font-bold text-sm">Tipo Tarea</span>
            <span className="text-gray-700 font-bold text-sm uppercase">
              {tarea.tipoTarea || 'No especificado'}
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