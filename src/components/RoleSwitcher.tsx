import { switchUser } from "@/app/actions/session-role";
import { listDemoUsers } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/labels";

export async function RoleSwitcher({ currentUserId }: { currentUserId?: string }) {
  const demoUsers = await listDemoUsers();
  const groups = (["STUDENT", "COACH", "ADMIN"] as const).map((role) => ({ role, users: demoUsers.filter((u) => u.role === role) }));
  return (
    <form action={switchUser} className="flex items-center gap-2">
      <label htmlFor="userId" className="hidden text-xs text-slate-500 sm:block">
        Connecté en tant que
      </label>
      <select
        id="userId"
        name="userId"
        defaultValue={currentUserId ?? ""}
        className="input !w-auto !py-1.5 text-xs"
      >
        <option value="">Visiteur (non connecté)</option>
        {groups.map((g) => (
          <optgroup key={g.role} label={ROLE_LABELS[g.role]}>
            {g.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button type="submit" className="btn btn-secondary btn-sm">
        Changer
      </button>
    </form>
  );
}
