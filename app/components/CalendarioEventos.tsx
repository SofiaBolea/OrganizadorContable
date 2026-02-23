"use client";

import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, View, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  AlignLeft, 
  ExternalLink,
  AlertCircle 
} from 'lucide-react'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- Toolbar Personalizado ---
const CustomToolbar = (props: ToolbarProps<any, any>) => {
  const { label, onView, onNavigate, view } = props;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-5 py-2 text-sm font-bold text-black bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
        >
          Hoy
        </button>
        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
          <button onClick={() => onNavigate('PREV')} className="p-1.5 hover:bg-white rounded-lg transition-all text-black">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => onNavigate('NEXT')} className="p-1.5 hover:bg-white rounded-lg transition-all text-black">
            <ChevronRight size={20} />
          </button>
        </div>
        <h2 className="text-xl font-extrabold text-black ml-2 capitalize">{label}</h2>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
        {[
          { id: Views.MONTH, label: 'Mes' },
          { id: Views.WEEK, label: 'Semana' },
          { id: Views.DAY, label: 'Día' },
          { id: Views.AGENDA, label: 'Agenda' }
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => onView(v.id as View)}
            className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
              view === v.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function CalendarioEventos({ eventos }: { eventos: any[] }) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const components = useMemo(() => ({
    toolbar: CustomToolbar,
  }), []);

  return (
    <div className="h-[85vh] relative font-sans">
      <Calendar
        localizer={localizer}
        events={eventos}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        culture='es'
        components={components}
        onSelectEvent={(event) => setSelectedEvent(event)}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.resource?.color || (event.resource?.type === 'vencimiento' ? '#EFBEAF' : '#90BF77'),
            borderRadius: '8px',
            color: 'black',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: '600'
          }
        })}
        messages={{
          next: "Sig.",
          previous: "Ant.",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
        }}
      />

      {/* --- MODAL DE DETALLE --- */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Cabecera con color */}
            <div 
              className="h-3 w-full" 
              style={{ backgroundColor: selectedEvent.resource?.color || (selectedEvent.resource?.type === 'vencimiento' ? '#EFBEAF' : '#90BF77') }}
            />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className={`badge-base text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${
                      selectedEvent.resource.type === 'vencimiento' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedEvent.resource.type}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-black leading-tight">
                    {selectedEvent.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Fecha y Hora */}
                <div className="flex items-start gap-4">
                  <Clock size={20} className="text-gray-400 mt-1" />
                  <div className="flex flex-col">
                    <span className="font-bold text-black text-base">
                      {format(selectedEvent.start, "EEEE, d 'de' MMMM", { locale: es })}
                    </span>
                    <span className="text-gray-500 text-sm font-medium">Todo el día</span>
                  </div>
                </div>

                {/* Prioridad y Estado */}
                <div className="flex items-center gap-4">
                  <AlertCircle size={20} className="text-gray-400" />
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.resource.prioridad && (
                      <span className={`badge-base text-[11px] px-3 py-1 rounded-lg font-bold ${
                        selectedEvent.resource.prioridad === 'ALTA' ? 'bg-red-50 text-red-600 border border-red-100' : 
                        selectedEvent.resource.prioridad === 'MEDIA' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 
                        'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {selectedEvent.resource.prioridad}
                      </span>
                    )}
                    {selectedEvent.resource.estado && (
                      <span className="text-[11px] bg-gray-100 text-gray-700 px-3 py-1 rounded-lg font-bold border border-gray-200">
                        {selectedEvent.resource.estado}
                      </span>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                {selectedEvent.resource.descripcion && (
                  <div className="flex items-start gap-4 pt-2">
                    <AlignLeft size={20} className="text-gray-400 mt-1" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Descripción</span>
                      <p className="text-gray-700 text-sm leading-relaxed font-medium">
                        {selectedEvent.resource.descripcion}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-10 flex gap-3">
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 text-black font-bold rounded-2xl transition-all border border-gray-200 text-sm"
                >
                  Cerrar
                </button>
                <a 
                  href={`/${selectedEvent.resource.type === 'tarea' ? 'tareas-asignadas' : 'vencimientos'}/${selectedEvent.resource.id}`}
                  className="flex-1 py-3.5 px-4 bg-black text-white text-center font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 text-sm flex items-center justify-center gap-2"
                >
                  Ver detalles <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}