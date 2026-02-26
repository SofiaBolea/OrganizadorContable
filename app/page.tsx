import { auth } from "@clerk/nextjs/server";
import DashboardContainer from "./components/dashboard/DashboardContainer";
import { ShieldAlert } from "lucide-react";
import PaginaCalendario from "./calendario/page";
import BotonScroll from "./components/botonScroll";


export default async function Home() {
  const { orgId, userId } = await auth();



  if (!orgId || !userId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">
            Organización Requerida
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Seleccioná un espacio de trabajo para ver tu dashboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div>
      <div className="pb-8">
        <BotonScroll targetId="calendario-section" label="Ir al Calendario" />
      </div>
      <section>
        <DashboardContainer orgId={orgId} userId={userId} />
      </section>

      <section id="calendario-section" className="mt-16">
        <p className=" text-xl mb-4">Calendario</p>
        <PaginaCalendario />
      </section>
    </div>
  )
}