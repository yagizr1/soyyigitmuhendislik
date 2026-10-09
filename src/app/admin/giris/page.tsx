"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/lib/validators";
import type { z } from "zod";

type LoginValues = z.input<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-4xl">Yönetici girişi</h1>
      <p className="mt-2 text-sm text-muted">Herkese açık kayıt yoktur. İlk hesap sunucuda komutla oluşturulur.</p>
      <form
        className="mt-6 grid gap-3"
        onSubmit={form.handleSubmit(async (values) => {
          const result = await loginAction(values);
          if (!result.ok) setMessage(result.message);
          else router.push("/admin");
        })}
      >
        <div>
          <Label htmlFor="username">Kullanıcı adı</Label>
          <Input id="username" type="text" autoComplete="username" {...form.register("username")} />
          <p className="text-sm text-red-700">{form.formState.errors.username?.message}</p>
        </div>
        <div>
          <Label htmlFor="password">Parola</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
          <p className="text-sm text-red-700">{form.formState.errors.password?.message}</p>
        </div>
        <Link href="/admin/parola-sifirla" className="text-sm text-accent underline">
          Şifremi unuttum
        </Link>
        {message ? <p className="text-sm text-red-700">{message}</p> : null}
        <Button type="submit">Giriş yap</Button>
      </form>
    </main>
  );
}
