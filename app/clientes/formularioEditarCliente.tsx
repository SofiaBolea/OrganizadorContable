"use client";

import { useState, useMemo } from "react";
// import { modificarClienteAction } from "./actions";
import { ModalError } from "./modalError"; // Importamos el modal de error

interface FormularioEditarProps {
  cliente: any;
  asistentes: any[];
  onClose: () => void;
}

export function FormularioEditarCliente({ cliente, asistentes, onClose }: FormularioEditarProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Estado para controlar el modal de error

  // 1. Pre-cargamos los asistentes ya asignados desde la base de datos
  const idsIniciales = cliente.asignaciones?.map((a: any) => a.usuarioId) || [];
  
  const [seleccionados, setSeleccionados] = useState<string[]>(idsIniciales);
  const [asignarTodos, setAsignarTodos] = useState(idsIniciales.length === asistentes.length && asistentes.length > 0);

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
      setSeleccionados(prev => prev.filter(item => item !== id));
      setAsignarTodos(false);
    } else {
      setSeleccionados(prev => [...prev, id]);
    }
  };

  async function handleOnSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nombreCompleto: formData.get("nombre") as string,
      cuit: formData.get("cuit") as string,
      email: formData.get("email") as string,
      telefono: formData.get("telefono") as string,
      asistentesIds: seleccionados,
    };

    try {
      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await response.json();
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Ocurrió un error al intentar actualizar el cliente.");
      }
    } catch (err) {
      setErrorMsg("Error de red o servidor.");
    }
    setLoading(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4 text-left">
        <div className="bg-[#f2f1eb] p-8 rounded-[40px] shadow-2xl w-full max-w-2xl border border-white">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 italic">Modificar Datos</h2>
            <p className="text-slate-500 text-sm">Editando la ficha de: {cliente.nombreCompleto}</p>
          </div>

          <form onSubmit={handleOnSubmit} className="space-y-6">
            
            {/* Fila 1: Nombre y CUIT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                name="nombre" 
                defaultValue={cliente.nombreCompleto}
                placeholder="Nombre / Razón Social" 
                required
                className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
              />
              <input 
                name="cuit" 
                defaultValue={cliente.cuit || ""}
                placeholder="CUIT" 
                className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
              />
            </div>

            {/* Fila 2: Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                name="email" 
                type="email"
                defaultValue={cliente.email || ""}
                placeholder="Email" 
                className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
              />
              <input 
                name="telefono" 
                defaultValue={cliente.telefono || ""}
                placeholder="Teléfono" 
                className="bg-[#e9e8e0] p-4 rounded-full outline-none placeholder:text-gray-500 text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]"
              />
            </div>

            {/* Sección Asistentes */}
            <div className="bg-[#ecebe4] rounded-[30px] p-6 shadow-inner">
              <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
                <div className="flex items-center gap-2 text-gray-600 font-bold">
                  <span>Reasignar Asistentes</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
                onClick={onClose}
                className="bg-[#f4a28c] text-[#8e4a3a] px-12 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-md"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#98c18c] text-[#3e5a34] px-12 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
              >
                {loading ? "Actualizando..." : "Aplicar Modificaciones"}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Modal de Error Condicional */}
      {errorMsg && (
        <ModalError 
          mensaje={errorMsg} 
          onClose={() => setErrorMsg(null)} 
        />
      )}
    </>
  );
}