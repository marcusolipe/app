import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { http, formatDate } from "@/lib/api";

const COLORS = ["#FFB800", "#FF2A7A", "#00C2FF", "#00D18F"];

export default function Comments({ postId, onAdded, compact = false }) {
  const [list, setList] = useState([]);
  const [name, setName] = useState(() => localStorage.getItem("paty_name") || "");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    http.get(`/posts/${postId}/comments`).then((r) => setList(r.data));
  }, [postId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return toast.error("Preencha seu nome e o comentário");
    setSending(true);
    try {
      const { data } = await http.post(`/posts/${postId}/comments`, { name, content });
      localStorage.setItem("paty_name", name);
      setList((l) => [data, ...l]);
      setContent("");
      onAdded?.();
      toast.success("Comentário publicado!");
    } catch {
      toast.error("Não foi possível comentar agora");
    } finally {
      setSending(false);
    }
  };

  return (
    <section data-testid="comments-section" className={compact ? "" : "mt-14"}>
      <h3 className="font-display text-2xl font-bold flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-[#FF2A7A]" /> Comentários <span className="text-[#0B132B]/40">({list.length})</span>
      </h3>
      <form onSubmit={submit} className="mt-5 rounded-3xl border-2 border-[#0B132B] bg-white p-4 sm:p-5 flex flex-col gap-3">
        <input data-testid="comment-input-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
          placeholder="Seu nome" className="rounded-xl bg-[#FFFBF2] border border-[#0B132B]/15 px-4 py-3 outline-none focus:border-[#FF2A7A]" />
        <textarea data-testid="comment-input-content" value={content} onChange={(e) => setContent(e.target.value)} maxLength={1500} rows={3}
          placeholder="O que você achou? Conte pra gente..." className="rounded-xl bg-[#FFFBF2] border border-[#0B132B]/15 px-4 py-3 outline-none focus:border-[#FF2A7A] resize-none" />
        <button data-testid="comment-submit-button" disabled={sending}
          className="self-end inline-flex items-center gap-2 rounded-full bg-[#0B132B] text-[#FFB800] px-6 py-2.5 font-bold hover:bg-[#FF2A7A] hover:text-white transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" /> {sending ? "Enviando..." : "Comentar"}
        </button>
      </form>
      <ul className="mt-6 flex flex-col gap-4" data-testid="comments-list">
        {list.length === 0 && <li className="text-[#0B132B]/50 text-sm">Seja o primeiro a comentar!</li>}
        {list.map((c, i) => (
          <li key={c.id} className="flex gap-3" data-testid={`comment-${c.id}`}>
            <span className="w-10 h-10 shrink-0 rounded-full grid place-items-center font-display font-bold text-[#0B132B]" style={{ background: COLORS[i % 4] }}>
              {c.name[0]?.toUpperCase()}
            </span>
            <div className="flex-1 rounded-2xl bg-white border border-[#0B132B]/10 px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold">{c.name}</span>
                <span className="text-xs text-[#0B132B]/40">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-line">{c.content}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
