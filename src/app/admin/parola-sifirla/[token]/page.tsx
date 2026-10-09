"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { resetPasswordWithToken } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const [message, setMessage] = useState("");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-4xl">Yeni parola</h1>
      <form
        className="mt-6 grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const password = String(new FormData(event.currentTarget).get("password") ?? "");
          const result = await resetPasswordWithToken(params.token, password);
          setMessage(result.ok ? "Parola güncellendi. Giriş sayfasına dönebilirsiniz." : result.message);
        }}
      >
        <input name="password" type="password" className="h-11 rounded-md border px-3" required />
        <Button type="submit">Kaydet</Button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
    </main>
  );
}
