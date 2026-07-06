# AEO.GEO — AI Ko'rinuvchanlik Platformasi
## Loyiha hujjati (v1.0)

---

## 1. Loyiha g'oyasi (Vision)

AEO.GEO — bu kompaniyalarning AI tizimlar (ChatGPT, Gemini, Claude, Perplexity, Copilot, DeepSeek va boshqalar) tomonidan **tushuniladigan, ishonchli va tavsiya qilinadigan** bo'lishiga yordam beruvchi global SaaS platforma.

Oddiy tilda aytganda: hozirgi kunda odamlar Google'da qidirish o'rniga tobora ko'proq ChatGPT yoki boshqa AI'lardan so'rayapti — "eng yaxshi ... qaysi kompaniya?", "menga ... tavsiya qil". AEO.GEO — kompaniyalarning shu AI javoblarida ko'rinishi, to'g'ri va foydali tarzda tilga olinishini ta'minlaydigan tizim.

**Asosiy g'oya (sening formulangda):** kompaniyalar o'zlarini AI'ga "reklama qilish" uchun tizimga pul to'laydi → tizim ularning ma'lumotini qabul qiladi, tozalaydi, tuzilmalashtiradi va AI tizimlarga "o'qitadi" (ya'ni AI qidiruv/javob berish jarayonida topiladigan va ishonchli manba sifatida ko'rinadigan qiladi) → natijada ham kompaniya foyda ko'radi (ko'proq mijoz), ham platforma foyda ko'radi (pul), ham foydalanuvchi foyda ko'radi (aniqroq AI javoblar). Hamma yutadi — shuning uchun "hamma foyda ololsin" modeli.

---

## 2. Muammo va yechim

**Muammo:**
- Kompaniyalarning katta qismi Google SEO'ga pul sarflaydi, lekin AI qidiruv (ChatGPT, Perplexity va h.k.) ularni umuman "bilmaydi" yoki noto'g'ri/eskirgan ma'lumot beradi.
- AI modellar ma'lumotni internetdagi tarqoq, tuzilmasiz matnlardan oladi — kichik va o'rta biznes uchun bu deyarli imkonsiz raqobat maydoni.
- Hech kim buni kichik/o'rta biznesga tushunarli, avtomatlashtirilgan tarzda taklif qilmayapti.

**Yechim (AEO.GEO):**
1. Kompaniya haqidagi barcha ma'lumotni yig'ish (sayt, hujjatlar, mahsulotlar) → **Bilim bazasi (Knowledge Base)**.
2. Ma'lumotni AI o'qiy oladigan formatga aylantirish (schema.org, JSON-LD, FAQ, embeddings) → **AI Optimizatsiya**.
3. AI tizimlarda kompaniya qanday ko'rinayotganini kuzatish → **AI Monitoring**.
4. Natijalarni tahlil qilib, doimiy yaxshilab borish → **AI Agent + Automation**.
5. Buning uchun kompaniya oyiga/yiliga pul to'laydi → **Subscription + qo'shimcha xizmatlar**.

---

## 3. Biznes va monetizatsiya modeli

### 3.1 Kim pul to'laydi va nima uchun
| Mijoz turi | To'lov sababi |
|---|---|
| Kichik biznes | Google'da emas, ChatGPT'da ham topilishni xohlaydi |
| Startap | Tez, arzon "AI ko'rinuvchanlik" kerak, o'z SEO jamoasi yo'q |
| Agentlik | Ko'plab mijozlarga xizmat ko'rsatish uchun (White Label) |
| E-commerce | Mahsulotlarini AI xarid tavsiyalarida ko'rsatish |
| Yirik kompaniya (Enterprise) | Brend obro'sini AI javoblarida nazorat qilish |

