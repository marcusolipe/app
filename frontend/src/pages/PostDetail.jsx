import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { http, TYPES, mediaUrl, formatDate } from "@/lib/api";
import { TypePill } from "@/components/PostCard";
import MediaPlayer from "@/components/MediaPlayer";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import Comments from "@/components/Comments";

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setPost(null);
    http.get(`/posts/${id}`).then((r) => setPost(r.data)).catch(() => setError(true));
    window.scrollTo(0, 0);
  }, [id]);

  if (error) return <p className="text-center py-24 font-display text-xl" data-testid="post-not-found">Postagem não encontrada.</p>;
  if (!post) return <p className="text-center py-24 font-display" data-testid="post-loading">Carregando...</p>;

  const t = TYPES[post.type];
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-10" data-testid="post-detail">
      <Link to={t.path} className="inline-flex items-center gap-1 text-sm font-bold text-[#0B132B]/60 hover:text-[#FF2A7A]" data-testid="post-back-link">
        <ArrowLeft className="w-4 h-4" /> {t.plural}
      </Link>
      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <TypePill type={post.type} />
        {post.category && <span className="text-xs font-bold uppercase tracking-wider text-[#FF2A7A]">{post.category}</span>}
      </div>
      <h1 className="mt-4 font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight" data-testid="post-title">{post.title}</h1>
      {post.summary && <p className="mt-5 text-base md:text-lg text-[#0B132B]/70">{post.summary}</p>}
      <div className="mt-6 flex items-center gap-5 text-sm text-[#0B132B]/60">
        <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</span>
        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(post.created_at)}</span>
      </div>

      <div className="mt-8 rounded-[2rem] overflow-hidden border-2 border-[#0B132B] shadow-[8px_8px_0_#FFB800] bg-black">
        {post.video_url ? (
          <MediaPlayer url={post.video_url} vertical={post.type === "reel"} />
        ) : post.cover_url ? (
          <img src={mediaUrl(post.cover_url)} alt={post.title} className="w-full max-h-[560px] object-cover" />
        ) : null}
      </div>

      <div className="mt-10 prose-paty whitespace-pre-line" data-testid="post-content">
        {post.content.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
      </div>

      <div className="mt-10 flex flex-wrap gap-3 py-6 border-y-2 border-dashed border-[#0B132B]/20" data-testid="post-actions">
        <LikeButton post={post} />
        <ShareButton post={post} />
      </div>

      <Comments postId={post.id} />
    </article>
  );
}
