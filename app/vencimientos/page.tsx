import { auth } from '@clerk/nextjs/server'
import { ShieldAlert, Lock } from "lucide-react";
import { getVencimientosParaTabla } from '../../lib/vencimientos'
import { Permisos } from '../../lib/permisos'
import Link from 'next/link'
import { Button } from '../components/Button'
import VencimientosTableClient from '../components/VencimientosTableClient'

export default async function VencimientosPage() {
  const { orgId } = await auth()

    if (!orgId) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Organización Requerida</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Seleccioná un espacio de trabajo para gestionar los vencimientos.
          </p>
        </div>
      </main>
    );
  }

  const [canView, canCreate, canModify, canDelete] = await Promise.all([
    Permisos.puedeVerVencimiento(),
    Permisos.puedeCrearVencimiento(),
    Permisos.puedeModificarVencimiento(),
    Permisos.puedeEliminarVencimiento(),
  ]);

  if (!canView) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center p-6 bg-[#030712]">
        <div className="bg-[#0a0a0a] border border-white/5 p-12 rounded-[3rem] text-center max-w-sm shadow-2xl">  
          <Lock className="w-12 h-12 text-blue-500/40 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            No tienes permisos para ver los vencimientos.
          </p>
        </div>
      </main>
    );
  }

  const ocurrencias = await getVencimientosParaTabla(orgId)

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-text">Vencimientos Impositivos</h1>
        {canCreate && (
          <Button variant="primario">
            <Link href="/vencimientos/nuevoVencimiento">
              Nuevo Vencimiento
            </Link>
          </Button>
        )}
      </div>
      <p className="text-text/50 mb-8">Gestionar vencimientos de impuestos nacionales, provinciales y municipales</p>

      {ocurrencias.length === 0 ? (
        <div className="bg-card rounded-[var(--radius-base)] border border-white shadow-sm p-6">
          <p className="text-text/50">No hay vencimientos cargados.</p>
        </div>
      ) : (
        <VencimientosTableClient 
          ocurrencias={ocurrencias}
          canModify={canModify}
          canDelete={canDelete}
        />
      )}
    </main>
  )
}