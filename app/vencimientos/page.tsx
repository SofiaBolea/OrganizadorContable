import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function VencimientosPage() {
  const { orgRole } = await auth()

  if (orgRole !== 'org:admin') {
    redirect('/')
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Vencimientos</h1>
      <p className="text-foreground/60">Próximamente: gestión de vencimientos impositivos y contables.</p>
    </main>
  )
}
