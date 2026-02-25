// app/asistentes/page.tsx
import { auth } from "@clerk/nextjs/server";
import { TablaAsistentes } from "./tablaAsistentes";
import { Permisos } from "@/lib/permisos";
import { listarAsistentes } from "@/lib/usuario/asistentes";
import { Suspense } from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react"; // Importamos íconos para mejorar la UI
import Link from "next/link";
import { Button } from "../components/Button"; // Reutilizamos tu componente de botón

export default async function AsistentesPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const { orgId, has } = await auth();

  // Vista cuando no hay organización seleccionada
  if (!orgId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-app">
        <div className="bg-white border border-slate-200 p-12 rounded-[30px] shadow-sm text-center max-w-sm animate-in fade-in zoom-in duration-500">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Organización Requerida</h2>
          <p className="text-sm text-slate-500 italic leading-relaxed">Seleccioná un espacio de trabajo para continuar.</p>
        </div>
      </main>
    );
  }

  const canView = await Permisos.puedeVerAsistentes();

  // Vista de Acceso Denegado optimizada
  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-app">
        <div className="bg-white border border-slate-200 p-12 rounded-[30px] shadow-sm text-center max-w-md animate-in fade-in zoom-in duration-500">
          {/* Icono de seguridad con fondo suave */}
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic mb-4">
            Acceso Restringido
          </h2>
          
          <p className="text-slate-500 italic mb-8 leading-relaxed">
            Lo sentimos, tu cuenta no tiene los permisos necesarios para gestionar el staff. 
            Si creés que esto es un error, contactá al administrador del estudio.
          </p>

          <Link href="/">
            <Button variant="peligro" className="flex items-center gap-2 mx-auto">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-app text-text font-medium">
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        <Suspense fallback={<p className="p-10 italic text-center text-text/40">Cargando gestión de staff...</p>}>
            <AsistentesDataWrapper searchParams={searchParams} has={has} />
        </Suspense>
      </main>
    </div>
  );
}

async function AsistentesDataWrapper({ searchParams, has }: any) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.append(key, value as string);
  });

  const canInvite = await Permisos.puedeInvitarAsistentes();
  return <TablaAsistentes canInvite={canInvite} />;
}