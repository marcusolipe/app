import { useState } from "react";
import { Heart } from "lucide-react";
import { http } from "@/lib/api";

const KEY = "paty_likes";
const getLiked = () => JSON.parse(localStorage.getItem(KEY) || "[]");

export default function LikeButton({ post, vertical = false }) {
  const [liked, setLiked] = useState(() => getLiked().includes(post.id));
  const [likes, setLikes] = useState(post.likes);
  const [anim, setAnim] = useState(false);

  const toggle = async (e) => {
    e?.preventDefault();
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    setAnim(true);
    setTimeout(() => setAnim(false), 400);
    const list = getLiked().filter((id) => id !== post.id);
    localStorage.setItem(KEY, JSON.stringify(next ? [...list, post.id] : list));
    const { data } = await http.post(`/posts/${post.id}/like`, null, { params: { unlike: !next } });
    setLikes(data.likes);
  };

  if (vertical) {
    return (
      <button onClick={toggle} data-testid={`like-button-post-${post.id}`} className="flex flex-col items-center gap-1 text-white">
        <span className={`w-12 h-12 rounded-full grid place-items-center backdrop-blur-md ${liked ? "bg-[#FF2A7A]" : "bg-white/20"} ${anim ? "pop" : ""}`}>
          <Heart className={`w-6 h-6 ${liked ? "fill-white" : ""}`} />
        </span>
        <span className="text-xs font-bold" data-testid={`like-count-${post.id}`}>{likes}</span>
      </button>
    );
  }
  return (
    <button onClick={toggle} data-testid={`like-button-post-${post.id}`}
      className={`inline-flex items-center gap-2 rounded-full border-2 border-[#0B132B] px-5 py-2.5 font-bold transition-colors duration-200 ${
        liked ? "bg-[#FF2A7A] text-white" : "bg-white hover:bg-[#FF2A7A]/10"}`}>
      <Heart className={`w-5 h-5 ${liked ? "fill-white" : "text-[#FF2A7A]"} ${anim ? "pop" : ""}`} />
      <span data-testid={`like-count-${post.id}`}>{likes}</span> {liked ? "Curtido" : "Curtir"}
    </button>
  );
}
