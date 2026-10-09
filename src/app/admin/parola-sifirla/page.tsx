"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordResetRequestPage() {
  const [message, setMessage] = useState("");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-4xl">Parola sıfırlama</h1>
      <form
        className="mt-6 grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const email = String(new FormData(event.currentTarget).get("resetEmail") ?? "");
          const result = await requestPasswordReset(email);
          setMessage(
            result.ok
              ? "E-posta kayıtlıysa ve SMTP tanımlıysa bağlantı gönderilir. Değilse npm run admin:reset-password kullanın."
              : result.message,
          );
        }}
      >
        <div>
          <Label htmlFor="resetEmail">E-posta</Label>
          <Input id="resetEmail" name="resetEmail" type="email" autoComplete="email" />
        </div>
        {message ? <p className="text-sm">{message}</p> : null}
        <Button type="submit">Sıfırlama iste</Button>
      </form>
      <Link href="/admin/giris" className="mt-6 text-sm text-accent underline">
        Girişe dön
      </Link>
    </main>
  );
}
