# Soyyiğit Mühendislik — kurumsal site ve teklif kataloğu

Demir profil ve çelik yapı ürünleri için kurumsal site, ürün kataloğu, WhatsApp teklif listesi ve yönetim paneli. Bu depodaki firma adı, iletişim alanları ve ürün kayıtları **örnektir**. Gerçek müşteri, sertifika, fiyat veya yorum verisi yoktur. Yayına almadan önce yönetim panelinden kendi bilgilerinizi girin ve örnek ürünleri doğrulayın veya kaldırın.

SEO alanlarını kaydetmek arama sıralamasını garanti etmez. Sıralama; içerik, rekabet ve sitenin dışındaki etkenlere de bağlıdır.

## Gerekenler

- Node.js 22 veya üzeri
- PostgreSQL 16
- Üretimde HTTPS sağlayan bir ters vekil (örnek: `deploy/nginx.conf.example`)

## Ortam değişkenleri

```bash
cp .env.example .env
```

`.env` depoya eklenmez. En az şunları doldurun:

- `DATABASE_URL`
- `AUTH_SECRET` — en az 32 karakter. Üretin: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
- `NEXT_PUBLIC_SITE_URL` — canonical adres ve sitemap bunu kullanır. Yerelde `http://localhost:3000`, üretimde `https://alanadiniz`.

İsteğe bağlı:

- `STORAGE_DRIVER=local` görselleri `public/uploads` altına yazar. `s3` için `.env.example` içindeki `S3_*` alanlarının hepsi dolu olmalıdır.
- `SMTP_*` tanımlı değilse parola sıfırlama e-postası gönderilmez. Bunun yerine `npm run admin:reset-password` kullanın.
- `TRUST_PROXY=true` yalnızca güvendiğiniz ters vekilin arkasında açın. Giriş denemesi limiti, bu kapalıyken yönlendirilen IP başlığına güvenmez.

## Veritabanı

Docker kullanıyorsanız:

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
```

Docker yoksa aynı PostgreSQL 16 örneğini kendiniz kurun, `.env` içindeki `DATABASE_URL` ile eşleştirin ve aynı iki komutu çalıştırın. `5432` portu bu bilgisayarda açılamıyorsa PostgreSQL’i başka bir porta alın ve `DATABASE_URL` içindeki portu aynı yapın.

`db:migrate` mevcut migration dosyalarını uygular. Şema değişince geliştirmede `npm run db:dev` kullanın.

`db:seed` katalog, sayfa ve ayarları örnek veriyle yeniden yazar. Yönetici hesaplarını silmez. Üretimde, gerçek içeriği girdikten sonra yeniden çalıştırmayın.

## İlk yönetici

Herkese açık kayıt yoktur. Varsayılan parola da yoktur. Hesabı sunucuda oluşturun:

```bash
# Windows PowerShell
$env:ADMIN_EMAIL="yonetici@example.com"
$env:ADMIN_NAME="Yönetici"
$env:ADMIN_PASSWORD="en-az-12-karakter-Buyuk1"
npm run admin:create
```

Parola en az 12 karakter olmalı; büyük harf, küçük harf ve rakam içermelidir. Yaygın parolalar reddedilir. Aynı e-posta varsa komut hesabı ezmez.

Parola sıfırlama:

```bash
$env:ADMIN_EMAIL="yonetici@example.com"
$env:ADMIN_PASSWORD="yeni-parola-Buyuk1"
npm run admin:reset-password
```

SMTP tanımlıysa giriş ekranındaki “parolamı unuttum” akışı e-posta gönderir. Tanımlı değilse bu komutu kullanın.

Yönetici paneli: `/admin`. Editör rolü ürün, kategori, sayfa, SSS, medya, teklif, anasayfa ve SEO yönetir. Ayarlar, kullanıcılar, yönlendirmeler ve denetim kaydı yalnızca yöneticiye açıktır. Yetki kontrolü sunucuda da yapılır.

## Geliştirme

```bash
npm install
npm run db:generate
npm run dev
```

Site `http://localhost:3000` adresindedir.

