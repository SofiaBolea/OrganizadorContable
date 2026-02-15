"use client";

import { useState } from "react";
import VencimientoFechasForm from "./VencimientoFechasForm";

export default function VencimientoInputs() {
  const [titulo, setTitulo] = useState("");
  const [tipoVencimiento, setTipoVencimiento] = useState("Nacional");
  const [periodicidad, setPeriodicidad] = useState("Mensual");
  const [jurisdiccion, setJurisdiccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vencimientoCreado, setVencimientoCreado] = useState<any>(null);

  async function createVencimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo) {
      setError("El título es requerido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/vencimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          tipoVencimiento,
          periodicidad,
          jurisdiccion: jurisdiccion || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Error al crear vencimiento");
        return;
      }

      const data = await response.json();
      
      // Guardar el vencimiento creado para mostrar el formulario de fechas
      setVencimientoCreado(data.data);

      // Limpiar formulario
      setTitulo("");
      setTipoVencimiento("Nacional");
      setPeriodicidad("Mensual");
      setJurisdiccion("");
      setError("");
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {vencimientoCreado ? (
        <VencimientoFechasForm 
          vencimiento={vencimientoCreado}
          onComplete={() => {
            setVencimientoCreado(null);
            location.reload();
          }}
        />
      ) : (
        <form onSubmit={createVencimiento} className="space-y-4 mb-8 p-4 border border-zinc-300 rounded-lg bg-white">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Nuevo Vencimiento</h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-900">Título *</label>
        <input
          type="text"
          placeholder="Ej: IVA, Cargas Sociales, etc."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full p-2 border border-zinc-300 rounded text-gray-900"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-900">Tipo de Vencimiento *</label>
          <select
            value={tipoVencimiento}
            onChange={(e) => setTipoVencimiento(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded text-gray-900"
          >
            <option value="Nacional">Nacional</option>
            <option value="Provincial">Provincial</option>
            <option value="Municipal">Municipal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-900">Periodicidad *</label>
          <select
            value={periodicidad}
            onChange={(e) => setPeriodicidad(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded text-gray-900"
          >
            <option value="Mensual">Mensual</option>
            <option value="Quincenal">Quincenal</option>
            <option value="Decenal">Decenal</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1 text-gray-900">Jurisdicción</label>
        <input
          type="text"
          placeholder="Ej: AFIP, DGI, Municipalidad, etc."
          value={jurisdiccion}
          onChange={(e) => setJurisdiccion(e.target.value)}
          className="w-full p-2 border border-zinc-300 rounded text-gray-900"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 border border-zinc-300 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Procesando..." : "Siguiente - Agregar Fechas"}
      </button>
        </form>
      )}
    </>
  );
}
