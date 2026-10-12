import { buildProductWorkbook } from "@/actions/products";
import { can } from "@/lib/permissions";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !can(session.role, "products.write")) {
    return new Response("Yetkisiz", { status: 401 });
  }
  const workbook = await buildProductWorkbook();
  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=urunler.xlsx",
    },
  });
}
