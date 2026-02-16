"use client";

import { useState, useMemo } from "react";
import { crearClienteAction } from "./actions";

export function FormularioCrearCliente({ asistentes }: { asistentes: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para la lógica del formulario
  const [searchTerm, setSearchTerm] = useState("");
  const [asignarTodos, setAsignarTodos] = useState(false);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  // Filtrar asistentes por búsqueda
  const asistentesFiltrados = useMemo(() => {
    return asistentes.filter(a => 
      a.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [asistentes, searchTerm]);

  // Manejar toggle "Asignar a todos"
  const handleToggleAll = () => {
    if (!asignarTodos) {
      setSeleccionados(asistentes.map(a => a.id));
    } else {
      setSeleccionados([]);
    }
    setAsignarTodos(!asignarTodos);
  };

  // Manejar selección individual
  const handleSelect = (id: string) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(item => item !== id));
      setAsignarTodos(false);
    } else {
      setSeleccionados([...seleccionados, id]);
    }
  };

  // Función de envío corregida
  async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Capturamos el formulario antes del await para evitar el error de 'null'
    const form = e.currentTarget; 
    setLoading(true);

    const formData = new FormData(form);
    const data = {
      nombreCompleto: formData.get("nombre") as string,
      cuit: formData.get("cuit") as string,
      email: formData.get("email") as string,
      telefono: formData.get("telefono") as string,
      asistentesIds: seleccionados,
    };

    const res = await crearClienteAction(data);
    
    if (res.success) {
      setIsOpen(false);
      setSeleccionados([]);
      setAsignarTodos(false);
      
      // Reseteamos usando la referencia guardada
      form.reset(); 
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold">
      + Nuevo Cliente
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#f2f1eb] p-8 rounded-[40px] shadow-xl w-full max-w-2xl border border-white">
        <form onSubmit={handleOnSubmit} className="space-y-6">
          
          {/* Fila 1: Nombre y CUIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="nombre" 
              placeholder="Nombre / Razón Social" 
              required
              className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
            />
            <input 
              name="cuit" 
              placeholder="CUIT" 
              className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
            />
          </div>

          {/* Fila 2: Email y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              name="email" 
              type="email"
              placeholder="Email" 
              className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
            />
            <input 
              name="telefono" 
              placeholder="Teléfono" 
              className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
            />
          </div>

          {/* Sección Asistentes */}
          <div className="bg-[#ecebe4] rounded-[30px] p-6 shadow-inner">
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-bold">Asistentes asignados</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-gray-600 text-sm font-medium">Asignar a todos</span>
                <button 
                  type="button"
                  onClick={handleToggleAll}
                  className={`w-12 h-6 rounded-full transition-colors relative shadow-inner ${asignarTodos ? 'bg-[#f4a28c]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${asignarTodos ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Buscar asistente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent mb-4 text-sm outline-none italic text-gray-500 border-none focus:ring-0"
            />

            <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {asistentesFiltrados.map((asistente) => (
                <div key={asistente.id} className="flex justify-between items-center group">
                  <span className="text-gray-700 font-medium">{asistente.nombreCompleto}</span>
                  <div 
                    onClick={() => handleSelect(asistente.id)}
                    className={`w-6 h-6 rounded border-2 cursor-pointer flex items-center justify-center transition-all shadow-sm
                      ${seleccionados.includes(asistente.id) ? 'bg-[#98c18c] border-[#98c18c]' : 'border-[#98c18c] bg-transparent'}`}
                  >
                    {seleccionados.includes(asistente.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer: Botones */}
          <div className="flex justify-between items-center pt-4">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-[#f4a28c] text-[#8e4a3a] px-12 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-md"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-[#98c18c] text-[#3e5a34] px-12 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            >
              {loading ? "Cargando..." : "Guardar"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}