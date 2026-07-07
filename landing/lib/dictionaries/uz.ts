import type { Dict } from "../i18n";

/** O'zbekcha (lotin) versiya. */
export const uz: Dict = {
  meta: {
    title: "AEO.GEO - AI-assistentlarga tushunarli bo'ling",
    description:
      "Biznesingizni ChatGPT, Gemini, Claude, Perplexity va yangi avlod AI qidiruvi uchun optimallashtiring. AI javoblari brendingiz haqida nima deyishini skanerlang, strukturalang va kuzating.",
  },
  nav: {
    links: [
      { label: "Qanday ishlaydi", href: "#how-it-works" },
      { label: "Demo", href: "#demo" },
      { label: "Narxlar", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
    cta: "Erta kirish",
  },
  hero: {
    eyebrow: "AI javob tizimlari uchun optimizatsiya",
    h1pre: "Brendingiz AI tomonidan",
    h1accent: "tushunilishga loyiq.",
    sub: "Biznesingizni ChatGPT, Gemini, Claude, Perplexity va yangi avlod AI qidiruvi uchun optimallashtiring - javob tizimlari sizni to'g'ri tasvirlab, tez-tez tavsiya qilsin.",
    seeHow: "Qanday ishlaydi",
    terminal: [
      "Sayt tahlil qilinmoqda...",
      "Bilim grafi qurilmoqda...",
      "FAQ va Schema yaratilmoqda...",
      "AI javoblari kuzatilmoqda...",
      "Tayyor. Brendingiz AI'ga ko'rinadi.",
    ],
    brandLabel: "Sizning brendingiz",
    graphAria:
      "AEO.GEO brendingizni AI javob tizimlariga bog'laydi: ChatGPT, Gemini, Claude, Perplexity va Copilot.",
  },
  email: {
    placeholder: "siz@kompaniya.uz",
    button: "Erta kirish",
    joining: "Yuborilmoqda…",
    success: "Ro'yxatdasiz - tez orada bog'lanamiz.",
    invalid: "To'g'ri email kiriting.",
    generic: "Xatolik yuz berdi. Qayta urinib ko'ring.",
    srLabel: "Ish email manzili",
  },
  platforms: { label: "Kuzatamiz va optimallashtiramiz:" },
  story: {
    eyebrow: "Ko'rinmaslikdan tavsiyagacha",
    h2pre: "Brendingiz qanday qilib",
    h2accent: "AI'ga ko'rinadi",
    h2post: "",
    side: "Olti qadam: AI e'tibor bermaydigan saytdan AI tavsiya qiladigan brendgacha.",
    steps: [
      {
        title: "Saytingiz bor.",
        body: "Yillar davomida yozilgan sahifalar, mahsulotlar va tajriba - odamlar va Google uchun.",
        tone: "problem",
      },
      {
        title: "AI uni tushunmaydi.",
        body: "Javob tizimlari tarqoq, strukturasiz matnni ko'radi. Shuning uchun taxmin qiladi - yoki sizni o'tkazib yuboradi.",
        tone: "problem",
      },
      {
        title: "Biz uni skanerlaymiz.",
        body: "AEO.GEO saytingiz va hujjatlaringizni import qiladi: sahifalar, PDF, mahsulot ma'lumotlari.",
        tone: "solution",
      },
      {
        title: "Bilim grafingizni quramiz.",
        body: "Kontentingiz toza, strukturali, mashina o'qiy oladigan bilimga aylanadi.",
        tone: "solution",
      },
      {
        title: "Hammasini optimallashtiramiz.",
        body: "FAQ, schema.org razmetkasi, struktura - AI haqiqatan o'qiydigan til.",
        tone: "solution",
      },
      {
        title: "AI brendingizni tavsiya qila boshlaydi.",
        body: "Sizni to'g'ri tasvirlashadi, manba sifatida keltirishadi va javoblarda taklif qilishadi.",
        tone: "solution",
      },
    ],
  },
  demo: {
    eyebrow: "Farqni ko'ring",
    h2pre: "Brendingiz",
    h2accent: "strukturalangan",
    h2post: "bo'lsa, AI nima deydi",
    sub: "Odamlar AI-assistentlardan haqiqatan so'raydigan savolni tanlang - AI'ga ko'rinadigan brend javobda qanday chiqishini ko'ring.",
    questionLabel: "Savol",
    presetLabel: "Tayyor savollar",
    assistant: "AI-assistent",
    badge: "✓ AEO.GEO bilan AI'ga ko'rinadi",
    tag: "Interaktiv demo",
    disclaimer:
      "Bu - to'qima brend bilan skriptlangan misol, jonli AI javobi emas. AEO.GEO real assistentlar sizning brendingiz haqida nima deyishini kuzatadi.",
    presets: [
      {
        chip: "Eng yaxshi logistika kompaniyasi",
        question:
          "Mintaqaviy yetkazib berish uchun eng yaxshi logistika kompaniyasi qaysi?",
        answer: [
          "Real vaqtda kuzatuv bilan mintaqaviy yetkazib berish uchun kuchli variant - ",
          "NorthTrail Logistics",
          ": ular qamrov, narx va SLA ma'lumotlarini AI tekshira oladigan tarzda aniq e'lon qiladi, mijoz sharhlarida esa o'z vaqtida yetkazish doim tilga olinadi.",
        ] as [string, string, string],
      },
      {
        chip: "Toshkentdagi eng yaxshi stomatologiya",
        question: "Toshkentda qaysi stomatologiya klinikasini tavsiya qilasiz?",
        answer: [
          "Strukturalangan xizmat va narx ma'lumotlariga ko'ra, ",
          "Denta Lux Tashkent",
          " ajralib turadi: shaffof xizmat sahifalari, tasdiqlangan bemor FAQ'lari hamda barcha manbalarda yangilangan kontakt va yozilish ma'lumotlari.",
        ] as [string, string, string],
      },
      {
        chip: "Qurilish uchun eng yaxshi CRM",
        question: "Qurilish biznesi uchun qaysi CRM yaxshi?",
        answer: [
          "Qurilish jamoalari uchun tez-tez tavsiya qilinadigan tanlov - ",
          "BuildFlow CRM",
          ": sayti loyiha oqimlari, integratsiyalar va tarif rejalarini aniq tasvirlaydi, shuning uchun AI-assistentlar uning imkoniyatlarini to'g'ri xulosalay oladi.",
        ] as [string, string, string],
      },
    ],
  },
  features: {
    eyebrow: "Vositalar",
    h2pre: "Brendingiz",
    h2accent: "mashina tushunadigan",
    h2post: "bo'lishi uchun kerak bo'lgan hammasi",
    side: "Bitta quvur - xom saytdan o'lchanadigan AI-ko'rinuvchanlikkacha.",
    items: [
      {
        icon: "crawl",
        title: "Skanerlash va import",
        body: "Saytingizni ulang, hujjatlarni yuklang - sahifalar, PDF va mahsulot ma'lumotlari yagona bilim manbasiga aylanadi.",
      },
      {
        icon: "kb",
        title: "Bilim bazasi",
        body: "Kontent tozalanadi, bo'laklarga bo'linadi va strukturali, qidiriladigan bilim grafiga aylantiriladi.",
      },
      {
        icon: "schema",
        title: "Schema generatsiyasi",
        body: "FAQ, Organization va mahsulot schema.org razmetkasi real kontentingizdan yaratiladi - hech narsa to'qilmaydi.",
      },
      {
        icon: "monitor",
        title: "AI monitoring",
        body: "ChatGPT, Gemini, Claude va boshqalarga real savollar - eslatmalar, ohang va iqtiboslar kuzatiladi.",
      },
      {
        icon: "scores",
        title: "Ko'rinuvchanlik ballari",
        body: "Oltita shaffof 0–100 ball AI brendingizni qanday ko'rishini - va nima uchunligini aniq ko'rsatadi.",
      },
      {
        icon: "recs",
        title: "AI tavsiyalari",
        body: "Ballaringizni oshiradigan ustuvor tuzatishlar: yetishmayotgan javoblar, zaif struktura, iqtibossiz da'volar.",
      },
    ],
  },
  dash: {
    eyebrow: "Dashboard",
    h2pre: "AI'dagi mavjudligingiz,",
    h2accent: "o'lchangan",
    h2post: "",
    sub: "Real skanerlashlar yangilab turadigan oltita shaffof ball - javob tizimlari sizni qanday ko'rishini doim bilasiz.",
    scoreLabels: ["AI ko'rinuvchanlik", "GEO", "AEO", "SEO", "Ishonch", "Iqtibos"],
    trendLabel: "AI ko'rinuvchanlik · so'nggi 12 skan",
    trendUp: "▲ o'sishda",
    trendAria:
      "Trend grafigi namunasi: AI ko'rinuvchanlik bali 12 skan davomida 22 dan 81 gacha o'sgan.",
  },
  facts: {
    items: [
      { value: 10, suffix: "", label: "AI platforma kuzatiladi" },
      { value: 6, suffix: "", label: "schema turi generatsiya qilinadi" },
      { value: 15, suffix: "+", label: "import formati qo'llab-quvvatlanadi" },
      { value: 6, suffix: "", label: "ko'rinuvchanlik bali kuzatiladi" },
    ],
  },
  pricing: {
    eyebrow: "Erta kirish narxlari",
    h2pre: "Asoschi a'zolar uchun",
    h2accent: "narxlar",
    h2post: "",
    sub: "Ommaviy ishga tushirishdan oldin erta kirish narxlarini qulflab oling. Istalgan payt bekor qilish mumkin.",
    popular: "Eng ommabop",
    cta: "Erta kirish",
    note: "Erta kirish narxlari taxminiy bo'lib, ommaviy ishga tushirishgacha o'zgarishi mumkin.",
    plans: [
      {
        name: "Starter",
        price: "$29",
        cadence: "/oy",
        featured: false,
        features: [
          "1 tashkilot, 1 domen",
          "Oylik AI-ko'rinuvchanlik skanlari",
          "100 sahifagacha bilim bazasi",
          "FAQ va Organization schema",
        ],
      },
      {
        name: "Pro",
        price: "$79",
        cadence: "/oy",
        featured: true,
        features: [
          "3 domen, 5 jamoa a'zosi",
          "Barcha tizimlar bo'ylab haftalik skanlar",
          "To'liq schema to'plami + avto-yangilanish",
          "Ball tarixi va trend analitikasi",
          "Ustuvor qo'llab-quvvatlash",
        ],
      },
      {
        name: "Business",
        price: "$199",
        cadence: "/oy",
        featured: false,
        features: [
          "10 domen, cheksiz jamoa",
          "Kunlik skanlar + ogohlantirishlar",
          "API kirish",
          "Raqobatchilar snapshotlari",
          "Onboarding yordami",
        ],
      },
      {
        name: "Enterprise",
        price: "Custom",
        cadence: "",
        featured: false,
        features: [
          "Cheksiz domen va workspace",
          "Maxsus skan chastotasi va SLA",
          "White-label va agentlik vositalari",
          "Shaxsiy muvaffaqiyat menejeri",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "Savollar",
    h2pre: "Ko'p so'raladigan",
    h2accent: "savollar",
    h2post: "",
    items: [
      {
        q: "AEO/GEO nima?",
        a: "AEO (Answer Engine Optimization) va GEO (Generative Engine Optimization) - biznesingizni ChatGPT, Gemini, Claude va Perplexity kabi AI-assistentlar topadigan, to'g'ri tasvirlaydigan va tavsiya qiladigan qilish amaliyoti - xuddi SEO buni Google uchun qilgani kabi.",
      },
      {
        q: "SEO'dan farqi nimada?",
        a: "SEO sahifalarni qidiruv natijalaridagi o'rin uchun optimallashtiradi. AEO/GEO esa bilimlaringizni AI yaratadigan javoblar uchun optimallashtiradi: strukturalangan ma'lumotlar, mashina o'qiy oladigan FAQ'lar va javob tizimlari iqtibos keltira oladigan izchil faktlar. Yaxshi SEO yordam beradi, lekin AI javoblariga reyting algoritmidan ko'ra ko'proq struktura kerak.",
      },
      {
        q: "Qaysi AI platformalarni kuzatasiz?",
        a: "AEO.GEO asosiy AI javob tizimlarini kuzatish uchun qurilgan: ChatGPT, Gemini, Claude, Perplexity, Copilot va Google AI Overview - ro'yxat kengayib bormoqda. Monitoring har bir platformaga real savollar yuboradi va brendingiz javoblarda qanday ko'rinishini tahlil qiladi.",
      },
      {
        q: "AI ko'rinuvchanlikni qanday o'lchaysiz?",
        a: "Biz AI platformalarga muntazam ravishda real mijoz savollarini yuboramiz va javoblarni tahlil qilamiz: siz tilga olinganmisiz, qanday ohangda va qaysi manbalar iqtibos qilingan. Natijalar oltita shaffof 0–100 ballga jamlanadi - AI ko'rinuvchanlik, GEO, AEO, SEO, Ishonch va Iqtibos - formulalarini tekshirishingiz mumkin.",
      },
      {
        q: "Texnik bilim kerakmi?",
        a: "Yo'q. Siz saytingizni ulaysiz va hujjatlarni yuklaysiz; skanerlash, bilimlarni strukturalash, schema generatsiyasi va monitoringni AEO.GEO o'z zimmasiga oladi. Tayyor razmetka nusxalab qo'yiladigan snippetlar bilan beriladi, agentlik tariflarida esa hammasini bizga topshirsangiz bo'ladi.",
      },
      {
        q: "Qachon ishga tushadi?",
        a: "AEO.GEO faol ishlab chiqilmoqda, erta kirish dasturi davom etmoqda. Kutish ro'yxatiga qo'shiling - joylar ochilishi bilan taklif qilamiz; erta a'zolar asoschi narxlarini oladi.",
      },
    ],
  },
  finalCta: {
    h2pre: "AI javob berganda",
    h2accent: "ko'rinib turing.",
    sub: "Erta kirish ro'yxatiga qo'shiling - asoschi a'zolar onboardingni birinchi bo'lib oladi va boshlang'ich narxlarni saqlab qoladi.",
  },
  footer: {
    tagline: "Brendingizni AI-assistentlarga tushunarli qiling.",
    columns: [
      {
        title: "Mahsulot",
        links: [
          { label: "Qanday ishlaydi", href: "#how-it-works" },
          { label: "Demo", href: "#demo" },
          { label: "Narxlar", href: "#pricing" },
          { label: "FAQ", href: "#faq" },
        ],
      },
      {
        title: "Kompaniya",
        links: [
          { label: "Biz haqimizda", href: "#" },
          { label: "Blog", href: "#" },
          { label: "Karyera", href: "#" },
          { label: "Aloqa", href: "#" },
        ],
      },
      {
        title: "Huquqiy",
        links: [
          { label: "Maxfiylik", href: "#" },
          { label: "Shartlar", href: "#" },
        ],
      },
    ],
    copyright: "© 2026 AEO.GEO. Barcha huquqlar himoyalangan.",
    built: "Odamlar ham, mashinalar ham o'qishi uchun qurilgan.",
  },
};
