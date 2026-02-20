"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function FiltrosAsistentes() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string, key: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set(key, term);
    } else {
      params.delete(key);
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-[#f2f1eb] p-6 rounded-[30px] border border-white shadow-sm">
      {/* Filtro por Nombre */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          defaultValue={searchParams.get("nombre")?.toString()}
          onChange={(e) => handleSearch(e.target.value, "nombre")}
          className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[#98c18c] transition-all"
        />
      </div>

      {/* Filtro por carga de vencimientos activa */}
      <div>
        <select
          defaultValue={searchParams.get("cargaVencimientos")?.toString() || ""}
          onChange={(e) => handleSearch(e.target.value, "cargaVencimientos")}
          className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 focus:ring-2 focus:ring-[#98c18c] appearance-none cursor-pointer"
        >
          <option value="">Todos (carga vencimientos)</option>
          <option value="true">Con carga activa</option>
          <option value="false">Sin carga activa</option>
        </select>
      </div>

      {/* Filtro por carga de clientes activa */}
      <div>
        <select
          defaultValue={searchParams.get("cargaClientes")?.toString() || ""}
          onChange={(e) => handleSearch(e.target.value, "cargaClientes")}
          className="w-full bg-[#e9e8e0] p-3 px-5 rounded-full outline-none text-slate-700 focus:ring-2 focus:ring-[#98c18c] appearance-none cursor-pointer"
        >
          <option value="">Todos (carga clientes)</option>
          <option value="true">Con carga activa</option>
          <option value="false">Sin carga activa</option>
        </select>
      </div>
      
      {isPending && (
        <div className="md:col-span-3 text-xs text-[#98c18c] font-bold animate-pulse ml-4">
          Buscando...
        </div>
      )}
    </div>
  );
}