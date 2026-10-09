"use client";

import { toast } from "sonner";
import { changeOwnPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  return (
    <div className="max-w-md">
      <h1 className="font-display text-4xl">Hesabım</h1>
      <form
        className="mt-6 grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await changeOwnPassword(
            String(form.get("current") ?? ""),
            String(form.get("next") ?? ""),
          );
          if (!result.ok) toast.error(result.message);
          else {
            toast.success("Parola güncellendi.");
            event.currentTarget.reset();
          }
        }}
      >
        <input name="current" type="password" placeholder="Mevcut parola" className="h-11 rounded-md border px-3" required />
        <input name="next" type="password" placeholder="Yeni parola" className="h-11 rounded-md border px-3" required />
        <Button type="submit">Parolayı değiştir</Button>
      </form>
    </div>
  );
}
