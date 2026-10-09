"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createContactRequest } from "@/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({ idPrefix = "" }: { idPrefix?: string }) {
  const [pending, setPending] = useState(false);
  const fieldId = (name: string) => `${idPrefix}${name}`;

  return (
    <form
      className="grid gap-3 rounded-lg border border-border bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        const result = await createContactRequest({
          companyName: String(form.get("companyName") ?? ""),
          contactName: String(form.get("contactName") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? ""),
          note: String(form.get("note") ?? ""),
          consent: form.get("consent") === "on" ? true : false,
        });
        setPending(false);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("İletiniz kaydedildi.");
        event.currentTarget.reset();
      }}
    >
      <h3 className="font-display text-2xl">İleti bırakın</h3>
      <div>
        <Label htmlFor={fieldId("companyName")}>Firma veya ad</Label>
        <Input id={fieldId("companyName")} name="companyName" required />
      </div>
      <div>
        <Label htmlFor={fieldId("contactName")}>İlgili kişi</Label>
        <Input id={fieldId("contactName")} name="contactName" />
      </div>
      <div>
        <Label htmlFor={fieldId("phone")}>Telefon</Label>
        <Input id={fieldId("phone")} name="phone" />
      </div>
      <div>
        <Label htmlFor={fieldId("email")}>E-posta</Label>
        <Input id={fieldId("email")} name="email" type="email" />
      </div>
      <div>
        <Label htmlFor={fieldId("note")}>Mesaj</Label>
        <Textarea id={fieldId("note")} name="note" required />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" className="mt-1 size-4" />
        <span>
          Bu iletinin kaydedilmesini ve{" "}
          <Link href="/kvkk" className="underline">aydınlatma metnini</Link> okuduğumu onaylıyorum.
        </span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Gönderiliyor" : "İletiyi kaydet"}
      </Button>
    </form>
  );
}
