"use client";

import { useState, memo } from "react";
import { useRouter } from "next/navigation"; // Para refrescar la página
import { FormularioEditarCliente } from "./formularioEditarCliente";
import { ModalConfirmacionEliminar } from "./modalConfirmacionEliminar";
import { ModalError } from "./modalError";

interface AccionesClienteProps {
  cliente: any;
  asistentes: any[];
  permisos: {
    puedeEditar: boolean;
    puedeEliminar: boolean;
  };
}

function AccionesClienteComponent({ cliente, asistentes, permisos }: AccionesClienteProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const router = useRouter();

  const handleConfirmarBaja = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      const res = await response.json();

      if (res.success) {
        setIsDeleteOpen(false);
        // router.refresh() notifica a Next.js que debe volver a ejecutar 
        // los Server Components de la ruta actual para reflejar el cambio
        router.refresh(); 
      } else {
        setErrorMsg(res.error || "No se pudo eliminar el cliente.");
        setIsDeleteOpen(false);
      }
    } catch (error) {
      setErrorMsg("Error de red. Intenta nuevamente.");
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      {permisos.puedeEditar && (
        <button 
          onClick={() => setIsEditOpen(true)} 
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          title="Editar cliente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

      {permisos.puedeEliminar && (
        <button 
          onClick={() => setIsDeleteOpen(true)} 
          disabled={isDeleting}
          className={`p-2 rounded-full transition-colors ${isDeleting ? 'text-gray-400' : 'text-red-600 hover:bg-red-50'}`}
          title="Eliminar cliente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      {isEditOpen && (
        <FormularioEditarCliente 
          cliente={cliente} 
          asistentes={asistentes} 
          onClose={() => setIsEditOpen(false)} 
        />
      )}
      
      {isDeleteOpen && (
        <ModalConfirmacionEliminar 
          nombreCliente={cliente.nombreCompleto} 
          onConfirm={handleConfirmarBaja} 
          onCancel={() => !isDeleting && setIsDeleteOpen(false)} 
        />
      )}
      
      {errorMsg && (
        <ModalError mensaje={errorMsg} onClose={() => setErrorMsg(null)} />
      )}
    </div>
  );
}

export const AccionesCliente = memo(AccionesClienteComponent);