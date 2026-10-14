import { PrismaClient, type Prisma, type StockStatus, type Unit } from "@prisma/client";
import { defaultBrand, defaultCompany, defaultFaqs, defaultHome, defaultSocial } from "../src/lib/defaults";

const prisma = new PrismaClient();

const sample = "Örnek katalog kaydıdır. Ölçü ve ağırlık sipariş öncesi teyit edilmelidir.";

type SeedProduct = {
  name: string;
  sku: string;
  slug: string;
  category: string;
  profileType: string;
  sectionShape: string;
  width: string;
  height: string;
  thickness: string;
  length: string;
  grade: string;
  weight: string;
  unit: Unit;
  min: string;
  stock: StockStatus;
  featured?: boolean;
  surface: string;
};

const products: SeedProduct[] = [
  ["40x40x2 mm Kare Profil", "KP-40-40-2", "40x40x2-mm-kare-profil", "kare-profil", "Kare profil", "kare", "40", "40", "2", "6000", "S235JR", "2.31", "METER", "6", "IN_STOCK", true],
  ["50x50x2 mm Kare Profil", "KP-50-50-2", "50x50x2-mm-kare-profil", "kare-profil", "Kare profil", "kare", "50", "50", "2", "6000", "S235JR", "2.96", "METER", "6", "IN_STOCK", true],
  ["60x60x3 mm Kare Profil", "KP-60-60-3", "60x60x3-mm-kare-profil", "kare-profil", "Kare profil", "kare", "60", "60", "3", "6000", "S275JR", "5.25", "METER", "6", "MADE_TO_ORDER", true],
  ["80x80x3 mm Kare Profil", "KP-80-80-3", "80x80x3-mm-kare-profil", "kare-profil", "Kare profil", "kare", "80", "80", "3", "6000", "S235JR", "7.13", "METER", "6", "LOW_STOCK", false],
  ["40x20x2 mm Dikdörtgen Profil", "DP-40-20-2", "40x20x2-mm-dikdortgen-profil", "dikdortgen-profil", "Dikdörtgen profil", "dikdortgen", "40", "20", "2", "6000", "S235JR", "1.68", "METER", "6", "IN_STOCK", true],
  ["60x40x2 mm Dikdörtgen Profil", "DP-60-40-2", "60x40x2-mm-dikdortgen-profil", "dikdortgen-profil", "Dikdörtgen profil", "dikdortgen", "60", "40", "2", "6000", "S235JR", "2.96", "METER", "6", "IN_STOCK", false],
  ["80x40x3 mm Dikdörtgen Profil", "DP-80-40-3", "80x40x3-mm-dikdortgen-profil", "dikdortgen-profil", "Dikdörtgen profil", "dikdortgen", "80", "40", "3", "6000", "S275JR", "5.19", "METER", "6", "MADE_TO_ORDER", false],
  ["100x50x3 mm Dikdörtgen Profil", "DP-100-50-3", "100x50x3-mm-dikdortgen-profil", "dikdortgen-profil", "Dikdörtgen profil", "dikdortgen", "100", "50", "3", "6000", "S235JR", "6.66", "METER", "6", "OUT_OF_STOCK", false],
  ["120x60x4 mm Dikdörtgen Profil", "DP-120-60-4", "120x60x4-mm-dikdortgen-profil", "dikdortgen-profil", "Dikdörtgen profil", "dikdortgen", "120", "60", "4", "12000", "S355JR", "10.70", "METER", "12", "MADE_TO_ORDER", false],
  ["30x30x3 mm Köşebent", "KB-30-30-3", "30x30x3-mm-kosebent", "kosebent", "Köşebent", "kosebent", "30", "30", "3", "6000", "S235JR", "1.36", "METER", "6", "IN_STOCK", false],
  ["40x40x4 mm Köşebent", "KB-40-40-4", "40x40x4-mm-kosebent", "kosebent", "Köşebent", "kosebent", "40", "40", "4", "6000", "S235JR", "2.42", "METER", "6", "IN_STOCK", false],
  ["50x50x5 mm Köşebent", "KB-50-50-5", "50x50x5-mm-kosebent", "kosebent", "Köşebent", "kosebent", "50", "50", "5", "6000", "S275JR", "3.77", "METER", "6", "LOW_STOCK", false],
  ["20x3 mm Lama", "LM-20-3", "20x3-mm-lama", "lama", "Lama", "lama", "20", "3", "3", "6000", "S235JR", "0.47", "METER", "6", "IN_STOCK", false],
  ["50x5 mm Lama", "LM-50-5", "50x5-mm-lama", "lama", "Lama", "lama", "50", "5", "5", "6000", "S235JR", "1.96", "METER", "6", "IN_STOCK", false],
  ["100x100x8 mm Bağlantı Plakası", "PL-100-100-8", "100x100x8-mm-baglanti-plakasi", "lama", "Bağlantı plakası", "lama", "100", "100", "8", "100", "S235JR", "0.63", "PIECE", "1", "MADE_TO_ORDER", false],
  ["Kesime hazır lama", "LM-KESIM-KG", "kesime-hazir-lama", "lama", "Lama", "lama", "40", "4", "4", "", "S235JR", "1.26", "KILOGRAM", "25", "MADE_TO_ORDER", false],
].map((row) => ({
  name: row[0] as string,
  sku: row[1] as string,
  slug: row[2] as string,
  category: row[3] as string,
  profileType: row[4] as string,
  sectionShape: row[5] as string,
  width: row[6] as string,
  height: row[7] as string,
  thickness: row[8] as string,
  length: row[9] as string,
  grade: row[10] as string,
  weight: row[11] as string,
  unit: row[12] as Unit,
  min: row[13] as string,
  stock: row[14] as StockStatus,
  featured: Boolean(row[15]),
  surface: "Siyah",
}));

