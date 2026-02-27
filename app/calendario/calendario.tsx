// app/calendario/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { obtenerEventosCalendario } from "@/lib/calendario";
import CalendarioEventos from "../components/CalendarioEventos";

export default async function PaginaCalendario() {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
        redirect("/sign-in");
    }

    try {
        // Llamada directa a la lógica de negocio (Patrón recomendado en Next.js)
        const eventos = await obtenerEventosCalendario(orgId, userId);

        return (

            <div className="max-w-7xl mx-auto card">
                <CalendarioEventos eventos={eventos} />
            </div>

        );
    } catch (error) {
        return (
            <div className="p-8 text-red-500">
                Error al cargar el calendario: {error instanceof Error ? error.message : "Error desconocido"}
            </div>
        );
    }
}