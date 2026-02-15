
import prisma from "@/lib/prisma";

export default async function Home() {
  const usuarios = await prisma.usuario.findMany();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Bienvenido al organizador contable</h1>
      {JSON.stringify(usuarios)}

    </main>
  )
}