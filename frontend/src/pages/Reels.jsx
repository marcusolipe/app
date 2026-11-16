import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronUp, ChevronDown, MessageCircle } from "lucide-react";
import { http, mediaUrl } from "@/lib/api";
import MediaPlayer from "@/components/MediaPlayer";
import LikeButton from "@/components/LikeButton";
import ShareButton from "@/components/ShareButton";
import Comments from "@/components/Comments";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const ReelItem = ({ reel, onComments }) => (
  <div className="reel-item relative h-[calc(100vh-90px)] flex items-center justify-center py-4" id={`reel-${reel.id}`} data-testid={`reel-item-${reel.id}`}>
    <div className="relative h-full aspect-[9/16] max-w-full rounded-[2rem] overflow-hidden border-2 border-[#FFB800] bg-black">
      {reel.video_url ? (
        <MediaPlayer url={reel.video_url} vertical className="h-full" />
      ) : (
        <img src={mediaUrl(reel.cover_url)} alt={reel.title} className="w-full h-full object-cover" />
      )}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 p-5 pr-20 bg-gradient-to-t from-black/90 to-transparent text-white">
        <p className="font-display font-bold text-lg leading-tight">{reel.title}</p>
        {reel.summary && <p className="text-sm text-white/75 mt-1">{reel.summary}</p>}
      </div>
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        <LikeButton post={reel} vertical />
        <button onClick={() => onComments(reel)} data-testid={`reel-comments-button-${reel.id}`} className="flex flex-col items-center gap-1 text-white">
          <span className="w-12 h-12 rounded-full grid place-items-center bg-white/20 backdrop-blur-md"><MessageCircle className="w-6 h-6" /></span>
          <span className="text-xs font-bold">{reel.comments_count}</span>
        </button>
        <ShareButton post={reel} vertical />
      </div>
    </div>
  </div>
);

export default function Reels() {
  const [reels, setReels] = useState(null);
  const [active, setActive] = useState(null);
  const [params] = useSearchParams();
  const box = useRef(null);

  useEffect(() => { http.get("/posts", { params: { type: "reel" } }).then((r) => setReels(r.data)); }, []);
  useEffect(() => {
    const id = params.get("r");
    if (reels && id) document.getElementById(`reel-${id}`)?.scrollIntoView();
  }, [reels, params]);

  const move = (dir) => box.current?.scrollBy({ top: dir * box.current.clientHeight, behavior: "smooth" });
  const bump = (id) => setReels((rs) => rs.map((r) => (r.id === id ? { ...r, comments_count: r.comments_count + 1 } : r)));

  return (
    <div className="relative bg-[#0B132B] grain" data-testid="reels-page">
      <div ref={box} className="reels-scroll h-[calc(100vh-90px)] overflow-y-auto relative">
        {reels?.map((r) => <ReelItem key={r.id} reel={r} onComments={setActive} />)}
        {reels && !reels.length && <p className="text-white text-center pt-32 font-display text-xl" data-testid="reels-empty">Nenhum reel ainda.</p>}
      </div>
      <div className="hidden md:flex flex-col gap-3 absolute right-8 top-1/2 -translate-y-1/2">
        <button onClick={() => move(-1)} data-testid="reels-prev-button" className="w-12 h-12 rounded-full bg-[#FFB800] grid place-items-center hover:scale-110 transition-transform"><ChevronUp /></button>
        <button onClick={() => move(1)} data-testid="reels-next-button" className="w-12 h-12 rounded-full bg-[#FFB800] grid place-items-center hover:scale-110 transition-transform"><ChevronDown /></button>
      </div>
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="bg-[#FFFBF2] w-full sm:max-w-md overflow-y-auto" data-testid="reel-comments-drawer">
          <SheetTitle className="font-display pr-6">{active?.title}</SheetTitle>
          {active && <div className="mt-4"><Comments postId={active.id} compact onAdded={() => bump(active.id)} /></div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
