import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import VencimientoInputs from '../../components/VencimientoInputs'

export default async function VencimientosPage() {
  const { orgRole, orgId } = await auth()

  if (orgRole !== 'org:admin' || !orgId) {
    redirect('/')
  }


  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Vencimientos</h1>
        <VencimientoInputs />
      </div>
    </main>
  )
}