"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Button } from "@/app/components/Button"; //
import { X, Save } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormularioCrearRecurso({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { membership } = useOrganization();
  const [loading, setLoading] = useState(false);

  // Detección de rol de administrador en Clerk
  const isAdmin = membership?.role === "org:admin";

  const [formData, setFormData] = useState({
    titulo: "",
    url: "",
    descripcion: "",
    tipo: "PROPIO" // Por defecto siempre es PROPIO
  });

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamada al endpoint POST definido en api/recursosRef/route.ts
      const res = await fetch("/api/recursosRef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess(); // Refresca la lista de la página principal
        onClose();   // Cierra el modal
      } else {
        alert("Error al guardar el recurso. Intente nuevamente.");
      }
    } catch (error) {
      console.error("Error en la creación del recurso:", error);
      alert("Hubo un fallo en la conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-left">
      <div className="card shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl">
            Nuevo Recurso de Referencia
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Título</label>
            <input
              required
              type="text"
              className="input-base"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej: Consulta de CUIT"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">URL / Link</label>
            <input
              required
              type="url"
              className="input-base"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Solo administradores pueden elegir si es Global */}
          {isAdmin && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Visibilidad</label>
              <select
                className="input-base"
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
              {loading ? "Guardando..." : <> Guardar Recurso</>}
            </Button>
          </div>
        </form>
      </div>

    </div>

  );
}