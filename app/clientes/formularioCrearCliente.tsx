"use client";

import { useState, useMemo } from "react";
// import { crearClienteAction } from "./actions";
import { ModalError } from "./modalError";

export function FormularioCrearCliente({ asistentes, onClienteCreado }: { asistentes: any[], onClienteCreado?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [asignarTodos, setAsignarTodos] = useState(false);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const asistentesFiltrados = useMemo(() => {
    return asistentes.filter(a => 
      a.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [asistentes, searchTerm]);

  const handleToggleAll = () => {
    if (!asignarTodos) {
      setSeleccionados(asistentes.map(a => a.id));
    } else {
      setSeleccionados([]);
    }
    setAsignarTodos(!asignarTodos);
  };

  const handleSelect = (id: string) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(prev => prev.filter(item => item !== id));
      setAsignarTodos(false);
    } else {
      setSeleccionados(prev => [...prev, id]);
    }
  };

  const router = require('next/navigation').useRouter();
  async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await response.json();
      if (res.success) {
        router.refresh();
        setIsOpen(false);
        setSeleccionados([]);
        setAsignarTodos(false);
        form.reset();
        if (onClienteCreado) onClienteCreado();
      } else {
        setErrorMsg(res.error || "No se pudo crear el cliente.");
      }
    } catch (err) {
      setErrorMsg("Error de red o servidor.");
    }
    setLoading(false);
  }

  if (!isOpen) return (
    <button onClick={() => setIsOpen(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all">
      + Nuevo Cliente
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-left">
        <div className="bg-[#f2f1eb] p-8 rounded-[40px] shadow-xl w-full max-w-2xl border border-white">
          <form onSubmit={handleOnSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="nombre" placeholder="Nombre / Razón Social" required className="bg-[#e9e8e0] p-4 rounded-full outline-none text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]" />
              <input name="cuit" placeholder="CUIT" className="bg-[#e9e8e0] p-4 rounded-full outline-none text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="email" type="email" placeholder="Email" className="bg-[#e9e8e0] p-4 rounded-full outline-none text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]" />
              <input name="telefono" placeholder="Teléfono" className="bg-[#e9e8e0] p-4 rounded-full outline-none text-gray-700 border-none focus:ring-2 focus:ring-[#98c18c]" />
            </div>

            <div className="bg-[#ecebe4] rounded-[30px] p-6 shadow-inner">
              <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
                <span className="font-bold text-gray-600">Asistentes asignados</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm font-medium">Asignar a todos</span>
                  <button type="button" onClick={handleToggleAll} className={`w-12 h-6 rounded-full relative transition-colors ${asignarTodos ? 'bg-[#f4a28c]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform ${asignarTodos ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <input type="text" placeholder="Buscar asistente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent mb-4 text-sm outline-none italic text-gray-500" />
              <div className="space-y-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {asistentesFiltrados.map((asistente) => (
                  <div key={asistente.id} className="flex justify-between items-center">
                    <span className="text-gray-700">{asistente.nombreCompleto}</span>
                    <div onClick={() => handleSelect(asistente.id)} className={`w-6 h-6 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${seleccionados.includes(asistente.id) ? 'bg-[#98c18c] border-[#98c18c]' : 'border-[#98c18c] bg-transparent'}`}>
                      {seleccionados.includes(asistente.id) && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-4 pt-4">
              <button type="button" onClick={() => setIsOpen(false)} className="flex-1 bg-[#f4a28c] text-[#8e4a3a] py-3 rounded-2xl font-bold shadow-md">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 bg-[#98c18c] text-[#3e5a34] py-3 rounded-2xl font-bold shadow-md disabled:opacity-50">
                {loading ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {errorMsg && <ModalError mensaje={errorMsg} onClose={() => setErrorMsg(null)} />}
    </>
  );
}