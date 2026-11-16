import { Link } from "react-router-dom";
import { Heart, MessageCircle, Play } from "lucide-react";
import { TYPES, mediaUrl, formatDate, postLink } from "@/lib/api";

export const TypePill = ({ type, className = "" }) => (
  <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${TYPES[type]?.color} ${className}`}>
    {TYPES[type]?.label}
  </span>
);

export const Stats = ({ post, light }) => (
  <div className={`flex items-center gap-4 text-xs font-semibold ${light ? "text-white/80" : "text-[#0B132B]/60"}`}>
    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes}</span>
    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.comments_count}</span>
  </div>
);

export default function PostCard({ post, big = false, index = 0 }) {
  const isVideo = post.type === "video" || post.type === "reel";
  return (
    <Link to={postLink(post)} data-testid={`post-card-${post.id}`}
      style={{ animationDelay: `${index * 70}ms` }}
      className="rise group relative flex flex-col rounded-3xl bg-white border-2 border-[#0B132B] overflow-hidden shadow-[6px_6px_0_#0B132B] hover:shadow-[10px_10px_0_#FF2A7A] hover:-translate-y-1 transition-[transform,box-shadow] duration-300">
      <div className={`relative overflow-hidden ${big ? "aspect-[16/10]" : "aspect-[16/11]"}`}>
        <img src={mediaUrl(post.cover_url) || "/logo.png"} alt={post.title} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <TypePill type={post.type} className="absolute top-4 left-4" />
        {isVideo && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="w-14 h-14 rounded-full bg-[#FFB800] border-2 border-[#0B132B] grid place-items-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-[#0B132B]" />
            </span>
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        {post.category && <span className="text-xs font-bold text-[#FF2A7A] uppercase tracking-wider">{post.category}</span>}
        <h3 className={`font-display font-bold leading-tight group-hover:text-[#FF2A7A] transition-colors ${big ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
          {post.title}
        </h3>
        {post.summary && <p className="text-sm text-[#0B132B]/70 line-clamp-2">{post.summary}</p>}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-xs text-[#0B132B]/50">{formatDate(post.created_at)}</span>
          <Stats post={post} />
        </div>
      </div>
    </Link>
  );
}
