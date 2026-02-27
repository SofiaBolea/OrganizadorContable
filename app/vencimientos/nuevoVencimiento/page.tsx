import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import VencimientoInputs from '../components/VencimientoInputs'
import { Permisos } from '@/lib/permisos'

export default async function VencimientosPage() {
  const { orgId } = await auth()

  if (!orgId) {
    redirect('/')
  }

  const puedeCrear = await Permisos.puedeCrearVencimiento()
  if (!puedeCrear) {
    redirect('/vencimientos')
  }


  return (
    <main className="p-8">
      <h2 className="text-xl font-semibold text-text mb-6">Cargar Vencimiento Impositivo</h2>
      <VencimientoInputs />
    </main>
  )
}