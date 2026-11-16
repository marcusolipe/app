import { Share2, Link2, MessageCircle, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { postLink } from "@/lib/api";

export default function ShareButton({ post, vertical = false }) {
  const url = `${window.location.origin}${postLink(post)}`;
  const text = encodeURIComponent(`${post.title} | PATY INVESTIGA`);
  const enc = encodeURIComponent(url);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    toast.success("Link copiado!");
  };
  const options = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${text}%20${enc}`, cls: "bg-[#25D366] text-white" },
    { id: "facebook", label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, cls: "bg-[#1877F2] text-white" },
    { id: "x", label: "X / Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?text=${text}&url=${enc}`, cls: "bg-[#0B132B] text-white" },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        {vertical ? (
          <button data-testid={`share-button-post-${post.id}`} className="flex flex-col items-center gap-1 text-white">
            <span className="w-12 h-12 rounded-full grid place-items-center bg-white/20 backdrop-blur-md"><Share2 className="w-6 h-6" /></span>
            <span className="text-xs font-bold">Enviar</span>
          </button>
        ) : (
          <button data-testid={`share-button-post-${post.id}`}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#0B132B] bg-[#00C2FF] px-5 py-2.5 font-bold hover:bg-[#00C2FF]/80 transition-colors">
            <Share2 className="w-5 h-5" /> Compartilhar
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-60 rounded-2xl border-2 border-[#0B132B] p-3 flex flex-col gap-2" data-testid="share-popover">
        {options.map((o) => (
          <a key={o.id} href={o.href} target="_blank" rel="noopener noreferrer" data-testid={`share-${o.id}`}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:opacity-90 ${o.cls}`}>
            <o.icon className="w-4 h-4" /> {o.label}
          </a>
        ))}
        <button onClick={copy} data-testid="share-copy-link" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-[#FFB800] hover:opacity-90">
          <Link2 className="w-4 h-4" /> Copiar link
        </button>
      </PopoverContent>
    </Popover>
  );
}
