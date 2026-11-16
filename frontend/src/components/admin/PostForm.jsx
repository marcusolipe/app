import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { http, TYPES, mediaUrl } from "@/lib/api";
import { useAuthed } from "@/pages/Admin";

const EMPTY = { type: "noticia", title: "", summary: "", content: "", category: "", author: "Paty", cover_url: "", video_url: "", published: true, featured: false };
const inputCls = "w-full rounded-xl bg-[#FFFBF2] border border-[#0B132B]/15 px-4 py-2.5 outline-none focus:border-[#FF2A7A]";

const MediaField = ({ label, value, onChange, accept, testid }) => {
  const auth = useAuthed();
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const cfg = await auth();
      const { data } = await http.post("/admin/upload", fd, cfg);
      onChange(data.url);
      toast.success("Arquivo enviado!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Falha no envio");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <label className="text-sm font-bold">{label}</label>
      <div className="mt-1 flex gap-2">
        <input data-testid={`${testid}-input`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Cole um link ou envie um arquivo" className={inputCls} />
        <button type="button" onClick={() => ref.current.click()} disabled={busy} data-testid={`${testid}-upload-button`}
          className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#00C2FF] px-3 font-semibold text-sm disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Enviar
        </button>
        <input ref={ref} type="file" accept={accept} hidden onChange={(e) => upload(e.target.files[0])} data-testid={`${testid}-file`} />
      </div>
      {value && accept.startsWith("image") && <img src={mediaUrl(value)} alt="" className="mt-2 h-24 rounded-xl object-cover" />}
    </div>
  );
};

export default function PostForm({ post, onClose, onSaved }) {
  const auth = useAuthed();
  const [f, setF] = useState({ ...EMPTY, ...post });
  const [saving, setSaving] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const isMedia = ["video", "reel", "entrevista"].includes(f.type);

  const save = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast.error("Informe o título");
    setSaving(true);
    const body = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, f[k]]));
    try {
      const cfg = await auth();
      if (post.id) await http.put(`/admin/posts/${post.id}`, body, cfg);
      else await http.post("/admin/posts", body, cfg);
      toast.success("Postagem salva!");
      onSaved();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white" data-testid="admin-post-form">
        <DialogHeader><DialogTitle className="font-display text-2xl">{post.id ? "Editar postagem" : "Nova postagem"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold">Tipo</label>
              <Select value={f.type} onValueChange={set("type")}>
                <SelectTrigger className="mt-1 rounded-xl" data-testid="admin-post-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPES).map(([k, t]) => <SelectItem key={k} value={k} data-testid={`admin-post-type-${k}`}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-bold">Categoria</label>
              <input data-testid="admin-post-category-select" value={f.category} onChange={(e) => set("category")(e.target.value)} placeholder="Ex.: Turismo, Cidade, Festa" className={`mt-1 ${inputCls}`} />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold">Título</label>
            <input data-testid="admin-post-title-input" value={f.title} onChange={(e) => set("title")(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className="text-sm font-bold">Resumo</label>
            <input data-testid="admin-post-summary-input" value={f.summary} onChange={(e) => set("summary")(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className="text-sm font-bold">Texto (separe parágrafos com uma linha em branco)</label>
            <textarea data-testid="admin-post-content-input" rows={8} value={f.content} onChange={(e) => set("content")(e.target.value)} className={`mt-1 ${inputCls}`} />
          </div>
          <MediaField label="Imagem de capa" value={f.cover_url} onChange={set("cover_url")} accept="image/*" testid="admin-post-cover" />
          <MediaField label={isMedia ? "Vídeo (YouTube, Instagram ou arquivo)" : "Vídeo (opcional)"} value={f.video_url} onChange={set("video_url")} accept="video/*" testid="admin-post-media-url" />
          <div className="grid sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="text-sm font-bold">Autor(a)</label>
              <input data-testid="admin-post-author-input" value={f.author} onChange={(e) => set("author")(e.target.value)} className={`mt-1 ${inputCls}`} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold pt-5">
              <Switch checked={f.published} onCheckedChange={set("published")} data-testid="admin-post-published-switch" /> Publicada
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold pt-5">
              <Switch checked={f.featured} onCheckedChange={set("featured")} data-testid="admin-post-featured-switch" /> Destaque
            </label>
          </div>
          <button data-testid="admin-post-save-button" disabled={saving}
            className="mt-2 rounded-full bg-[#0B132B] text-[#FFB800] py-3 font-bold hover:bg-[#FF2A7A] hover:text-white transition-colors disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar postagem"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
