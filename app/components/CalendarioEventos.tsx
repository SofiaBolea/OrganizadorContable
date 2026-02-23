"use client";

import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { es } from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalendarioProps {
  eventos: any[];
}

export default function CalendarioEventos({ eventos }: CalendarioProps) {
  // Estados para controlar la vista y la fecha actual
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any | null>(null);

  // Manejadores de cambios
  const onView = useCallback((newView: View) => setView(newView), []);
  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);

  const handleSelectEvent = (event: any) => {
    setEventoSeleccionado(event);
  };

  return (
    <div className="h-[80vh] bg-white p-4 rounded-xl shadow-lg border border-gray-200 relative">
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        // Propiedades para que los botones funcionen
        view={view}
        onView={onView}
        date={date}
        onNavigate={onNavigate}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        culture='es'
        messages={{
          next: "Sig.",
          previous: "Ant.",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "No hay actividades programadas",
        }}
        onSelectEvent={handleSelectEvent}
        // Personalización de estilos según el tipo de recurso (Tarea o Vencimiento)
        eventPropGetter={(event) => {
          // Si es vencimiento, rojo. Si es tarea, usa su color asignado o el azul por defecto.
          const backgroundColor = event.resource?.type === 'vencimiento'
            ? '#E87A58'
            : (event.resource?.color || '#DBE6E8');

          return {
            style: {
              backgroundColor,
              borderRadius: '6px',
              color: 'white',
              border: 'none',
              display: 'block'
            }
          };
        }}
      />

      {/* Modal de Detalle de Tarea o Vencimiento */}
      {eventoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${eventoSeleccionado.resource.type === 'vencimiento' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                  {eventoSeleccionado.resource.type}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-1">{eventoSeleccionado.title}</h2>
              </div>
              <button
                onClick={() => setEventoSeleccionado(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 w-24">Fecha:</span>
                <span>{format(eventoSeleccionado.start, "PPP", { locale: es })}</span>
              </div>

              {eventoSeleccionado.resource.prioridad && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 w-24">Prioridad:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${eventoSeleccionado.resource.prioridad === 'ALTA' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {eventoSeleccionado.resource.prioridad}
                  </span>
                </div>
              )}

              {eventoSeleccionado.resource.descripcion && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-semibold text-gray-800 mb-1">Descripción:</p>
                  <p className="leading-relaxed">{eventoSeleccionado.resource.descripcion}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setEventoSeleccionado(null)}
                className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-all"
              >
                Cerrar
              </button>
              <a
                href={`/${eventoSeleccionado.resource.type === 'tarea' ? 'tareas-asignadas' : 'vencimientos'}/${eventoSeleccionado.resource.id}`}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-center rounded-xl transition-all shadow-sm shadow-blue-200"
              >
                Ver más detalles
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}