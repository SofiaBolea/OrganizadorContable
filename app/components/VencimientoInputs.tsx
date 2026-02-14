"use client";

import { useState } from "react";

export default function VencimientoInputs() {
  const [titulo, setTitulo] = useState("");
  const [tipoVencimiento, setTipoVencimiento] = useState("IMPOSITIVO");
  const [periodicidad, setPeriodicidad] = useState("MENSUAL");
  const [jurisdiccion, setJurisdiccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      // Limpiar formulario
      setTitulo("");
      setTipoVencimiento("IMPOSITIVO");
      setPeriodicidad("MENSUAL");
      setJurisdiccion("");

      // Recargar página
      location.reload();
    } catch (err) {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={createVencimiento} className="space-y-4 mb-8 p-4 border border-zinc-300 rounded-lg bg-zinc-50">
      <h2 className="text-xl font-semibold mb-4">Nuevo Vencimiento</h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Título *</label>
        <input
          type="text"
          placeholder="Ej: IVA, Cargas Sociales, etc."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full p-2 border border-zinc-300 rounded"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Vencimiento *</label>
          <select
            value={tipoVencimiento}
            onChange={(e) => setTipoVencimiento(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded"
          >
            <option value="IMPOSITIVO">Impositivo</option>
            <option value="LABORAL">Laboral</option>
            <option value="ADUANAL">Aduanal</option>
            <option value="PREVISIONAL">Previsional</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Periodicidad *</label>
          <select
            value={periodicidad}
            onChange={(e) => setPeriodicidad(e.target.value)}
            className="w-full p-2 border border-zinc-300 rounded"
          >
            <option value="DIARIA">Diaria</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSUAL">Mensual</option>
            <option value="TRIMESTRAL">Trimestral</option>
            <option value="ANUAL">Anual</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Jurisdicción</label>
        <select
          value={jurisdiccion}
          onChange={(e) => setJurisdiccion(e.target.value)}
          className="w-full p-2 border border-zinc-300 rounded"
        >
          <option value="">Seleccionar...</option>
          <option value="NACIONAL">Nacional</option>
          <option value="PROVINCIAL">Provincial</option>
          <option value="MUNICIPAL">Municipal</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 border border-zinc-300 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Creando..." : "Crear Vencimiento"}
      </button>
    </form>
  );
}