### 3.2 Daromad manbalari
1. **Obuna (Subscription)** — Starter / Pro / Business / Enterprise (oylik/yillik)
2. **Agentlik tarifi** — ko'p mijozni boshqarish uchun
3. **White Label** — boshqa agentliklar o'z brendi ostida sotadi
4. **API kirish** — dasturchilar/tashqi tizimlar uchun to'lovli API
5. **AI Konsalting** — qo'lda strategiya xizmati (yuqori narxli, kam sonli mijoz)
6. **Managed GEO Service** — "hammasini biz qilamiz" xizmati (eng qimmat paket)
7. *(Kelajakda)* **Pay-per-visibility** — AI javobida ko'rinish/citation soniga qarab qo'shimcha to'lov (usage-based add-on)

### 3.3 Pul aylanish sikli (asosiy g'oyangning texnik ifodasi)
```
Kompaniya ro'yxatdan o'tadi
   → Tarif tanlaydi va to'laydi (Stripe/Payme/Click)
   → Ma'lumotini yuklaydi (sayt, PDF, mahsulotlar ro'yxati)
   → Tizim ma'lumotni qayta ishlaydi (chunking → embedding → vector DB)
   → Tizim strukturaviy ma'lumot yaratadi (schema.org, FAQ, JSON-LD) va saytga/kanallarga joylaydi
   → AI Monitoring moduli ChatGPT/Gemini/Claude/Perplexity'dan real so'rovlar yuborib, kompaniya qanday tilga olinayotganini kuzatadi
   → Natija Dashboard'da ko'rsatiladi (Score'lar, tendensiyalar)
   → AI Agent zaif joylarni topib, yaxshilash tavsiyalarini/avtomatik tuzatishlarni beradi
   → Kompaniya har oy natijani ko'radi → obunani davom ettiradi (retention)
```

---

## 4. Foydalanuvchi rollari
| Rol | Vazifasi |
|---|---|
| Super Admin | Butun platformani boshqaradi (barcha tashkilotlar, tariflar) |
| Organization Owner | Kompaniya akkauntining egasi, to'lovlarni boshqaradi |
| Organization Admin | Kompaniya ichida foydalanuvchi/sozlamalarni boshqaradi |
| Marketing Manager | Strategiya va natijalarni kuzatadi |
| SEO/AEO Specialist | Optimizatsiya bo'yicha ishlaydi |
| Content Manager / Writer | Kontent yaratadi va tahrirlaydi |
| Developer | API, integratsiyalar bilan ishlaydi |
| Billing Manager | To'lovlarni boshqaradi |
| Viewer | Faqat ko'rish huquqi |

---

## 5. Asosiy modullar (batafsil)

### 5.1 Dashboard
Bitta ekranda kompaniyaning "AI salomatligi": AI Visibility Score, GEO Score, AEO Score, SEO Score, Trust Score, Citation Score, Brand Score + trafik va daromad grafiklari (soatlik → yillik).

### 5.2 Organization (Tashkilot boshqaruvi)
Kompaniya profili, jamoalar, ofislar, bo'limlar, xodimlar, tillar, bozorlar, brend materiallari — ko'p filialli/ko'p tilli kompaniyalar uchun.

### 5.3 Website Manager
Saytni skanerlash: sitemap, robots.txt, canonical teglar, meta ma'lumot, ichki/tashqi havolalar, buzilgan havolalar, tezlik va mobil moslik tahlili — bularning barchasi AI'ning saytni qanday "o'qiy olishiga" bevosita ta'sir qiladi.

### 5.4 Knowledge Base (Bilim bazasi) — platformaning yuragi
Turli manbalardan (sayt, PDF, DOCX, PPTX, XLSX, CSV, JSON, Notion, Google Docs, YouTube va h.k.) ma'lumot import qilinadi → chunking → embedding → vector storage (Qdrant) → tillarni aniqlash, kalit so'zlar, xulosalar, kategoriyalar avtomatik yaratiladi. Bu ma'lumot keyin AI'ga "o'qitish" uchun asos bo'ladi.

### 5.5 AI Optimization
Avtomatik ravishda FAQ, HowTo, Organization/Product/Review schema, breadcrumb, JSON-LD, OpenGraph teglar yaratadi va saytga joylashtiradi — bu AI qidiruv tizimlari uchun "tushunarli til".

