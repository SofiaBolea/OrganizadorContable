"use client";

import { useState } from "react";
import { eliminarClienteAction } from "./actions";
import { FormularioEditarCliente } from "./formularioEditarCliente";
import { ModalConfirmacionEliminar } from "./modalConfirmacionEliminar";
import { ModalError } from "./modalError";

export function AccionesCliente({ cliente, asistentes, permisos }: any) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirmarBaja = async () => {
    const res = await eliminarClienteAction(cliente.id);
    if (res.success) {
      setIsDeleteOpen(false);
    } else {
      setErrorMsg(res.error || "No se pudo eliminar el cliente.");
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      {permisos.puedeEditar && (
        <button onClick={() => setIsEditOpen(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
      )}

      {permisos.puedeEliminar && (
        <button onClick={() => setIsDeleteOpen(true)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      )}

      {isEditOpen && <FormularioEditarCliente cliente={cliente} asistentes={asistentes} onClose={() => setIsEditOpen(false)} />}
      
      {isDeleteOpen && <ModalConfirmacionEliminar nombreCliente={cliente.nombreCompleto} onConfirm={handleConfirmarBaja} onCancel={() => setIsDeleteOpen(false)} />}
      
      {errorMsg && <ModalError mensaje={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}