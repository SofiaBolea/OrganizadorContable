// sofiabolea/organizadorcontable/OrganizadorContable-recRef/app/recursos-ref/tablaRecursos.tsx

"use client";

import { useEffect, useState } from "react";
import { Plus, Search, ExternalLink, Pencil, Trash2, FolderOpen, UserCheck } from "lucide-react";
import { Button } from "../components/Button";
import FormularioCrearRecurso from "./formularioCrearRecurso";
import FormularioEditarRecurso from "./formularioEditarRecursoRef";
import { ModalConfirmacionEliminarRecurso } from "./modalConfirmacionEliminarRecurso";
import { ModalErrorRecurso } from "./modalErrorRecurso";
import { JSX } from "react/jsx-runtime";

interface Props {
  initialRecursos: any[];
  permisos: {
    puedeCrearGlobal: boolean;
    puedeModificarGlobal: boolean;
    puedeEliminarGlobal: boolean;
    puedeCrearPropio: boolean;
  };
}

export function TablaRecursos({ initialRecursos, permisos }: Props) {
  const [recursos, setRecursos] = useState(initialRecursos);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Estados de Datos
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRecursos = async () => {
    const res = await fetch("/api/recursosRef");
    const data = await res.json();
    setRecursos(data);
  };

  useEffect(() => {
    fetchRecursos();
  } , [permisos]);
  
  const handleConfirmarEliminacion = async () => {
    if (!recursoSeleccionado) return;

    try {
      const res = await fetch("/api/recursosRef", {
        method: "DELETE",
        body: JSON.stringify({ id: recursoSeleccionado.id }),
      });

      if (res.ok) {
        setIsConfirmModalOpen(false);
        fetchRecursos();
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.message || "No se pudo eliminar el recurso.");
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      setErrorMsg("Ocurrió un error de conexión.");
      setIsErrorModalOpen(true);
    }
  };

  const recursosFiltrados = recursos.filter(r =>
    r.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Encabezado y Tabla (Misma lógica visual de antes) */}
      <div className="flex w-full justify-end mb-8">
        
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center">
          <Plus size={18} className="w-4 h-4 mr-2" /> Nuevo Recurso
        </Button>
      </div>

      <div className="table-card">
        {recursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FolderOpen size={48} className="text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">No hay recursos aún</h2>
            <Button onClick={() => setIsModalOpen(true)} className="mt-4">Cargar el primero</Button>
          </div>
        ) : (
          <>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>URL</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recursosFiltrados.map((r: any) => {
                  const esGlobal = r.tipo === "GLOBAL";
                  const puedeEditar = esGlobal ? permisos.puedeModificarGlobal : true;
                  const puedeEliminar = esGlobal ? permisos.puedeEliminarGlobal : true;

                  return (
                    <tr key={r.id} className="table-row">
                      <td className="px-6 py-4 font-medium">{r.titulo}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${esGlobal
                              ? 'bg-[#676AA0] text-white'
                              : 'bg-[#425C5A] text-white'
                            }`}
                        >
                          {r.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={r.url}
                          target="_blank"
                          className="flex items-center gap-1 text-[#2C2C2C] hover:bg-[#C7D0BD] rounded px-10 py-1 transition-colors"
                        >
                          Ver link <ExternalLink size={14} />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {puedeEditar && (
                          <button
                            onClick={() => { setRecursoSeleccionado(r); setIsEditModalOpen(true); }}
                            className="p-1 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        {puedeEliminar && (
                          <button
                            onClick={() => { setRecursoSeleccionado(r); setIsConfirmModalOpen(true); }}
                            className="p-1 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* MODALES DE INTERACCIÓN */}

      {isModalOpen && (
          <FormularioCrearRecurso
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchRecursos}
          />
      )}

      {isEditModalOpen && recursoSeleccionado && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-left">
          <FormularioEditarRecurso
            recurso={recursoSeleccionado}
            onClose={() => { setIsEditModalOpen(false); setRecursoSeleccionado(null); }}
            onSuccess={fetchRecursos}
          />
        </div>
      )}

      {isConfirmModalOpen && recursoSeleccionado && (
        <ModalConfirmacionEliminarRecurso
          tituloRecurso={recursoSeleccionado.titulo}
          onConfirm={handleConfirmarEliminacion}
          onCancel={() => { setIsConfirmModalOpen(false); setRecursoSeleccionado(null); }}
        />
      )}

      {isErrorModalOpen && (
        <ModalErrorRecurso
          mensaje={errorMsg}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
    </>
  );
}

function useffect(arg0: () => JSX.Element) {
      throw new Error("Function not implemented.");
    }