### 5.6 AI Monitoring
ChatGPT, Gemini, Claude, Perplexity, Copilot, Google AI Overview, DeepSeek, Qwen, Mistral, Meta AI'dan real so'rovlar yuborib, kompaniya haqida qanday javob berilayotganini kuzatadi: tilga olinish soni, reyting, citation, ishonchlilik, sentiment, tendensiya.

### 5.7 Prompt Library
Brend, mahsulot, xizmat, sanoat, lokal qidiruv, taqqoslash, xarid niyati, FAQ bo'yicha test-promptlar generatsiya qiladi — monitoring uchun asos.

### 5.8 Competitor Intelligence
Raqobatchilar bilan brend, mahsulot, citation, ko'rinuvchanlik va AI javoblarini taqqoslash.

### 5.9 Citation Manager
Yangiliklar, Wikipedia, GitHub, LinkedIn, Crunchbase, bloglar, davlat saytlari, forumlar, akademik manbalarda kompaniyaning tilga olinishini kuzatish (bu manbalar AI'lar uchun "ishonch signali" hisoblanadi).

### 5.10 Content Studio
Blog, landing sahifa, FAQ, mahsulot tavsifi, hujjatlar, matbuot xabarlari, case study'larni AI'ga mos formatda generatsiya qilish.

### 5.11 AI Agent
Buyruqlar orqali ishlaydigan avtomat: "GEO'ni yaxshila", "FAQ yarat", "Schema yarat", "Bilim grafini yarat", "Raqobatchilarni tahlil qil", "SEO'ni tuzat" va h.k.

### 5.12 Analytics
AI qidiruv trafigi, organik, to'g'ridan-to'g'ri, referral, ijtimoiy tarmoq, email, pullik reklama, konversiya, daromad, CTR, bounce rate.

### 5.13 CRM
Lidlar, mijozlar, kontaktlar, kompaniyalar, bitimlar, vazifalar, izohlar — sotuv jamoasi uchun.

### 5.14 Automation
Rejalashtirilgan vazifalar: sayt skanerlash, AI skanerlash, raqobatchi skanerlash, yangiliklar skanerlash, citation skanerlash, schema validatsiyasi, buzilgan havolalar skanerlash, bilim bazasini sinxronlash.

### 5.15 Integratsiyalar
Google Analytics, Search Console, Cloudflare, WordPress, Shopify, WooCommerce, HubSpot, Salesforce, Slack, Telegram, Discord, GitHub, OpenAI, Anthropic, Google AI.

### 5.16 API
REST, GraphQL, Webhooks, SDK (Python, JS, Go, PHP).

### 5.17 Billing
Stripe, PayPal, Payme, Click, Wise, kuponlar, hisob-fakturalar, referral dasturi.

### 5.18 Security
OAuth, SSO, 2FA, RBAC, Audit Logs, API kalitlar, shifrlash, backup, IP whitelist.

### 5.19 Super Admin paneli
Barcha tashkilotlar, foydalanuvchilar, tariflar, daromad, feature flag'lar, tizim monitoringi, AI provayderlar, billing, loglar, bildirishnomalar, global sozlamalar.

---

## 6. Taklif etilgan texnologik stek

| Qatlam | Texnologiya |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python — FastAPI (asosiy API) + Django (admin/CRM qismi uchun, ixtiyoriy) |
| Ma'lumotlar bazasi | PostgreSQL |
| Kesh/Navbat | Redis, Celery, RabbitMQ |
| Qidiruv | Elasticsearch |
| Vector DB | Qdrant |
| Fayl saqlash | MinIO |
| Konteynerizatsiya | Docker, Kubernetes |
| AI provayderlar | OpenAI, Anthropic, Gemini, lokal LLM (Ollama) |
| Monitoring | Prometheus, Grafana, Sentry |

> **Eslatma:** Ace'ning MatrixOne va Sarhisob loyihalarida Django/DRF + React stek ishlatilgani hisobga olinsa, bu yerda FastAPI + Next.js taklif qilinmoqda, chunki: (1) FastAPI async ishlarni (AI so'rovlari, monitoring skanerlari) yaxshiroq boshqaradi, (2) Next.js SSR AEO/SEO uchun o'zi ham foydali. Xohlasang, Django/DRF + React'ga moslashtirib qayta tuzib beraman — bu sening tanish stacking.

