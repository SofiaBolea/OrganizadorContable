"use client";
import { useEffect, useState } from "react";

export function InformacionOrganizacion() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchInfo() {
      try {
        const response = await fetch("/api/organizacion", { method: "GET" });
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setInfo(data[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, []);
  if (loading) return <div className="bg-white rounded-2xl shadow-md p-8 max-w-xl mx-auto border border-[#E1E3E6]">Cargando...</div>;
  if (!info) return <div className="bg-white rounded-2xl shadow-md p-8 max-w-xl mx-auto border border-[#E1E3E6]">No hay información disponible.</div>;
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 max-w-xl mx-auto border border-[#E1E3E6]">
      <h2 className="text-2xl font-semibold mb-4 text-[#3F4A5A]">Información de la organización</h2>
      <div className="space-y-4">
        <div className="flex gap-2"><span className="font-medium text-[#3F4A5A]">Nombre:</span> <span className="text-[#3F4A5A]">{info.nombre}</span></div>
        <div className="flex gap-2"><span className="font-medium text-[#3F4A5A]">Email:</span> <span className="text-[#3F4A5A]">{info.emailContacto || "-"}</span></div>
        <div className="flex gap-2"><span className="font-medium text-[#3F4A5A]">Teléfono:</span> <span className="text-[#3F4A5A]">{info.telefonoContacto || "-"}</span></div>
        <div className="flex gap-2"><span className="font-medium text-[#3F4A5A]">Dirección:</span> <span className="text-[#3F4A5A]">{info.direccion || "-"}</span></div>
      </div>
    </div>
  );
}