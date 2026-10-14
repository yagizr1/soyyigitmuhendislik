export type QuoteMessageItem = {
  name: string;
  sku: string;
  quantity: string;
  unitLabel: string;
};

export type QuoteMessageInput = {
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  note?: string;
  items: QuoteMessageItem[];
};

const E164 = /^\+[1-9]\d{7,14}$/;

export function normalizeWhatsAppNumber(input: string): string | null {
  let compact = input.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) compact = `+${compact.slice(2)}`;
  if (/^0\d{10}$/.test(compact)) compact = `+90${compact.slice(1)}`;
  else if (/^90\d{10}$/.test(compact)) compact = `+${compact}`;
  else if (/^\d{10}$/.test(compact)) compact = `+90${compact}`;
  if (!E164.test(compact)) return null;
  return compact;
}

export function buildQuoteMessage(input: QuoteMessageInput): string {
  const lines: string[] = [
    "Merhaba,",
    "",
    "Aşağıdaki ürünler için fiyat teklifi talep ediyorum.",
    "",
    `Firma: ${input.companyName.trim()}`,
  ];

  if (input.contactName?.trim()) lines.push(`İlgili kişi: ${input.contactName.trim()}`);
  if (input.phone?.trim()) lines.push(`Telefon: ${input.phone.trim()}`);
  if (input.email?.trim()) lines.push(`E-posta: ${input.email.trim()}`);

  lines.push("", "Ürünler:");
  input.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name}`,
      `   Kod: ${item.sku}`,
      `   Miktar: ${item.quantity} ${item.unitLabel}`,
    );
  });

  if (input.note?.trim()) {
    lines.push("", "Not:", input.note.trim());
  }

  lines.push(
    "",
    "Bu mesaj yalnızca WhatsApp taslağıdır. Gönderilmeden firmaya ulaşmış sayılmaz. Fiyat, teklif üzerine belirlenir.",
  );

  return lines.join("\n");
}

export function buildWhatsAppUrl(phoneE164: string, message: string): string | null {
  const normalized = normalizeWhatsAppNumber(phoneE164);
  if (!normalized) return null;
  const digits = normalized.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
