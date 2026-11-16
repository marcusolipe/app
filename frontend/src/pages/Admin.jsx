import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Show, useAuth } from "@clerk/react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { http, TYPES, formatDate } from "@/lib/api";
import PostForm from "@/components/admin/PostForm";
import CommentsAdmin from "@/components/admin/CommentsAdmin";
import UsersAdmin from "@/components/admin/UsersAdmin";

export const useAuthed = () => {
  const { getToken } = useAuth();
  return useCallback(async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } }), [getToken]);
};

const PostsAdmin = () => {
  const auth = useAuthed();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => setPosts((await http.get("/admin/posts", await auth())).data), [auth]);
  useEffect(() => { load(); }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`Excluir "${p.title}"?`)) return;
    await http.delete(`/admin/posts/${p.id}`, await auth());
    toast.success("Postagem excluída");
    load();
  };

  const shown = filter === "all" ? posts : posts.filter((p) => p.type === filter);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["all", ...Object.keys(TYPES)].map((k) => (
            <button key={k} onClick={() => setFilter(k)} data-testid={`admin-filter-${k}`}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold border-2 border-[#0B132B] ${filter === k ? "bg-[#0B132B] text-[#FFB800]" : "bg-white"}`}>
              {k === "all" ? "Todas" : TYPES[k].plural}
            </button>
          ))}
        </div>
        <button onClick={() => setEditing({})} data-testid="admin-add-post-button"
          className="inline-flex items-center gap-2 rounded-full bg-[#FF2A7A] text-white px-5 py-2.5 font-bold shadow-[0_4px_0_#0B132B] hover:translate-y-[2px] hover:shadow-[0_2px_0_#0B132B] transition-transform">
          <Plus className="w-4 h-4" /> Nova postagem
        </button>
      </div>
      <ul className="mt-6 flex flex-col gap-3" data-testid="admin-posts-list">
        {shown.map((p) => (
          <li key={p.id} data-testid={`admin-post-row-${p.id}`} className="flex items-center gap-4 rounded-2xl bg-white border-2 border-[#0B132B]/10 p-3">
            <span className={`hidden sm:inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase ${TYPES[p.type].color}`}>{TYPES[p.type].label}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{p.title}</p>
              <p className="text-xs text-[#0B132B]/50">{formatDate(p.created_at)} • {p.likes} curtidas • {p.comments_count} comentários</p>
            </div>
            {p.published ? <Eye className="w-4 h-4 text-[#00D18F]" /> : <EyeOff className="w-4 h-4 text-[#0B132B]/40" />}
            <button onClick={() => setEditing(p)} data-testid={`admin-edit-post-${p.id}`} className="p-2 rounded-xl hover:bg-[#00C2FF]/20"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => remove(p)} data-testid={`admin-delete-post-${p.id}`} className="p-2 rounded-xl hover:bg-[#FF2A7A]/20 text-[#FF2A7A]"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
      {editing && <PostForm post={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
};

const Dashboard = () => {
  const auth = useAuthed();
  const [me, setMe] = useState(null);
  useEffect(() => { (async () => setMe((await http.get("/me", await auth())).data))().catch(() => setMe({ role: "error" })); }, [auth]);

  if (!me) return <p className="text-center py-24 font-display" data-testid="admin-loading">Verificando acesso...</p>;
  if (me.role !== "admin") {
    return (
      <div className="max-w-lg mx-auto text-center py-24 px-6" data-testid="admin-no-access">
        <h1 className="font-display font-black text-4xl">Acesso restrito</h1>
        <p className="mt-4 text-[#0B132B]/70">Esta área é exclusiva da administração do portal. Se você é a administradora, entre com o e-mail cadastrado como admin.</p>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10" data-testid="admin-dashboard">
      <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight">Painel da <span className="text-[#FF2A7A]">Paty</span></h1>
      <p className="mt-2 text-[#0B132B]/60">Publique, edite e acompanhe tudo do portal.</p>
      <Tabs defaultValue="posts" className="mt-8">
        <TabsList className="bg-[#FFB800]/30 rounded-full p-1">
          <TabsTrigger value="posts" className="rounded-full" data-testid="admin-tab-posts">Postagens</TabsTrigger>
          <TabsTrigger value="comments" className="rounded-full" data-testid="admin-tab-comments">Comentários</TabsTrigger>
          <TabsTrigger value="users" className="rounded-full" data-testid="admin-tab-users">Usuários</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-6"><PostsAdmin /></TabsContent>
        <TabsContent value="comments" className="mt-6"><CommentsAdmin /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersAdmin /></TabsContent>
      </Tabs>
    </div>
  );
};

export default function Admin() {
  return (
    <>
      <Show when="signed-in"><Dashboard /></Show>
      <Show when="signed-out"><Navigate to="/sign-in" replace /></Show>
    </>
  );
}
