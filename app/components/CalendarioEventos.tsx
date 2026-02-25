"use client";

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import DetalleTareaModal from '../calendario/detalleTareaModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CustomToolbar = (props: ToolbarProps<any, any>) => {
  const { label, onView, onNavigate, view } = props;
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-extrabold text-black ml-2 capitalize">{label}</h2>
        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
          <button onClick={() => onNavigate('PREV')} className="p-1.5 hover:bg-white rounded-lg transition-all text-[#2C2C2C]"><ChevronLeft size={20} /></button>
          <button onClick={() => onNavigate('NEXT')} className="p-1.5 hover:bg-white rounded-lg transition-all text-[#2C2C2C]"><ChevronRight size={20} /></button>
        </div>
        <button onClick={() => onNavigate('TODAY')} className="px-5 py-2 text-sm bg-[#EFEDE7] font-bold text-[#2C2C2C] bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200">Hoy</button>


      </div>
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
        {[
          { id: Views.MONTH, label: 'Mes' },
          { id: Views.WEEK, label: 'Semana' },
          { id: Views.DAY, label: 'Día' },
          { id: Views.AGENDA, label: 'Agenda' }
        ].map((v) => (
          <button key={v.id} onClick={() => onView(v.id as View)} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${view === v.id ? 'bg-white text-[#2C2C2C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{v.label}</button>
        ))}
      </div>
    </div>
  );
};

export default function CalendarioEventos({ eventos }: { eventos: any[] }) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [tareaSeleccionada, setTareaSeleccionada] = useState<any>(null);

  const getEventColor = (event: any) => {
    return event.resource?.color || (event.resource?.type === 'vencimiento' ? '#EFBEAF' : '#90BF77');
  };

  // PROCESAMIENTO CRÍTICO: Esta es la parte que limpia el desfase UTC
  const eventosProcesados = useMemo(() => {
    // 1. Filtramos eventos que no tengan fecha de inicio válida
    return eventos
      .filter(event => event && event.start)
      .map(event => {
        let dateStr = "";
        if (typeof event.start === 'string') {
          dateStr = event.start.split('T')[0];
        } else {
          const d = event.start;
          // Agregamos una comprobación extra por seguridad
          if (!(d instanceof Date)) return null;
          dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        }

        const [year, month, day] = dateStr.split('-').map(Number);
        const localDate = new Date(year, month - 1, day, 12, 0, 0);

        return {
          ...event,
          start: localDate,
          end: localDate,
        };
      })
      .filter(Boolean); // Eliminamos posibles nulos si la fecha era inválida
  }, [eventos]);

  const handleSelectEvent = (event: any) => {
    setTareaSeleccionada({
      id: event.resource?.id,
      type: event.resource?.type, // 'tarea' o 'vencimiento'
      // Campos de Tarea
      tareaId: event.resource?.tareaId,
      taId: event.resource?.taId,
      // Campos de Vencimiento
      vencimientoId: event.resource?.vencimientoId,
      // Común
      fechaOc: event.resource?.fechaOc,
      titulo: event.title,
      descripcion: event.resource?.descripcion,
      prioridad: event.resource?.prioridad,
      estado: event.resource?.estado,
      color: getEventColor(event),
      fecha: format(event.start, "EEEE, d 'de' MMMM", { locale: es }),
      tipoTarea: event.resource?.tipoTarea,
    });
  };

  const components = useMemo(() => ({ toolbar: CustomToolbar }), []);

  return (
    <div className="h-[85vh] relative font-sans">
      <Calendar
        localizer={localizer}
        events={eventosProcesados}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        culture='es'
        components={components}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: getEventColor(event),
            borderRadius: '8px',
            color: 'black',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: '600'
          }
        })}
      />

      {tareaSeleccionada && (
        <DetalleTareaModal
          tarea={tareaSeleccionada}
          onClose={() => setTareaSeleccionada(null)}
        // Si necesitas que el botón "Ver más" funcione, agrégalo aquí
        />
      )}
    </div>
  );
}