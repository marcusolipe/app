import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { http } from "@/lib/api";
import { useAuthed } from "@/pages/Admin";

const LABELS = { admin: "Administrador", member: "Membro" };

export default function UsersAdmin() {
  const auth = useAuthed();
  const [data, setData] = useState({ roles: [], users: [] });
  const load = useCallback(async () => setData((await http.get("/users", await auth())).data), [auth]);
  useEffect(() => { load(); }, [load]);

  const change = async (u, role) => {
    try {
      await http.patch(`/users/${u.user_id}/role`, { role }, await auth());
      toast.success("Permissão atualizada");
    } catch (e) {
      toast.error(e.response?.status === 409 ? "O portal precisa de pelo menos um admin" : "Não permitido");
    }
    load();
  };

  return (
    <ul className="flex flex-col gap-3" data-testid="admin-users-list">
      {data.users.map((u) => (
        <li key={u.user_id} className="flex items-center gap-3 rounded-2xl bg-white border-2 border-[#0B132B]/10 p-4" data-testid={`admin-user-${u.user_id}`}>
          <span className="flex-1 font-semibold truncate">{u.email || u.user_id}</span>
          <select value={u.role} onChange={(e) => change(u, e.target.value)} data-testid={`admin-user-role-${u.user_id}`}
            className="rounded-xl border border-[#0B132B]/20 px-3 py-2 bg-[#FFFBF2]">
            {data.roles.map((r) => <option key={r} value={r}>{LABELS[r] || r}</option>)}
          </select>
        </li>
      ))}
    </ul>
  );
}
