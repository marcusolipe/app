import { parseEmbed } from "@/lib/api";

export default function MediaPlayer({ url, vertical = false, autoPlay = false, className = "" }) {
  const e = parseEmbed(url);
  if (!e) return null;
  const ratio = vertical ? "aspect-[9/16]" : "aspect-video";
  if (e.kind === "file") {
    return (
      <video data-testid="media-player-video" src={e.src} controls playsInline loop={vertical} autoPlay={autoPlay} muted={autoPlay}
        className={`w-full ${ratio} bg-black object-contain ${className}`} />
    );
  }
  return (
    <iframe data-testid="media-player-embed" src={e.src} title="Vídeo" allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      className={`w-full ${e.kind === "instagram" ? "aspect-[4/5]" : ratio} bg-black border-0 ${className}`} />
  );
}
