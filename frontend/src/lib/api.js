import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export const http = axios.create({ baseURL: API });

export const TYPES = {
  noticia: { label: "Notícia", plural: "Notícias", path: "/noticias", color: "bg-[#FFB800] text-[#0B132B]" },
  entrevista: { label: "Entrevista", plural: "Entrevistas", path: "/entrevistas", color: "bg-[#00C2FF] text-[#0B132B]" },
  video: { label: "Matéria em vídeo", plural: "Matérias em Vídeo", path: "/videos", color: "bg-[#FF2A7A] text-white" },
  reel: { label: "Reels", plural: "Reels", path: "/reels", color: "bg-[#00D18F] text-[#0B132B]" },
  coluna: { label: "Coluna Social", plural: "Colunas Sociais", path: "/colunas", color: "bg-[#0B132B] text-[#FFB800]" },
  evento: { label: "Evento", plural: "Agenda de Eventos", path: "/agenda", color: "bg-[#FF7A00] text-white" },
};

export const parseDay = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const dayKey = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

export const mediaUrl = (u) => (u && u.startsWith("/api/") ? `${BACKEND_URL}${u}` : u);

export function parseEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: "youtube", src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  const ig = url.match(/instagram\.com\/(p|reel|reels|tv)\/([\w-]+)/);
  if (ig) return { kind: "instagram", src: `https://www.instagram.com/${ig[1] === "reels" ? "reel" : ig[1]}/${ig[2]}/embed` };
  return { kind: "file", src: mediaUrl(url) };
}

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export const postLink = (p) => (p.type === "reel" ? `/reels?r=${p.id}` : `/post/${p.id}`);
