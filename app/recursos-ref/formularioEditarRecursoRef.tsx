"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import { X, Save } from "lucide-react";
import { Button } from "../components/Button";
 //

interface Props {
  recurso: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormularioEditarRecurso({ recurso, onClose, onSuccess }: Props) {
  const { membership } = useOrganization();
  const [loading, setLoading] = useState(false);
  const isAdmin = membership?.role === "org:admin";

  const [formData, setFormData] = useState({
    id: recurso.id,
    titulo: recurso.titulo,
    url: recurso.url,
    descripcion: recurso.recurso?.descripcion || "",
    tipo: recurso.tipo
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamada al método PUT en api/recursosRef/route.ts
      const res = await fetch("/api/recursosRef", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Error al actualizar el recurso");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Editar Recurso</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            required
            type="text"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
          <input
            required
            type="url"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>


        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
            <select
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            >
              <option value="PROPIO">Solo para mí (Propio)</option>
              <option value="GLOBAL">Toda la organización (Global)</option>
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="peligro" className="flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? "Guardando..." : <><Save size={18} /> Guardar Cambios</>}
          </Button>
        </div>
      </form>
    </div>
  );
}