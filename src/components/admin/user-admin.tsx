"use client";

import { toast } from "sonner";
import { createUser, updateUserAccess } from "@/actions/users";
import { Button } from "@/components/ui/button";

export function UserAdmin({
  users,
}: {
  users: { id: string; name: string; username: string; email: string; role: "ADMIN" | "EDITOR"; active: boolean }[];
}) {
  return (
    <div className="max-w-3xl">
      <form
        className="grid gap-2 rounded-lg border border-border bg-card p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await createUser({
            name: String(form.get("name") ?? ""),
            username: String(form.get("username") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            role: String(form.get("role") ?? "EDITOR"),
          });
          if (!result.ok) toast.error(result.message);
          else {
            toast.success("Kullanıcı oluşturuldu.");
            event.currentTarget.reset();
            window.location.reload();
          }
        }}
      >
        <h2 className="font-semibold">Yeni hesap</h2>
        <input name="name" placeholder="Ad" className="h-11 rounded-md border px-3" required />
        <input name="username" placeholder="Kullanıcı adı" autoComplete="off" className="h-11 rounded-md border px-3" required />
        <input name="email" type="email" placeholder="E-posta" className="h-11 rounded-md border px-3" required />
        <input name="password" type="password" placeholder="Geçici parola" className="h-11 rounded-md border px-3" required />
        <select name="role" className="h-11 rounded-md border px-3">
          <option value="EDITOR">Editör</option>
          <option value="ADMIN">Yönetici</option>
        </select>
        <Button type="submit">Oluştur</Button>
      </form>
      <ul className="mt-6 space-y-3">
        {users.map((user) => (
          <li key={user.id} className="rounded-lg border border-border bg-card p-3">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted">{user.username} · {user.email}</p>
            <form
              className="mt-2 flex flex-wrap gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = await updateUserAccess(
                  user.id,
                  String(form.get("role")) === "ADMIN" ? "ADMIN" : "EDITOR",
                  form.get("active") === "on",
                );
                if (!result.ok) toast.error(result.message);
                else toast.success("Yetki güncellendi.");
              }}
            >
              <select name="role" defaultValue={user.role} className="h-11 rounded-md border px-3">
                <option value="ADMIN">Yönetici</option>
                <option value="EDITOR">Editör</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={user.active} /> Etkin
              </label>
              <Button type="submit" variant="outline">Kaydet</Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
