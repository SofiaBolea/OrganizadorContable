"use client";

import { useTransition } from "react";
import { updateUsuarioPermission } from "./actions";
import { Loader2 } from "lucide-react";

interface Props {
  usuarioId: string;
  label: string;
  campo: "permisoClientes" | "permisoVencimiento";
  valor: boolean;
}

export function PermissionToggle({ usuarioId, label, campo, valor }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await updateUsuarioPermission(usuarioId, campo, !valor);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
        valor 
          ? "bg-green-500/10 border-green-500/20 text-green-400" 
          : "bg-white/[0.03] border-white/10 text-white/40"
      } hover:bg-white/10 disabled:opacity-50`}
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {label}: {valor ? "ON" : "OFF"}
    </button>
  );
}