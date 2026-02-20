"use client";

import { useState, useEffect } from "react";

interface RefColor {
  id: string;
  titulo: string;
  codigoHexa: string;
}

interface RefColorSelectorProps {
  selectedId: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

export default function RefColorSelector({ selectedId, onChange, disabled }: RefColorSelectorProps) {
  const [colores, setColores] = useState<RefColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCrear, setShowCrear] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoColor, setNuevoColor] = useState("#4A90D9");
  const [creando, setCreando] = useState(false);

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
      console.error("Error cargando colores");
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async () => {
    if (!nuevoTitulo.trim()) return;
    setCreando(true);
    try {
      const res = await fetch("/api/ref-colores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: nuevoTitulo, codigoHexa: nuevoColor }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setColores((prev) => [...prev, data]);
        onChange(data.id);
        setShowCrear(false);
        setNuevoTitulo("");
        setNuevoColor("#4A90D9");
      }
    } catch {
      alert("Error al crear color");
    } finally {
      setCreando(false);
    }
  };

  if (loading) {
    return <div className="text-text/50 text-sm">Cargando colores...</div>;
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-text mb-1">Color de Referencia (Opcional)</label>

      <div className="flex flex-wrap gap-2">
        {/* Sin color */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
            ${selectedId === null
              ? "border-text/40 bg-[#e9e8e0] text-text"
              : "border-transparent bg-[#e9e8e0]/50 text-text/50 hover:border-text/20"
            } ${disabled ? "cursor-default" : "cursor-pointer"}`}
        >
          Sin color
        </button>

        {colores.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all flex items-center gap-1.5
              ${selectedId === c.id
                ? "border-text/40 shadow-sm"
                : "border-transparent hover:border-text/20"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            style={{ backgroundColor: c.codigoHexa + "30", color: c.codigoHexa }}
          >
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: c.codigoHexa }}
            />
            {c.titulo}
          </button>
        ))}

        {!disabled && (
          <button
            type="button"
            onClick={() => setShowCrear(!showCrear)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-dashed border-text/20 text-text/50 hover:text-text hover:border-text/40 transition-all"
          >
            + Nuevo Color
          </button>
        )}
      </div>

      {showCrear && (
        <div className="bg-[#e9e8e0] rounded-xl p-4 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nombre del color"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              className="flex-1 bg-white p-2 px-4 rounded-full outline-none text-sm text-text placeholder:text-text/40"
              maxLength={50}
            />
            <input
              type="color"
              value={nuevoColor}
              onChange={(e) => setNuevoColor(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCrear}
              disabled={creando || !nuevoTitulo.trim()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creando ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setShowCrear(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-text/50 hover:text-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
