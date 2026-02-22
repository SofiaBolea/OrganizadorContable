"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ExternalLink, Pencil, Trash2, FolderOpen } from "lucide-react";
import FormularioCrearRecurso from "./formularioCrearRecurso"; //
import FormularioEditarRecurso from "./formularioEditarRecursoRef";
import { Button } from "../components/Button";

export default function RecursosPage() {
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [recursoParaEditar, setRecursoParaEditar] = useState(null);

  const fetchRecursos = () => {
    setLoading(true);
    fetch("/api/recursosRef")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar");
        return res.json();
      })
      .then((data) => {
        setRecursos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecursos();
  }, []);

  // Función para abrir modal de edición
  const handleEdit = (recurso: any) => {
    setRecursoParaEditar(recurso);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recursos de Referencia</h1>
          <p className="text-gray-500">Gestiona tus enlaces y documentos de consulta.</p>
        </div>
        {recursos.length > 0 && (
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} /> Nuevo Recurso
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando recursos...</div>
        ) : recursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <FolderOpen size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700">No hay recursos de referencia cargados aún</h2>
            <p className="text-gray-500 mb-6">Comienza a organizar tus enlaces importantes ahora mismo.</p>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus size={18} /> Cargar el primero
            </Button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por título..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-semibold">Título</th>
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">URL / Link</th>
                  <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recursos.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.titulo}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.tipo === 'GLOBAL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={r.url} target="_blank" className="text-blue-600 flex items-center gap-1 hover:underline">
                        Ver link <ExternalLink size={14} />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* ACCIÓN EDITAR: Llama a handleEdit */}
                      <button 
                        onClick={() => handleEdit(r)}
                        className="p-1 hover:text-blue-600 transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button className="p-1 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* MODAL CREAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <FormularioCrearRecurso 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={fetchRecursos} 
          />
        </div>
      )}

      {/* MODAL EDITAR */}
      {isEditModalOpen && recursoParaEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <FormularioEditarRecurso 
            recurso={recursoParaEditar}
            onClose={() => setIsEditModalOpen(false)} 
            onSuccess={fetchRecursos} 
          />
        </div>
      )}
    </div>
  );
}