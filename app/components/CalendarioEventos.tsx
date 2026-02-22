"use client";

import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format } from 'date-fns/format';
import {parse }from 'date-fns/parse';
import{ startOfWeek} from 'date-fns/startOfWeek';
import {getDay} from 'date-fns/getDay';
import{ es} from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarioProps {
  eventos: Event[];
}

export default function CalendarioEventos({ eventos }: CalendarioProps) {
  return (
    <div style={{ height: '80vh' }}>
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        messages={{
          next: "Sig.",
          previous: "Ant.",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
        }}
        culture='es'
      />
    </div>
  );
}