import { Link } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";
import { mediaUrl, parseDay } from "@/lib/api";
import { Stats } from "@/components/PostCard";

export const DateBlock = ({ date, className = "" }) => {
  const d = parseDay(date);
  return (
    <div className={`shrink-0 w-16 rounded-2xl border-2 border-[#0B132B] bg-[#FFB800] text-center overflow-hidden ${className}`}>
      <div className="bg-[#FF2A7A] text-white text-[10px] font-bold uppercase py-0.5">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</div>
      <div className="font-display font-black text-2xl leading-8">{d.getDate()}</div>
      <div className="text-[10px] font-bold uppercase pb-1">{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</div>
    </div>
  );
};

export default function EventCard({ event, index = 0 }) {
  return (
    <Link to={`/post/${event.id}`} data-testid={`event-card-${event.id}`} style={{ animationDelay: `${index * 60}ms` }}
      className="rise group flex gap-4 items-center rounded-3xl bg-white border-2 border-[#0B132B] p-3 shadow-[5px_5px_0_#0B132B] hover:shadow-[8px_8px_0_#FF7A00] hover:-translate-y-0.5 transition-[transform,box-shadow] duration-300">
      {event.event_date && <DateBlock date={event.event_date} />}
      <div className="flex-1 min-w-0 py-1">
        {event.category && <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7A00]">{event.category}</span>}
        <h3 className="font-display font-bold text-lg leading-tight group-hover:text-[#FF2A7A] transition-colors">{event.title}</h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#0B132B]/60 font-semibold">
          {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.event_time}</span>}
          {event.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>}
        </div>
        <div className="mt-2"><Stats post={event} /></div>
      </div>
      {event.cover_url && (
        <img src={mediaUrl(event.cover_url)} alt={event.title} loading="lazy" className="hidden sm:block w-28 h-24 rounded-2xl object-cover" />
      )}
    </Link>
  );
}
