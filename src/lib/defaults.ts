export type CompanySettings = {
  name: string;
  legalName: string;
  demo: boolean;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  mapUrl: string;
  hours: string;
  footerNote: string;
};

export type SocialSettings = {
  linkedin: string;
  instagram: string;
  facebook: string;
  youtube: string;
};

export type BrandSettings = {
  accent: string;
  logoMediaId: string;
  faviconMediaId: string;
};

export type HomeLink = { label: string; href: string };
export type StatItem = { label: string; value: string };

export type HomeSettings = {
  hero: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    subtitle: string;
    imageMediaId: string;
    imageAlt: string;
    primaryCta: HomeLink;
    secondaryCta: HomeLink;
  };
  intro: { enabled: boolean; title: string; body: string };
  featured: { enabled: boolean; title: string; subtitle: string };
  stats: { enabled: boolean; title: string; items: StatItem[] };
  faq: { enabled: boolean; title: string; subtitle: string };
  contact: { enabled: boolean; title: string; subtitle: string };
  cta: {
    enabled: boolean;
    title: string;
    body: string;
  };
};

export const defaultCompany: CompanySettings = {
  name: "Soyyiğit Mühendislik",
  legalName: "",
  demo: true,
  phone: "0542 452 35 61",
  email: "",
  whatsapp: "+905424523561",
  address: "201. Sk., 54200 Erenler",
  city: "Sakarya",
  mapUrl:
    "https://www.google.com/maps/place/Demir+Profil+-+Soyyi%C4%9Fit+M%C3%BChendislik/@40.7399155,30.4112874,17z",
  hours: "Pazartesi–Cuma 08:00–18:30, Cumartesi 08:00–16:30, Pazar kapalı",
  footerNote: "Demir profil ve metal tedarik. Erenler, Sakarya.",
};

export const defaultSocial: SocialSettings = {
  linkedin: "",
  instagram: "",
  facebook: "",
  youtube: "",
};

export const defaultBrand: BrandSettings = {
  accent: "#a33b12",
  logoMediaId: "",
  faviconMediaId: "",
};

export const defaultHome: HomeSettings = {
  hero: {
    enabled: true,
    eyebrow: "Demir profil kataloğu",
    title: "Yapı profillerini ölçüye göre teklif listesine ekleyin",
    subtitle:
      "Kutu profil, kare profil ve diğer çelik profiller için ürün kodu, ölçü ve miktar seçerek tek bir WhatsApp teklif taslağı oluşturun. Bu alandaki metin örnek içeriktir.",
    imageMediaId: "",
    imageAlt: "",
    primaryCta: { label: "Ürünleri incele", href: "/urunler" },
    secondaryCta: { label: "Ürün sepeti", href: "/teklif" },
  },
  intro: {
    enabled: true,
    title: "Ne işe yarar?",
    body: "Bu site bir online ödeme mağazası değildir. Yayınlanan ürünler B2B katalog kaydıdır. Miktar ve birim seçilir, fiyat teklif üzerine belirlenir. Örnek metin, gerçek firma tanıtımı yerine geçmez.",
  },
  featured: {
    enabled: true,
    title: "Öne çıkan örnek ürünler",
    subtitle: "Yalnızca yayında ve öne çıkarılan kayıtlar listelenir.",
  },
  stats: {
    enabled: true,
    title: "",
    items: [
      { value: "12650", label: "Çeşit" },
      { value: "300", label: "Kategori" },
      { value: "500", label: "Mutlu Müşteri" },
      { value: "3", label: "Üstün Kalite" },
    ],
  },
  faq: {
    enabled: true,
    title: "Sıkça sorulan sorular",
    subtitle: "Teklif, birim ve kayıt süreci hakkında.",
  },
  contact: {
    enabled: true,
    title: "İletişim",
    subtitle: "Telefon, e-posta ve adres yönetim panelinden girildiğinde burada görünür.",
  },
  cta: {
    enabled: true,
    title: "Demirden Hırdavata, Güvenle.",
    body: "",
  },
};

export const defaultFaqs: { question: string; answer: string }[] = [
  {
    question: "Bu siteden ödeme yaparak sipariş verebilir miyim?",
    answer:
      "Hayır. Site, endüstriyel ürün kataloğu ve teklif listesidir. Ödeme alınmaz. Fiyat, teklif üzerine belirlenir.",
  },
  {
    question: "WhatsApp mesajı firmaya otomatik ulaşır mı?",
    answer:
      "Hayır. Buton yalnızca telefonunuzda veya tarayıcınızda bir WhatsApp taslağı açar. Mesaj, siz göndermeden firmaya ulaşmış sayılmaz.",
  },
  {
    question: "Talep neden ayrıca kaydedilsin diye soruluyor?",
    answer:
      "Kayıt isteğe bağlıdır. Firma adı ve seçilen ürünler veritabanına yazılmadan önce açık onayınız ve gizlilik metni istenir. Onay vermezseniz yalnızca WhatsApp taslağını kullanabilirsiniz.",
  },
  {
    question: "Metre ile kilogram neden toplanmıyor?",
    answer:
      "Her ürünün kendi satış birimi vardır. Adet, metre, kilogram ve ton birbirine çevrilmez. Karışık bir listede para tutarı da gösterilmez.",
  },
  {
    question: "Ürün ölçüleri kesin sipariş bilgisi midir?",
    answer:
      "Örnek katalogdaki ölçü ve ağırlıklar tanıtım amaçlıdır. Sipariş öncesi güncel ölçü, kalite ve termin bilgisi teyit edilmelidir.",
  },
];