const legal = (title: string, body: string) =>
  `<p><strong>Bu metin örnektir.</strong> Yayına almadan önce bir hukukçu tarafından işletmeye göre düzenlenmelidir. Gerçek firma verisi girilmemiştir.</p>${body}`;

async function main() {
  await prisma.quoteRequestItem.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categorySpecField.deleteMany();
  await prisma.category.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.page.deleteMany();
  await prisma.seoMeta.deleteMany();
  await prisma.redirect.deleteMany();
  await prisma.siteSetting.deleteMany();

  const kutu = await prisma.category.create({
    data: {
      name: "Kutu profil",
      slug: "kutu-profil",
      description: "Kare ve dikdörtgen kutu profiller için örnek üst kategori.",
      published: true,
      sortOrder: 1,
      seoTitle: "Kutu profil",
      seoDescription: "Örnek kutu profil kategorisi.",
    },
  });
  const categories = {
    "kare-profil": await prisma.category.create({
      data: { name: "Kare profil", slug: "kare-profil", parentId: kutu.id, published: true, sortOrder: 1, description: "Kare kesitli örnek profiller." },
    }),
    "dikdortgen-profil": await prisma.category.create({
      data: { name: "Dikdörtgen profil", slug: "dikdortgen-profil", parentId: kutu.id, published: true, sortOrder: 2, description: "Dikdörtgen kesitli örnek profiller." },
    }),
    kosebent: await prisma.category.create({
      data: { name: "Köşebent", slug: "kosebent", published: true, sortOrder: 3, description: "Örnek köşebent kayıtları." },
    }),
    lama: await prisma.category.create({
      data: { name: "Lama", slug: "lama", published: true, sortOrder: 4, description: "Örnek lama ve plaka kayıtları." },
    }),
  };

  for (const category of Object.values(categories)) {
    await prisma.categorySpecField.createMany({
      data: [
        { categoryId: category.id, key: "surface", label: "Yüzey", filterable: true, sortOrder: 1 },
        { categoryId: category.id, key: "standard", label: "Standart", filterable: false, sortOrder: 2 },
      ],
    });
  }

  for (const product of products) {
    const category = categories[product.category as keyof typeof categories];
    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        categoryId: category.id,
        description: `${product.profileType}. ${sample}`,
        profileType: product.profileType,
        sectionShape: product.sectionShape,
        widthMm: product.width || null,
        heightMm: product.height || null,
        thicknessMm: product.thickness || null,
        lengthMm: product.length || null,
        materialGrade: product.grade,
        weightPerMeter: product.unit === "PIECE" ? null : product.weight,
        unit: product.unit,
        stockStatus: product.stock,
        minOrderQty: product.min,
        featured: product.featured ?? false,
        published: true,
        seoTitle: product.name,
        seoDescription: `${product.name} örnek katalog kaydı.`,
        specs: { surface: product.surface, standard: "Örnek standart" } satisfies Prisma.InputJsonValue,
      },
    });
  }

  const pages = [
    ["hakkimizda", "Hakkımızda", "Firma hakkında örnek metin.", true, true, 1, legal("Hakkımızda", "<p>Soyyiğit Mühendislik adı bu projede yer tutucu olarak kullanılmaktadır. Kuruluş yılı, çalışan sayısı, tesis veya referans eklenmemiştir.</p>")],
    ["kalite-ve-hizmetler", "Kalite ve hizmetler", "Belgeler yüklenmedi.", true, true, 2, legal("Kalite", "<p>Sertifika, test raporu veya kalite belgesi yüklenmediği için burada listelenmez. Teklif, ölçü teyidi ve sevkiyat koşulları sipariş öncesi netleştirilir.</p><ul><li>Ürün kodu ve ölçü teklif listesinde birlikte gider.</li><li>Birimler birbirine çevrilmez.</li></ul>")],
    ["sektorler", "Sektörler", "Örnek kullanım alanları.", true, true, 3, legal("Sektörler", "<p>Yapı, makine imalatı ve endüstriyel tesis başlıkları örnek kullanım alanıdır. Firmanın gerçekten çalıştığı sektörler panelden değiştirilmelidir.</p>")],
    ["sss", "Sıkça sorulan sorular", "Teklif süreci.", true, true, 4, "<p>Aşağıdaki yanıtlar sitenin teklif akışını anlatır.</p>"],
    ["iletisim", "İletişim", "İletişim formu onay ister.", true, true, 5, "<p>Telefon, adres ve çalışma saatleri aşağıdadır. İleti yalnızca açık onayla kaydedilir.</p>"],
    ["gizlilik-politikasi", "Gizlilik politikası", "Örnek gizlilik metni.", false, true, 6, legal("Gizlilik", "<p>Teklif kaydı tutulursa firma adı, isteğe bağlı iletişim bilgisi, ürün kodu ve miktar işlenir. WhatsApp taslağı bu veritabanına kendiliğinden yazılmaz.</p>")],
    ["kvkk", "KVKK aydınlatma metni", "Örnek aydınlatma metni.", false, true, 7, legal("KVKK", "<p>Veri sorumlusu bilgisi henüz girilmemiştir. İşlenen veriler teklif talebini değerlendirmekle sınırlı örnek kapsamda anlatılmıştır. Başvuru kanalı firma bilgileri eklendikten sonra yazılmalıdır.</p>")],
    ["cerez-politikasi", "Çerez politikası", "Zorunlu çerez açıklaması.", false, true, 8, legal("Çerez", "<p>Herkese açık sayfalarda reklam veya analiz çerezi kurulmaz. Yönetici oturumu için httpOnly oturum çerezi kullanılır. Çerez bildirimi tarayıcıda yerel olarak hatırlanır.</p>")],
    ["kullanim-kosullari", "Kullanım koşulları", "Örnek kullanım koşulları.", false, true, 9, legal("Koşullar", "<p>Katalog bir satış sözleşmesi değildir. Fiyat, stok ve termin teklif anında netleşir. Örnek ürünlerin ölçüleri bağlayıcı değildir.</p>")],
  ] as const;

  for (const [slug, title, excerpt, showInNav, showInFooter, sortOrder, content] of pages) {
    await prisma.page.create({
      data: { slug, title, excerpt, content, showInNav, showInFooter, sortOrder, published: true, seoTitle: title, seoDescription: excerpt },
    });
  }

  await prisma.faq.createMany({
    data: defaultFaqs.map((faq, index) => ({ ...faq, sortOrder: index, published: true })),
  });

  await prisma.siteSetting.createMany({
    data: [
      { key: "company", value: defaultCompany },
      { key: "social", value: defaultSocial },
      { key: "brand", value: defaultBrand },
      { key: "homepage", value: defaultHome },
    ],
  });

  await prisma.seoMeta.createMany({
    data: [
      { path: "/", title: "Demir profil kataloğu", description: "Örnek demir profil kataloğu ve WhatsApp teklif listesi." },
      { path: "/urunler", title: "Ürünler", description: "Örnek profil kataloğunda arama ve filtre." },
    ],
  });

  await prisma.redirect.create({
    data: { fromPath: "/eski-katalog", toPath: "/urunler", statusCode: 301, active: true },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "Seed başarısız");
    await prisma.$disconnect();
    process.exit(1);
  });
