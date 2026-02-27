"use client";

import { useState, useEffect } from "react";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { ModalError } from "./modalError";

interface RefColor {
  id: string;
  titulo: string;
  codigoHexa: string;
}

type ModalMode = "crear" | "editar" | "ver" | null;

export default function RefColorTable() {
  const [colores, setColores] = useState<RefColor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalColor, setModalColor] = useState<RefColor | null>(null);
  const [formTitulo, setFormTitulo] = useState("");
  const [formCodigoHexa, setFormCodigoHexa] = useState("#4A90D9");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<RefColor | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchColores();
  }, []);

  const fetchColores = async () => {
    try {
      const res = await fetch("/api/ref-colores");
      if (res.ok) {
        const data = await res.json();
        setColores(data);
      }
    } catch {
      setErrorMsg("Error cargando colores");
    } finally {
      setLoading(false);
    }
  };

  // ── Modal handlers ──

  const openCrear = () => {
    setFormTitulo("");
    setFormCodigoHexa("#4A90D9");
    setModalMode("crear");
    setModalColor(null);
  };

  const openEditar = (color: RefColor) => {
    setFormTitulo(color.titulo);
    setFormCodigoHexa(color.codigoHexa);
    setModalMode("editar");
    setModalColor(color);
  };

  const openVer = (color: RefColor) => {
    setFormTitulo(color.titulo);
    setFormCodigoHexa(color.codigoHexa);
    setModalMode("ver");
    setModalColor(color);
  };

  const closeModal = () => {
    setModalMode(null);
    setModalColor(null);
    setFormTitulo("");
    setFormCodigoHexa("#4A90D9");
  };

  const handleGuardar = async () => {
    if (!formTitulo.trim()) return;
    setSaving(true);
    try {
      if (modalMode === "crear") {
        const res = await fetch("/api/ref-colores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo: formTitulo, codigoHexa: formCodigoHexa }),
        });
        if (res.ok) {
          const { data } = await res.json();
          setColores((prev) => [...prev, data]);
          closeModal();
        } else {
          setErrorMsg("Error al crear color");
        }
      } else if (modalMode === "editar" && modalColor) {
        const res = await fetch(`/api/ref-colores/${modalColor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titulo: formTitulo, codigoHexa: formCodigoHexa }),
        });
        if (res.ok) {
          const { data } = await res.json();
          setColores((prev) => prev.map((c) => (c.id === modalColor.id ? data : c)));
          closeModal();
        } else {
          setErrorMsg("Error al actualizar color");
        }
      }
    } catch (error) {
      setErrorMsg("Error al conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (color: RefColor) => {
    setDeleteConfirm(color);
  };

  const handleEliminar = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ref-colores/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setColores((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
        setDeleteConfirm(null);
      } else {
        setErrorMsg("Error al eliminar color");
      }
    } catch (error) {
      setErrorMsg("Error al conectar con el servidor");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="card bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-8 ">
        <p className="text-text/50 text-sm">Cargando colores de referencia...</p>
      </div>
    );
  }

  return (
    <>
      <div className=" card bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-8">
        <h2 className="text-xl font-bold text-text mb-6">Colores de Referencia</h2>

        <div className="table-card">
          <table className="table-base">
            <thead>
              <tr className="border-b-2 border-text/20">
                <th className="px-4 py-3 text-sm font-semibold text-text/70">Titulo de Tarea</th>
                <th className="px-4 py-3 text-sm font-semibold text-text/70 text-center">Color</th>
                <th className="px-4 py-3 text-sm font-semibold text-text/70">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {colores.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-text/40 text-sm">
                    No hay colores de referencia creados.
                  </td>
                </tr>
              )}
              {colores.map((c) => (
                <tr key={c.id} className="border-b border-text/5 hover:bg-black/[0.01] transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-text">{c.titulo}</td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className="inline-block w-8 h-8 rounded-full"
                      style={{ backgroundColor: c.codigoHexa }}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => openVer(c)}
                        className="text-text/40 hover:text-text transition-colors text-sm underline"
                      >
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditar(c)}
                        className="text-text/40 hover:text-text transition-colors"
                        title="Modificar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(c)}
                        className="text-danger-foreground/60 hover:text-danger-foreground transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Agregar nueva Referencia */}
        <div className="border-t border-text/10 mt-2 pt-2">
          <button
            type="button"
            onClick={openCrear}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text hover:bg-black/[0.02] rounded-xl transition-colors"
          >
            <span>Agregar nueva Referencia</span>
            <Plus size={18} className="text-text/60" />
          </button>
        </div>
      </div>

      {/* ── Modal Crear / Editar / Ver ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-2xl border border-white shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-text mb-6">
              {modalMode === "crear"
                ? "Nuevo Color de Referencia"
                : modalMode === "editar"
                  ? "Modificar Color de Referencia"
                  : "Detalle del Color"}
            </h3>

            {/* Nombre / Título */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Nombre / Título"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                disabled={modalMode === "ver"}
                maxLength={50}
                className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-text placeholder:text-text/40 focus:ring-2 focus:ring-primary transition-all disabled:opacity-60"
              />
            </div>

            {/* Código Hexadecimal */}
            <div className="mb-6">
              <div className="flex items-center gap-3 bg-[#e9e8e0] p-3 px-5 rounded-full">
                <span className="text-sm text-text/60">Código Hexadecimal</span>
                <input
                  type="color"
                  value={formCodigoHexa}
                  onChange={(e) => setFormCodigoHexa(e.target.value)}
                  disabled={modalMode === "ver"}
                  className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent disabled:cursor-default"
                />
                <input
                  type="text"
                  value={formCodigoHexa.replace("#", "").toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                    setFormCodigoHexa("#" + val);
                  }}
                  disabled={modalMode === "ver"}
                  maxLength={6}
                  className="w-20 bg-white p-2 px-3 rounded-full outline-none text-sm text-text text-center disabled:opacity-60"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity border-[3px] bg-danger text-danger-foreground border-danger-foreground hover:opacity-90"
              >
                {modalMode === "ver" ? "Cerrar" : "Cancelar"}
              </button>

              {modalMode !== "ver" && (
                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={saving || !formTitulo.trim()}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity border-[3px] bg-primary text-primary-foreground border-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminación ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-2xl border border-white shadow-xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-text mb-2">Eliminar Color</h3>
            <p className="text-sm text-text/60 mb-1">
              ¿Estás seguro de eliminar el color <strong>{deleteConfirm.titulo}</strong>?
            </p>
            <p className="text-xs text-text/40 mb-6">
              Las tareas que lo usen quedarán sin color de referencia.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity border-[3px] bg-danger text-danger-foreground border-danger-foreground hover:opacity-90"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminar}
                disabled={deleting}
                className="px-6 py-2.5 rounded-xl text-sm font-medium transition-opacity border-[3px] bg-primary text-primary-foreground border-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {errorMsg && (
        <ModalError mensaje={errorMsg} onClose={() => setErrorMsg(null)} />
      )}  
    </>
  );
}
