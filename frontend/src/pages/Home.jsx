import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { http, TYPES, mediaUrl, postLink } from "@/lib/api";
import PostCard, { TypePill, Stats } from "@/components/PostCard";

const Hero = ({ post }) => (
  <Link to={postLink(post)} data-testid="home-hero-post"
    className="rise group relative block rounded-[2rem] overflow-hidden border-2 border-[#0B132B] shadow-[8px_8px_0_#0B132B] min-h-[420px] lg:min-h-[520px]">
    <img src={mediaUrl(post.cover_url)} alt={post.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/50 to-transparent" />
    <div className="absolute bottom-0 p-6 sm:p-10 text-white max-w-3xl">
      <TypePill type={post.type} />
      <h1 className="mt-4 font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight">{post.title}</h1>
      <p className="mt-4 text-white/80 text-base md:text-lg">{post.summary}</p>
      <div className="mt-5"><Stats post={post} light /></div>
    </div>
  </Link>
);

const SectionRow = ({ type, posts }) => {
  if (!posts.length) return null;
  const t = TYPES[type];
  return (
    <section className="mt-20" data-testid={`home-section-${type}`}>
      <div className="flex items-end justify-between gap-4 mb-7">
        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight">{t.plural}</h2>
        <Link to={t.path} className="inline-flex items-center gap-1 font-bold text-[#FF2A7A] hover:gap-2 transition-[gap]" data-testid={`home-see-all-${type}`}>
          Ver tudo <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
      </div>
    </section>
  );
};

const ReelsTray = ({ reels }) => {
  if (!reels.length) return null;
  return (
    <section className="mt-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-12 bg-[#0B132B] rounded-[2rem] relative grain overflow-hidden" data-testid="home-reels-tray">
      <div className="flex items-end justify-between mb-7 relative">
        <h2 className="font-display font-black text-3xl sm:text-4xl text-white">Reels <span className="text-[#FFB800]">rapidinhos</span></h2>
        <Link to="/reels" className="font-bold text-[#00C2FF] inline-flex items-center gap-1">Assistir <ArrowRight className="w-4 h-4" /></Link>
      </div>
      <div className="flex gap-5 overflow-x-auto no-scrollbar relative pb-2">
        {reels.map((r) => (
          <Link key={r.id} to={postLink(r)} data-testid={`home-reel-${r.id}`}
            className="group relative shrink-0 w-44 sm:w-52 aspect-[9/16] rounded-3xl overflow-hidden border-2 border-[#FFB800] hover:-translate-y-1 transition-transform">
            <img src={mediaUrl(r.cover_url) || "/logo.png"} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            <p className="absolute bottom-3 left-3 right-3 text-white font-display font-bold leading-tight">{r.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default function Home() {
  const [posts, setPosts] = useState(null);
  useEffect(() => { http.get("/posts", { params: { limit: 100 } }).then((r) => setPosts(r.data)); }, []);
  if (!posts) return <div className="max-w-7xl mx-auto px-6 py-24 text-center font-display text-xl" data-testid="home-loading">Investigando as novidades...</div>;

  const by = (t) => posts.filter((p) => p.type === t);
  const hero = posts.find((p) => p.featured && p.type !== "reel") || posts.find((p) => p.type !== "reel");
  const side = posts.filter((p) => p.id !== hero?.id && p.type !== "reel").slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="overflow-hidden whitespace-nowrap border-y-2 border-[#0B132B] bg-[#FFB800] my-6 -mx-4 sm:mx-0 sm:rounded-full">
        <div className="marquee inline-flex gap-10 py-2 font-display font-bold text-sm uppercase tracking-wider">
          {[...posts, ...posts].slice(0, 16).map((p, i) => (
            <span key={i} className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#FF2A7A]" />{p.title}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-[#0B132B]/60 mb-4">
        <Search className="w-4 h-4 text-[#FF2A7A]" /> Angra dos Reis • Costa Verde
      </div>

      {hero && (
        <div className="grid gap-7 lg:grid-cols-12">
          <div className="lg:col-span-8"><Hero post={hero} /></div>
          <div className="lg:col-span-4 grid gap-7">
            {side.map((p, i) => <PostCard key={p.id} post={p} index={i + 1} />)}
          </div>
        </div>
      )}

      <SectionRow type="noticia" posts={by("noticia").filter((p) => p.id !== hero?.id)} />
      <ReelsTray reels={by("reel")} />
      <SectionRow type="entrevista" posts={by("entrevista")} />
      <SectionRow type="video" posts={by("video")} />
      <SectionRow type="coluna" posts={by("coluna")} />
    </div>
  );
}
