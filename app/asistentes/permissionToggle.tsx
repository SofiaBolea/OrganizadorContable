"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  usuarioId: string;
  label?: string; // Ahora es opcional para evitar el error
  campo: "permisoClientes" | "permisoVencimiento";
  valor: boolean;
}

export function PermissionToggle({ usuarioId, label, campo, valor }: Props) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(valor);

  const handleToggle = () => {
    startTransition(async () => {
      const response = await fetch("/api/asistentes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, campo, valor: !checked }),
      });
      const result = await response.json();
      if (result.success) {
        setChecked(!checked);
      } else {
        alert("Error al guardar: " + result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-black/10"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out ${
            checked ? "translate-x-5.5" : "translate-x-1"
          } flex items-center justify-center`}
        >
          {isPending && <Loader2 className="w-2 h-2 animate-spin text-primary" />}
        </span>
      </button>
      {label && <span className="text-sm font-bold text-text/70">{label}</span>}
    </div>
  );
}