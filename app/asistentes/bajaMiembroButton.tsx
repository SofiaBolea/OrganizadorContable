"use client";

import { useTransition, useState } from "react";
import { darBajaMiembro } from "./actions";
import { UserMinus, Loader2, AlertTriangle } from "lucide-react";

export function BajaMiembroButton({ usuarioId, nombre }: { usuarioId: string; nombre: string }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBaja = () => {
    startTransition(async () => {
      await darBajaMiembro(usuarioId);
      setShowConfirm(false);
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-[10px] text-red-200 font-medium">¿Confirmar baja?</span>
        <button 
          onClick={handleBaja}
          disabled={isPending}
          className="text-[10px] bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sí, dar de baja"}
        </button>
        <button 
          onClick={() => setShowConfirm(false)}
          className="text-[10px] text-white/50 hover:text-white"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
      title={`Dar de baja a ${nombre}`}
    >
      <UserMinus className="w-5 h-5" />
    </button>
  );
}