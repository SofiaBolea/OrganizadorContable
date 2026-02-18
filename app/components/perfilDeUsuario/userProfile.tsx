"use client";
import { useState, useEffect } from "react";
import { Button } from "../Button";

export function Perfil() {
    const [dni, setDni] = useState("");
    const [telefono, setTelefono] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);

    {/* Modal de error */ }
    {
        showErrorModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full border border-[#E1E3E6]">
                    <h3 className="text-lg font-semibold text-[#3F4A5A] mb-2">Error</h3>
                    <p className="text-red-600 mb-4">{errorMsg}</p>
                    <Button variant="peligro" onClick={() => setShowErrorModal(false)}>
                        Cerrar
                    </Button>
                </div>
            </div>
        )
    }


    useEffect(() => {
        async function fetchInfo() {
            try {
                const response = await fetch("/api/usuario", { method: "GET" });
                const data = await response.json();
                if (data && data.usuario) {
                    setDni(data.usuario.dni || "");
                    setTelefono(data.usuario.telefono || "");
                }
            } catch (error) {
                setErrorMsg("Error al cargar la información del usuario.");
                setShowErrorModal(true);
            }
        }
        fetchInfo();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");
        try {
            const response = await fetch("/api/usuario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dni, telefono }),
            });
            const res = await response.json();
            if (res.success) {
                setSuccessMsg("Información guardada correctamente.");
            } else {
                setErrorMsg(res.error || "No se pudo guardar.");
            }
        } catch {
            setErrorMsg("Error de red o servidor.");
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-xl mx-auto border border-[#E1E3E6]">
            <h2 className="text-2xl font-semibold mb-4 text-[#3F4A5A]">Información Extra</h2>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>


                <label className="flex flex-col font-medium text-[#3F4A5A]">
                    DNI
                    <input
                        type="text"
                        placeholder="12345678"
                        className="rounded-full px-3 py-2 bg-[#F8F8F6] border border-[#E1E3E6] focus:ring-2 focus:ring-[#6C8A51] outline-none"
                        value={dni}
                        onChange={e => setDni(e.target.value)}
                    />
                </label>

                <label className="flex flex-col font-medium text-[#3F4A5A]">
                    Teléfono
                    <input
                        type="text"
                        placeholder="+54 9 1234-5678"
                        className="rounded-full px-3 py-2 bg-[#F8F8F6] border border-[#E1E3E6] focus:ring-2 focus:ring-[#6C8A51] outline-none"
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                    />
                </label>

                <Button variant="primario" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar"}
                </Button>
            </form>
            {successMsg && <div className="text-green-600 mt-2">{successMsg}</div>}
            {errorMsg && <div className="text-red-600 mt-2">{errorMsg}</div>}
        </div>
    )
}
