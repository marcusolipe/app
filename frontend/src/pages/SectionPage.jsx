import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { http, TYPES } from "@/lib/api";
import PostCard from "@/components/PostCard";

const INTROS = {
  noticia: "Tudo o que acontece em Angra dos Reis, apurado de perto.",
  entrevista: "Conversas exclusivas com quem faz a cidade acontecer.",
  video: "Reportagens completas para assistir e compartilhar.",
  coluna: "Festas, eventos e bastidores da sociedade angrense, pelo olhar da Paty.",
};

export default function SectionPage({ type }) {
  const [posts, setPosts] = useState(null);
  const [q, setQ] = useState("");
  const t = TYPES[type];

  useEffect(() => {
    setPosts(null);
    const id = setTimeout(() => http.get("/posts", { params: { type, q: q || undefined } }).then((r) => setPosts(r.data)), 250);
    return () => clearTimeout(id);
  }, [type, q]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12" data-testid={`section-page-${type}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${t.color}`}>Paty Investiga</span>
          <h1 className="mt-3 font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight">{t.plural}</h1>
          <p className="mt-3 text-base md:text-lg text-[#0B132B]/70 max-w-xl">{INTROS[type]}</p>
        </div>
        <label className="flex items-center gap-2 rounded-full border-2 border-[#0B132B] bg-white px-4 py-2.5 w-full md:w-80">
          <Search className="w-4 h-4 text-[#FF2A7A]" />
          <input data-testid="section-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="bg-transparent outline-none flex-1" />
        </label>
      </div>
      <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {posts?.map((p, i) => <PostCard key={p.id} post={p} index={i} big={i === 0} />)}
      </div>
      {posts && !posts.length && <p className="mt-10 text-center text-[#0B132B]/50" data-testid="section-empty">Nada por aqui ainda. A Paty está investigando!</p>}
      {!posts && <p className="mt-10 text-center font-display" data-testid="section-loading">Carregando...</p>}
    </div>
  );
}
