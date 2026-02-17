"use client";
import { useEffect, useState } from "react";
import { AccionesCliente } from "./accionesClientes";

interface Cliente {
    id: string;
    nombreCompleto: string;
    email?: string;
    telefono?: string;
    cuit?: string;
    asignaciones: { usuarioId: string }[];
}

interface Asistente {
    id: string;
    nombreCompleto: string;
}

interface Permisos {
    puedeEditar: boolean;
    puedeEliminar: boolean;
}

interface Props {
    permisos: Permisos;
    asistentes: Asistente[];
}

export default function ClientesTableCliente({ permisos, asistentes, usuarioActual }: Props & { usuarioActual: any }) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/clientes?organizacionId=${usuarioActual.organizacionId}`)
            .then((res) => res.json())
            .then((data) => {
                setClientes(data);
                setLoading(false);
            });
    }, [usuarioActual.organizacionId]);

    const { puedeEditar, puedeEliminar } = permisos;

    if (loading) return <div>Cargando clientes...</div>;

    return (
        <table className="w-full text-left border-collapse">
            <thead className="border-b border-slate-200">
                <tr className="text-sm font-bold text-slate-600">
                    <th className="p-6">Nombre / Razon Social</th>
                    <th className="p-6">Email</th>
                    <th className="p-6">Teléfono</th>
                    <th className="p-6">CUIT</th>
                    {(puedeEditar || puedeEliminar) && <th className="p-6 text-center">Acciones</th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {clientes.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="p-20 text-center text-slate-400">
                            No se encontraron clientes.
                        </td>
                    </tr>
                ) : (
                    clientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-slate-50 transition-colors">
                            {/* Nombre / Razon Social */}
                            <td className="p-6 text-slate-700 font-medium">{cliente.nombreCompleto}</td>

                            {/* Email */}
                            <td className="p-6 text-slate-600">{cliente.email || "---"}</td>

                            {/* Teléfono */}
                            <td className="p-6 text-slate-600">{cliente.telefono || "---"}</td>

                            {/* CUIT */}
                            <td className="p-6 text-slate-600 font-mono">{cliente.cuit || "---"}</td>

                            {/* Acciones */}
                            {(puedeEditar || puedeEliminar) && (
                                <td className="p-6">
                                    <div className="flex justify-center">
                                        <AccionesCliente
                                            cliente={cliente}
                                            asistentes={asistentes}
                                            permisos={{ puedeEditar, puedeEliminar }}
                                        />
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}