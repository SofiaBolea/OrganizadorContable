"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ExternalLink, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Button } from "../components/Button";

export default function RecursosPage() {
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        setLoading(false); // Detenemos la carga aunque haya error
      });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recursos de Referencia Propios</h1>
          <p className="text-gray-500">Gestiona tus enlaces y documentos de consulta.</p>
        </div>
        {/* Solo mostramos este botón si ya hay recursos para no duplicar acciones en la vista vacía */}
        {recursos.length > 0 && (
          <Button className="flex items-center gap-2">
            <Plus size={18} /> Nuevo Recurso
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando recursos...</div>
        ) : recursos.length === 0 ? (
          /* ESTADO VACÍO */
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <FolderOpen size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700">No hay recursos de referencia cargados aún</h2>
            <p className="text-gray-500 mb-6">Comienza a organizar tus enlaces importantes ahora mismo.</p>
            <Button className="flex items-center gap-2">
              <Plus size={18} /> Cargar el primero
            </Button>
          </div>
        ) : (
          /* TABLA CON DATOS */
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
                  <th className="px-6 py-3 font-semibold">URL / Link</th>
                  <th className="px-6 py-3 font-semibold">Descripción</th>
                  <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recursos.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.titulo}</td>
                    <td className="px-6 py-4">
                      <a href={r.url} target="_blank" className="text-blue-600 flex items-center gap-1 hover:underline">
                        Ver link <ExternalLink size={14} />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {r.recurso?.descripcion || "Sin descripción"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-1 hover:text-blue-600"><Pencil size={18} /></button>
                      <button className="p-1 hover:text-red-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}