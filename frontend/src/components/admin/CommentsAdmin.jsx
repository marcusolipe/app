import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { http, formatDate } from "@/lib/api";
import { useAuthed } from "@/pages/Admin";

export default function CommentsAdmin() {
  const auth = useAuthed();
  const [list, setList] = useState([]);
  const load = useCallback(async () => setList((await http.get("/admin/comments", await auth())).data), [auth]);
  useEffect(() => { load(); }, [load]);

  const remove = async (c) => {
    if (!window.confirm("Apagar este comentário?")) return;
    await http.delete(`/admin/comments/${c.id}`, await auth());
    toast.success("Comentário apagado");
    load();
  };

  return (
    <ul className="flex flex-col gap-3" data-testid="admin-comments-list">
      {!list.length && <li className="text-[#0B132B]/50">Nenhum comentário ainda.</li>}
      {list.map((c) => (
        <li key={c.id} className="flex gap-3 items-start rounded-2xl bg-white border-2 border-[#0B132B]/10 p-4" data-testid={`admin-comment-${c.id}`}>
          <div className="flex-1">
            <p className="text-xs text-[#0B132B]/50">em <b>{c.post_title}</b> • {formatDate(c.created_at)}</p>
            <p className="font-bold mt-1">{c.name}</p>
            <p className="text-sm">{c.content}</p>
          </div>
          <button onClick={() => remove(c)} data-testid={`admin-delete-comment-${c.id}`} className="p-2 rounded-xl text-[#FF2A7A] hover:bg-[#FF2A7A]/15"><Trash2 className="w-4 h-4" /></button>
        </li>
      ))}
    </ul>
  );
}
