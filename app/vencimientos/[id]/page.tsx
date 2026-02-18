import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VencimientoInputs from "@/app/components/VencimientoInputs";
import { Permisos } from "@/lib/permisos";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalleVencimientoPage({ params }: PageProps) {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const puedeVer = await Permisos.puedeVerVencimiento();
  if (!puedeVer) {
    redirect("/");
  }

  const { id } = await params;

  const organizacion = await prisma.organizacion.findUnique({
    where: { clerkOrganizationId: orgId },
  });

  if (!organizacion) {
    redirect("/");
  }

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

  if (!vencimiento || vencimiento.recurso.organizacionId !== organizacion.id) {
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

      <h2 className="text-xl font-semibold text-text mb-6">Detalle de Vencimiento</h2>
      <VencimientoInputs
        mode="view"
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
