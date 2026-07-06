# AEO.GEO — Claude Code uchun Texnik Topshiriq (TZ)
## MVP / Faza 1

> **Stack qarori:** Ace'ning MatrixOne va Sarhisob loyihalaridagi tajribasiga mos ravishda **Django + Django REST Framework (backend)** va **React (frontend)** tanlandi. AI provayder chaqiruvlari va monitoring skanerlari uchun **Celery** ishlatiladi (async/tashqi API chaqiruvlar ko'p bo'lgani uchun).

---

## 1. Loyiha maqsadi (Claude uchun qisqa kontekst)

AEO.GEO — kompaniyalarning AI qidiruv tizimlarida (ChatGPT, Claude, Gemini, Perplexity) qanday ko'rinayotganini kuzatuvchi va yaxshilovchi multi-tenant SaaS. MVP quyidagi zanjirni ishlashi kerak:

```
Ro'yxatdan o'tish → Tashkilot yaratish → Sayt/hujjat yuklash →
Bilim bazasiga ishlov berish (chunking+embedding) →
AI provayderlarga test-promptlar yuborish →
Natijalarni tahlil qilib Score hisoblash → Dashboard'da ko'rsatish
```

---

## 2. Repo strukturasi

```
aeo-geo/
├── backend/
│   ├── config/                  # Django settings, celery.py, urls.py
│   ├── apps/
│   │   ├── accounts/             # User, auth, RBAC rollari
│   │   ├── organizations/        # Tenant/Organization modeli
│   │   ├── website_manager/      # Crawl, sitemap, texnik SEO tekshiruv
│   │   ├── knowledge_base/       # Import, chunking, embedding, Qdrant
│   │   ├── ai_optimization/      # Schema.org / JSON-LD generatsiya
│   │   ├── ai_monitoring/        # Prompt Library + AI provider skanerlari
│   │   ├── dashboard/            # Score hisoblash va agregatsiya
│   │   └── billing/              # Stripe/Payme/Click integratsiya
│   ├── requirements.txt
│   └── manage.py
├── frontend/                     # React + TypeScript + Tailwind
│   └── src/
│       ├── pages/ (yoki app/ agar Next.js tanlansa)
│       ├── components/
│       └── api/                  # DRF bilan bog'lanish uchun client
├── .claude/
│   └── skills/                   # Quyida tayyorlangan skill'lar shu yerga tushadi
└── docker-compose.yml            # Postgres, Redis, Qdrant, backend, frontend
```

---

## 3. Ma'lumotlar bazasi modellari (MVP uchun minimal, lekin yetarli)

