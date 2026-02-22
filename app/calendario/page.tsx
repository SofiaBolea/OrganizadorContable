// app/calendario/page.tsx
import prisma from "@/lib/prisma"; //
import CalendarioEventos from "../components/CalendarioEventos"; //

export default async function PaginaCalendario() {
  // 1. Obtener ocurrencias de tareas con sus relaciones
  const ocurrencias = await prisma.ocurrencia.findMany({
    include: {
      tareaAsignacion: {
        include: { 
          tarea: true 
        }
      }
    }
  });

  // Mapear ocurrencias a formato de eventos del calendario
  const eventosTareas = ocurrencias.map(ocu => {
    // Usar override si existe, de lo contrario usar datos de la tarea base
    const titulo = ocu.tituloOverride || ocu.tareaAsignacion.tarea.titulo;
    const descripcion = ocu.descripcionOverride || ocu.tareaAsignacion.tarea.descripcion;
    const prioridad = ocu.prioridadOverride || ocu.tareaAsignacion.tarea.prioridad;
    // Usar fechaOverride si existe, de lo contrario la fechaOriginal
    const fecha = ocu.fechaOverride || ocu.fechaOriginal;

    return {
      title: titulo,
      start: new Date(fecha),
      end: new Date(fecha),
      allDay: true,
      resource: { 
        type: 'tarea', 
        id: ocu.id, 
        descripcion: descripcion,
        prioridad: prioridad 
      }
    };
  });

  // 2. Obtener ocurrencias de vencimientos con su información base
  const vencimientos = await prisma.vencimientoOcurrencia.findMany({
    include: { 
      vencimiento: true 
    }
  });

  // Mapear vencimientos a formato de eventos
  const eventosVencimientos = vencimientos.map(v => ({
    title: v.vencimiento.titulo,
    start: new Date(v.fechaVencimiento),
    end: new Date(v.fechaVencimiento),
    allDay: true,
    resource: { 
      type: 'vencimiento', 
      id: v.id,
      descripcion: `Jurisdicción: ${v.vencimiento.jurisdiccion || 'No especificada'}. Periodicidad: ${v.vencimiento.periodicidad}`,
      prioridad: 'ALTA' // Los vencimientos contables se consideran prioridad alta por defecto
    }
  }));

  // Combinar ambos tipos de eventos para pasarlos al componente de cliente
  const todosLosEventos = [...eventosTareas, ...eventosVencimientos];

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Agenda Contable</h1>
            <p className="text-gray-500 text-sm mt-1">
              Visualiza y gestiona las tareas y vencimientos de la organización.
            </p>
          </div>
        </header>
        
        {/* Componente de cliente que maneja la interactividad y los estados del calendario */}
        <CalendarioEventos eventos={todosLosEventos} />
      </div>
    </main>
  );
}