import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VencimientoInputs from "@/app/components/VencimientoInputs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarVencimientoPage({ params }: PageProps) {
  const { orgRole, orgId } = await auth();

  if (orgRole !== "org:admin" || !orgId) {
    redirect("/");
  }

  const { id } = await params;

  // Buscar vencimiento con sus ocurrencias
  const vencimiento = await prisma.vencimiento.findUnique({
    where: { id },
    include: {
      ocurrencias: {
        orderBy: { fechaVencimiento: "asc" },
      },
      recurso: {
        select: { organizacionId: true },
      },
    },
  });

  if (!vencimiento) {
    return (
      <main className="p-8">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-2">Vencimiento no encontrado</h2>
          <p>El vencimiento que buscas no existe o fue eliminado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-text mb-2">Vencimientos Impositivos</h1>
      <p className="text-text/50 mb-8">Gestionar vencimientos de impuestos nacionales, provinciales y municipales</p>

      <h2 className="text-xl font-semibold text-text mb-6">Modificar Vencimiento</h2>
      <VencimientoInputs
        mode="edit"
        initialData={{
          id: vencimiento.id,
          titulo: vencimiento.titulo,
          tipoVencimiento: vencimiento.tipoVencimiento,
          periodicidad: vencimiento.periodicidad,
          jurisdiccion: vencimiento.jurisdiccion,
        }}
        ocurrencias={vencimiento.ocurrencias.map((o) => ({
          id: o.id,
          fecha: o.fechaVencimiento.toISOString().split("T")[0],
        }))}
      />
    </main>
  );
}
