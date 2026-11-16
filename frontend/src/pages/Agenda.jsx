import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { http, parseDay, dayKey } from "@/lib/api";
import EventCard from "@/components/EventCard";

const monthLabel = (s) => parseDay(s).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

export default function Agenda() {
  const [events, setEvents] = useState(null);
  const [day, setDay] = useState(null);

  useEffect(() => {
    http.get("/posts", { params: { type: "evento", upcoming: true, limit: 200 } })
      .then((r) => setEvents(r.data)).catch(() => setEvents([]));
  }, []);

  const eventDays = useMemo(() => (events || []).filter((e) => e.event_date).map((e) => parseDay(e.event_date)), [events]);
  const shown = (events || []).filter((e) => !day || e.event_date === dayKey(day));
  const groups = shown.reduce((acc, e) => {
    const k = e.event_date ? monthLabel(e.event_date) : "Sem data";
    (acc[k] ||= []).push(e);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12" data-testid="agenda-page">
      <span className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#FF7A00] text-white">Paty Investiga</span>
      <h1 className="mt-3 font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight">Agenda de <span className="text-[#FF2A7A]">Eventos</span></h1>
      <p className="mt-3 text-base md:text-lg text-[#0B132B]/70 max-w-xl">Shows, festas, esportes e cultura: o que vai rolar em Angra dos Reis.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28 rounded-3xl bg-white border-2 border-[#0B132B] shadow-[6px_6px_0_#FFB800] p-3 flex flex-col items-center">
            <Calendar mode="single" locale={ptBR} selected={day} onSelect={setDay} data-testid="agenda-calendar"
              modifiers={{ hasEvent: eventDays }}
              modifiersClassNames={{ hasEvent: "!bg-[#FF2A7A] !text-white font-bold rounded-full", selected: "ring-4 ring-[#FFB800] ring-offset-2" }} />
            <p className="text-xs text-[#0B132B]/60 flex items-center gap-2 pb-2">
              <span className="w-3 h-3 rounded-full bg-[#FF2A7A]" /> Dias com evento
            </p>
          </div>
        </aside>

        <section className="lg:col-span-8">
          {day && (
            <button onClick={() => setDay(null)} data-testid="agenda-clear-day"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#0B132B] text-[#FFB800] px-4 py-2 text-sm font-bold">
              {day.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} <X className="w-4 h-4" />
            </button>
          )}
          {!events && <p className="font-display" data-testid="agenda-loading">Carregando agenda...</p>}
          {events && !shown.length && (
            <p className="flex items-center gap-2 text-[#0B132B]/60" data-testid="agenda-empty">
              <CalendarDays className="w-5 h-5 text-[#FF2A7A]" /> {day ? "Nenhum evento neste dia." : "Nenhum evento agendado por enquanto."}
            </p>
          )}
          {Object.entries(groups).map(([month, list]) => (
            <div key={month} className="mb-10">
              <h2 className="font-display font-bold text-2xl first-letter:uppercase mb-4">{month}</h2>
              <div className="flex flex-col gap-4">
                {list.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