### `accounts`
- `User` (Django AbstractUser kengaytirilgan): email, role (enum: super_admin, org_owner, org_admin, marketing_manager, aeo_specialist, content_manager, writer, developer, billing_manager, viewer)
- `Membership`: user → organization (many-to-many, orqali role saqlanadi — bitta user bir nechta tashkilotda turli rolda bo'lishi mumkin)

### `organizations`
- `Organization`: name, slug, plan (starter/pro/business/enterprise), industry, primary_language, created_at
- `Domain`: organization → FK, url, is_primary

### `website_manager`
- `CrawlResult`: domain → FK, crawled_at, status, meta jsonfield (title, meta_description, canonical, broken_links[], performance_score)

### `knowledge_base`
- `Document`: organization → FK, source_type (website/pdf/docx/...), title, raw_text, status (pending/processing/done/failed), created_at
- `Chunk`: document → FK, content, embedding_vector_id (Qdrant point ID), token_count, language

### `ai_optimization`
- `SchemaMarkup`: organization → FK, schema_type (FAQ/Product/Organization/Breadcrumb), json_ld (JSONField), applied_to_url

### `ai_monitoring`
- `Prompt`: organization → FK, text, category (brand/product/comparison/local/faq...)
- `ScanResult`: prompt → FK, provider (openai/anthropic/gemini/perplexity), response_text, is_mentioned (bool), sentiment (positive/neutral/negative), citation_sources (JSONField), scanned_at

### `dashboard`
- `ScoreSnapshot`: organization → FK, date, ai_visibility_score, geo_score, aeo_score, seo_score, trust_score, citation_score (0-100 oralig'ida)

### `billing`
- `Subscription`: organization → FK, plan, provider (stripe/payme/click), status, current_period_end

---

## 4. API endpoint'lar (DRF, MVP)

```
POST   /api/auth/register/
POST   /api/auth/login/                 → JWT (access + refresh, Redis'da saqlanadi)
POST   /api/auth/refresh/

GET    /api/organizations/
POST   /api/organizations/
GET    /api/organizations/{id}/members/
POST   /api/organizations/{id}/invite/

POST   /api/organizations/{id}/domains/
POST   /api/organizations/{id}/crawl/         → Celery task ishga tushiradi

POST   /api/organizations/{id}/documents/     → fayl yuklash (multipart)
GET    /api/organizations/{id}/documents/{doc_id}/status/

GET    /api/organizations/{id}/schema-markup/
POST   /api/organizations/{id}/schema-markup/generate/

GET    /api/organizations/{id}/prompts/
POST   /api/organizations/{id}/prompts/generate/   → AI Agent orqali avtomatik prompt yaratish
POST   /api/organizations/{id}/scan/               → barcha promptlarni barcha provayderlarga yuboradi (Celery)
GET    /api/organizations/{id}/scan-results/

GET    /api/organizations/{id}/dashboard/          → oxirgi ScoreSnapshot + trend
```

---

## 5. Qurish tartibi (Claude Code shu tartibda ishlashi kerak)

| # | Bosqich | Tegishli skill |
|---|---|---|
| 1 | Django loyiha skeleti, `accounts` va `organizations` app'lari, JWT auth, RBAC middleware | `django-multitenant-saas` |
| 2 | `website_manager` — oddiy crawl (requests + BeautifulSoup), sitemap/robots tekshiruvi | — (standart Django/Celery) |
| 3 | `knowledge_base` — fayl yuklash, matn ajratish (PDF/DOCX/sayt), chunking, embedding, Qdrant'ga yozish | `vector-knowledge-base` |
| 4 | `ai_optimization` — FAQ/Product/Organization uchun JSON-LD generatsiya (Bilim bazasidagi ma'lumotdan) | `schema-org-generator` |
| 5 | `ai_monitoring` — Prompt Library + ko'p provayderga (OpenAI/Anthropic/Gemini) so'rov yuborish, javoblarni tahlil qilish (mention/sentiment/citation) | `ai-provider-gateway` + `ai-visibility-scanner` |
| 6 | `dashboard` — Score'larni ScanResult va CrawlResult asosida hisoblash, `ScoreSnapshot` yaratuvchi Celery cron | `ai-visibility-scanner` |
| 7 | React frontend — login, tashkilot yaratish, hujjat yuklash, Dashboard sahifasi (Score kartalar + oddiy grafik) | — (frontend-design skill mavjud bo'lsa undan foydalanish) |
| 8 | Docker Compose bilan hammasini birlashtirish (Postgres, Redis, Qdrant, backend, frontend) | — |

**Muhim qoida:** Har bir bosqich alohida, ishlaydigan holatda tugallanishi kerak (runnable). Keyingi bosqichga o'tishdan oldin avvalgisi test qilinadi.

---

## 6. Muhit o'zgaruvchilari (.env)

```
DJANGO_SECRET_KEY=
POSTGRES_URL=
REDIS_URL=
QDRANT_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
STRIPE_SECRET_KEY=       # yoki PAYME_/CLICK_ MDH bozori uchun
```

---

## 7. MVP doirasidan tashqarida qoladigan narsalar (keyingi fazalar uchun)

CRM, Competitor Intelligence, Content Studio, White Label, Marketplace, to'liq Automation (barcha scheduled job'lar), Super Admin paneli — bularning barchasi Faza 2-4'da qo'shiladi, MVP'ga kiritilmaydi.

---

## 8. Claude Code'ga beriladigan yakuniy prompt (quyidagi bo'limda)

Quyida shu TZ'ga asoslangan, `.claude/skills/` papkasidagi skill'larni ishlatadigan tayyor prompt keltirilgan.

---

## 9. Claude Code'ga beriladigan yakuniy prompt (copy-paste qilib ishlatish uchun)

> Loyiha papkasi ichida `.claude/skills/` papkasi allaqachon 5 ta skill bilan tayyor bo'lishi kerak: `django-multitenant-saas`, `vector-knowledge-base`, `schema-org-generator`, `ai-provider-gateway`, `ai-visibility-scanner`. Shu papkani repo root'ga qo'yib, keyin Claude Code'ni shu papkada ishga tushirib, quyidagi promptni ber:

```
Men AEO.GEO nomli AI Ko'rinuvchanlik SaaS platformasining MVP (Faza 1) qismini quryapman.
To'liq texnik topshiriq shu repo root'idagi AEO_GEO_TZ_Claude.md faylida yozilgan — birinchi
navbatda shu faylni to'liq o'qib chiq.

Stack: Django + Django REST Framework (backend), React + TypeScript (frontend),
PostgreSQL, Redis, Celery, Qdrant (vector DB). Docker Compose orqali ishga tushadi.

.claude/skills/ papkasida loyihaga xos 5 ta skill bor — mos vazifaga kelganda ularni albatta
o'qib, ko'rsatmalariga amal qil:
- django-multitenant-saas → auth, tashkilotlar, rollar (RBAC) uchun
- vector-knowledge-base → hujjat import, chunking, embedding, Qdrant uchun
- schema-org-generator → FAQ/Product/Organization JSON-LD generatsiyasi uchun
- ai-provider-gateway → OpenAI/Anthropic/Gemini'ga so'rov yuborish uchun
- ai-visibility-scanner → skanerlash va Score hisoblash uchun

Ishni AEO_GEO_TZ_Claude.md ning 5-bo'limidagi "Qurish tartibi" jadvaliga qat'iy amal qilib,
bosqichma-bosqich bajar:
1. Repo strukturasini yarat (backend/, frontend/, docker-compose.yml)
2. accounts + organizations app'lari, JWT auth, RBAC — ishlab, test qilib bo'lgandan keyin
   keyingi bosqichga o't
3. website_manager — oddiy crawl
4. knowledge_base — fayl yuklash va Qdrant'ga embedding
5. ai_optimization — schema.org generatsiya
6. ai_monitoring + dashboard — skanerlash va Score hisoblash
7. React frontend — login, tashkilot yaratish, hujjat yuklash, Dashboard sahifasi
8. Hammasini Docker Compose bilan birlashtir

Har bir bosqichdan keyin to'xta, nima qilinganini qisqacha tushuntir va ishga tushirib
ko'rsat (runnable holatda), keyin mendan tasdiq so'ra va keyingi bosqichga o't.

Migratsiyalarni, `requirements.txt`/`package.json`ni va `.env.example` faylini ham yarat.
API kalitlarini hech qachon kodga hardcode qilma — faqat environment variable orqali.
```

---

## 10. Amalga oshirish tartibi (Ace uchun qisqa xulosa)

1. Yuqoridagi `.claude/skills/` papkasini repo root'ingga (`aeo-geo/.claude/skills/`) ko'chir.
2. `AEO_GEO_TZ_Claude.md` faylini ham repo root'ga qo'y.
3. Claude Code'ni shu papkada ishga tushir, 9-bo'limdagi promptni ber.
4. Har bosqichda tekshirib, keyingisiga ruxsat ber — bir zarbada hammasini qurishga urinma, MVP ham bir nechta kunlik ish.