## Üretim

```bash
npm run build
npm run start
```

`next build` standalone çıktı üretir. `Dockerfile` bu çıktıyı Node 22 imajında çalıştırır. Konteyner içinde migration çalıştırmak için tam bağımlılık gerekir; migration’ı imajın dışında, veritabanına erişen bir adımda `npx prisma migrate deploy` ile uygulayın.

Ters vekil örneği `deploy/nginx.conf.example` dosyasındadır. Sertifika satırlarını Let’s Encrypt yollarıyla açın, `server_name` değerini kendi alan adınız yapın ve `NEXT_PUBLIC_SITE_URL` ile aynı `https` adresini kullanın. `TRUST_PROXY=true` bu vekilin arkasında açılabilir. Yükleme gövdesi 8 MB ile sınırlıdır; uygulama görselleri 5 MB ve jpeg, png, webp, avif ile sınırlar.

Sayfalar istek anında veritabanından okunur. Yönetim panelinden yapılan değişiklik bir sonraki istekte görünür. Arama motoru önbelleği ve tarayıcı önbelleği ayrıdır.

### Yedek

```bash
pg_dump "$DATABASE_URL" -Fc -f yedek.dump
pg_restore --clean --if-exists -d "$DATABASE_URL" yedek.dump
```

`public/uploads` klasörünü de yedekleyin. S3 kullanıyorsanız kova yaşam döngüsü ve sürümlemeyi depolama sağlayıcınızda açın.

### Günlükler

Uygulama hataları JSON satırı olarak standart çıktıya yazılır. Ayrıntılı yığın izi ziyaretçiye gösterilmez. Üretimde süreç yöneticinizin (systemd, Docker) bu çıktıyı toplamasını sağlayın. Ayrı bir hata izleme servisi bu depoya bağlı değildir; isterseniz süreç çıktısını kendi aracınıza yönlendirin.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm run start` | Üretim derlemesi ve sunucu |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Birim testleri |
| `npm run test:integration` | PostgreSQL entegrasyon testleri |
| `npm run test:e2e` | Playwright |
| `npm run check` | Lint, tip denetimi ve birim testleri |

Entegrasyon testleri çalışan bir veritabanı ve `DATABASE_URL` ister. Playwright, Chromium kurulu olmalı ve veritabanında örnek katalog bulunmalıdır (`npm run db:seed`). Tarayıcılar C: sürücüsünü doldurmasın diye `PLAYWRIGHT_BROWSERS_PATH` ile başka bir klasöre kurulabilir.

## Bilinçli sınırlar

- WhatsApp numarası, telefon, e-posta ve adres boş bırakılmıştır. Numara panelden uluslararası biçimde (`+90...`) kaydedilmeden WhatsApp düğmesi açılmaz.
- WhatsApp düğmesi yalnızca mesaj taslağı açar. Göndermek siparişin firmaya ulaştığı anlamına gelmez. Teklif kaydı, ziyaretçi onay kutusunu işaretlerse ayrıca veritabanına yazılır.
- Ürün fiyatı tutulmaz. Listede “Fiyat teklif üzerine belirlenir” yazar. Adet, metre, kilogram ve ton birbirine çevrilmez.
- İstatistik bölümü kapalıdır. Yalnızca ölçülmüş sayıları panelden girin.
- Ziyaret sayısı ölçülmez. Panel bunu ölçülmüş gibi göstermez.
- Kırık bağlantı kontrolü kayıtlı sayfa HTML’indeki iç bağlantıları tarar; tüm siteyi gezinen bir tarayıcı değildir.
- Giriş denemesi limiti veritabanındadır. Teklif ve iletişim formu limiti süreç belleğindedir; sunucu yeniden başlayınca sıfırlanır.
- Yasal sayfalar taslaktır. Yayından önce hukukçunuza kontrol ettirin.
- Core Web Vitals bu kurulumda ölçülmedi. İyi sonuç hedeflenir; ölçülmeden başarılı sayılmaz.
