import prisma from "@/lib/prisma";
import VencimientoInputs from "@/app/components/VencimientoInputs";

interface PageProps {
  params: { id: string };
}

export default async function EditarVencimientoPage({ params }: PageProps) {
  const vencimiento = await prisma.vencimiento.findUnique({
    where: { id: params.id },
  });

  if (!vencimiento) {
    return <div>Vencimiento no encontrado</div>;
  }

  return (
    <VencimientoInputs
      mode="edit"
      initialData={{
        id: vencimiento.id,
        titulo: vencimiento.titulo,
        tipoVencimiento: vencimiento.tipoVencimiento,
        periodicidad: vencimiento.periodicidad,
        jurisdiccion: vencimiento.jurisdiccion,
      }}
    />
  );
}