---

## 7. Yo'l xaritasi (Roadmap)

### Faza 1 — MVP (fokus shu yerdan boshlanadi)
- Autentifikatsiya (JWT + Redis refresh token — MatrixOne'dagi tajribangga o'xshash)
- Tashkilotlar (ko'p tenant tuzilma)
- Dashboard (asosiy Score'lar)
- Website Import + crawl
- Knowledge Base (asosiy import + embedding)
- AI Visibility (bitta yoki ikkita AI provayder bilan monitoring, masalan ChatGPT + Claude)

### Faza 2
- Competitor Intelligence, AI Monitoring kengaytirilgan (barcha provayderlar), Content Studio, Automation

### Faza 3
- CRM, Marketplace, White Label, Enterprise funksiyalar

### Faza 4
- AI Agentlar, Global Bilim Grafi, Public API, Mobil ilovalar

---

## 8. Muvaffaqiyat mezonlari (KPI)
- Ro'yxatdan o'tgan kompaniyalar soni / oylik faol mijozlar (MAU)
- Obunani davom ettirish darajasi (retention, churn)
- O'rtacha mijoz qiymati (ARPU) va umumiy takroriy daromad (MRR)
- Har bir mijoz uchun AI Visibility Score'ning vaqt bo'yicha o'sishi (bu — mahsulotning haqiqiy qiymatini isbotlaydigan asosiy metrika)
- API va integratsiyalardan foydalanish darajasi

---

## 9. Asosiy risklar
| Risk | Ta'siri | Yumshatish |
|---|---|---|
| AI provayderlar (OpenAI, Google) API narxi/siyosati o'zgarishi | Xarajat oshishi | Ko'p provayderli arxitektura, lokal LLM fallback |
| "AI Score"ni obyektiv o'lchash qiyinligi | Ishonch yo'qolishi | Metodologiyani ochiq va shaffof qilish, uni doim yangilab borish |
| Raqobat (Profound, Athena, Otterly kabi xorijiy AEO/GEO startaplar) | Bozor ulushi | O'zbekiston/MDH bozoriga fokus, til/valyuta (Payme/Click) ustunligi |
| Ma'lumotlar xavfsizligi (mijoz biznes ma'lumotlari) | Ishonch yo'qotish, yuridik risk | RBAC, shifrlash, audit log — dastlabki fazadanoq |

---

## 10. Keyingi qadamlar (reja)

Bu hujjat — 1-bosqich. Endi navbat bilan quyidagilarni tayyorlaymiz:

1. ✅ **Hujjat (PRD)** — shu fayl
2. ⏭ **TZ (Texnik topshiriq)** — har bir modul uchun batafsil funksional talablar, ma'lumotlar bazasi sxemasi, API endpoint'lar ro'yxati (MVP/Faza 1 fokusida)
3. ⏭ **Claude uchun TZ** — yuqoridagi TZ'ni Claude Code orqali amalga oshirish uchun bosqichma-bosqich texnik reja (papka strukturasi, modellar, migratsiyalar tartibi)
4. ⏭ **Kerakli skill'lar** — Claude Code loyihani qurishdan oldin kerak bo'ladigan skill fayllarini (masalan: FastAPI loyiha strukturasi, Qdrant integratsiyasi, AI provayder so'rovlari, schema.org generatsiyasi kabi maxsus qo'llanmalar) tayyorlaymiz
5. ⏭ **Yakuniy prompt** — Claude Code'ga berish uchun tayyor, TZ va skill'larga asoslangan bitta aniq prompt

Davom etaylikmi — keyingi qadam sifatida **TZ (Texnik topshiriq)**ni MVP (Faza 1) uchun batafsil yozib beraymi?
