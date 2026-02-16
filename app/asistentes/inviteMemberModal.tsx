"use client";

import { useState, useTransition } from "react";
import { invitarMiembro } from "./actions";
import { UserPlus, X, Mail, Loader2 } from "lucide-react";
import { Button } from "../components/Button";

export function InviteMemberModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await invitarMiembro(email);
      if (result.success) {
        setIsOpen(false);
        setEmail("");
      } else {
        setError(result.error || "Error desconocido");
      }
    });
  };

  if (!isOpen) {
    return (
      <Button variant="primario" 
      onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <UserPlus className="w-4 h-4" />
        Nuevo Asistente
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
            <UserPlus className="w-6 h-6 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Invitar Miembro</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enviaremos un correo para que se una a la organización.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Invitación"}
          </button>
        </form>
      </div>
    </div>
  );
}