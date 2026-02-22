// app/calendario/page.tsx
import prisma from "@/lib/prisma"; // Ajusta según tu configuración
import CalendarioEventos from "../components/CalendarioEventos";

export default async function PaginaCalendario() {
  // Obtener ocurrencias de tareas
  const ocurrencias = await prisma.ocurrencia.findMany({
    include: {
      tareaAsignacion: {
        include: { tarea: true }
      }
    }
  });

  // Mapear a formato de eventos
  const eventosTareas = ocurrencias.map(ocu => ({
    title: ocu.tituloOverride || ocu.tareaAsignacion.tarea.titulo,
    start: new Date(ocu.fechaOriginal),
    end: new Date(ocu.fechaOriginal),
    allDay: true,
    resource: { type: 'tarea', id: ocu.id }
  }));

  // Obtener ocurrencias de vencimientos
  const vencimientos = await prisma.vencimientoOcurrencia.findMany({
    include: { vencimiento: true }
  });

  const eventosVencimientos = vencimientos.map(v => ({
    title: v.vencimiento.titulo,
    start: new Date(v.fechaVencimiento),
    end: new Date(v.fechaVencimiento),
    allDay: true,
    resource: { type: 'vencimiento', id: v.id }
  }));

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Control Contable</h1>
      <CalendarioEventos eventos={[...eventosTareas, ...eventosVencimientos]} />
    </main>
  );
}