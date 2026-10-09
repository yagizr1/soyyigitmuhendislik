import { buildProductCsv } from "@/actions/products";
import { can } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session.role, "products.write")) {
    return new Response("Yetkisiz", { status: 401 });
  }
  const csv = await buildProductCsv();
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=urunler.csv",
    },
  });
}
