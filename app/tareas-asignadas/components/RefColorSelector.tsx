"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Eye, Edit, Trash2, Plus } from "lucide-react";
import { ModalError } from "./modalError";

interface RefColor {
  id: string;
  titulo: string;
  codigoHexa: string;
}

interface RefColorSelectorProps {
  selectedId: string | null;
  selectedHexa?: string | null;
  refColorTitulo?: string | null;
  onChange: (id: string | null, hexa: string | null) => void;
  disabled?: boolean;
}

type ModalMode = "crear" | "editar" | "ver" | null;

export default function RefColorSelector({ selectedId, selectedHexa, refColorTitulo, onChange, disabled }: RefColorSelectorProps) {
  const [colores, setColores] = useState<RefColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalColor, setModalColor] = useState<RefColor | null>(null);
  const [formTitulo, setFormTitulo] = useState("");
  const [formCodigoHexa, setFormCodigoHexa] = useState("#4A90D9");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<RefColor | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchColores();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchColores = async () => {
    try {
      const res = await fetch("/api/ref-colores");
      if (res.ok) {
        const data = await res.json();
        setColores(data);
      }
    } catch (error) {
      setErrorMsg("Error al cargar los colores");
    } finally {
      setLoading(false);
    }
  };

  const selectedColor = colores.find((c) => c.id === selectedId);

  // Si no encontramos el color en la lista, usarefColorHexa como fallback
  const fallbackColor = selectedId && selectedHexa ? { id: selectedId, titulo: refColorTitulo || "", codigoHexa: selectedHexa } : null;

  // ── Modal handlers ──

  const openCrear = () => {
    setIsOpen(false);
    setFormTitulo("");
    setFormCodigoHexa("#4A90D9");
    setModalMode("crear");
    setModalColor(null);
  };

  const openEditar = (color: RefColor) => {
    setIsOpen(false);
    setFormTitulo(color.titulo);
    setFormCodigoHexa(color.codigoHexa);
    setModalMode("editar");
    setModalColor(color);
  };

  const openVer = (color: RefColor) => {
    setIsOpen(false);
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
          onChange(data.id, data.codigoHexa);
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

          // Si el color editado es el seleccionado, actualizar selección para reflejar cambios
          if (selectedId === modalColor.id) {
            onChange(data.id, data.codigoHexa);
          }

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
    setIsOpen(false);
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
        if (selectedId === deleteConfirm.id) onChange(null, null);
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
    return <div className="text-text/50 text-sm">Cargando colores...</div>;
  }

  return (
    <>
      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-text transition-all ${disabled ? "cursor-default opacity-60" : "cursor-pointer hover:ring-2 hover:ring-primary"
            }`}
        >
          <div className="flex items-center gap-2">
            {selectedColor || fallbackColor ? (
              <>
                <span
                  className="w-4 h-4 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: (selectedColor || fallbackColor)!.codigoHexa }}
                />
                {(selectedColor || fallbackColor) && (selectedColor || fallbackColor)!.titulo && <span className="text-sm font-medium">{(selectedColor || fallbackColor)!.titulo}</span>}
              </>
            ) : (
              <span className="text-sm text-text/40">Color de Referencia (Opcional)</span>
            )}
          </div>
          <ChevronDown size={18} className={`text-text/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown list */}
        {isOpen && !disabled && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-card rounded-2xl border border-white shadow-lg overflow-hidden">
            {/* Sin color option */}
            {selectedId !== null && (
              <button
                type="button"
                onClick={() => { onChange(null, null); setIsOpen(false); }}
                className="w-full text-left px-5 py-3 text-sm text-text/50 hover:bg-black/[0.02] transition-colors border-b border-text/5"
              >
                Sin color
              </button>
            )}

            {/* Color items */}
            {colores.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center justify-between px-5 py-3 hover:bg-black/[0.02] transition-colors ${i < colores.length - 1 ? "border-b border-text/5" : ""
                  }`}
              >
                {/* Clickable area for selection */}
                <button
                  type="button"
                  onClick={() => { onChange(c.id, c.codigoHexa); setIsOpen(false); }}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-sm font-semibold text-text">{c.titulo}</span>
                </button>

                {/* Color circle */}
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 h-8 rounded-full inline-block flex-shrink-0 ${selectedId === c.id ? "ring-2 ring-offset-2 ring-current" : ""
                      }`}
                    style={{ backgroundColor: c.codigoHexa, color: c.codigoHexa }}
                  />

                  {/* Actions */}
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
              </div>
            ))}

            {/* Agregar nueva referencia */}
            <div className="border-t border-text/10">
              <button
                type="button"
                onClick={openCrear}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-text hover:bg-black/[0.02] transition-colors"
              >
                <span>Agregar nueva Referencia</span>
                <Plus size={18} className="text-text/60" />
              </button>
            </div>
          </div>
        )}
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
        <ModalError
          mensaje={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}
    </>
  );
}
