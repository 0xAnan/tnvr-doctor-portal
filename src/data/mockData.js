const months = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const years = [2024, 2025, 2026, 2027];

export const monthYearOptions = years.flatMap(year =>
  months.map(month => `${month} ${year}`)
);

export const initialCommittees = [
  {
    id: "cm-001",
    title: "لجنة حي المعادي - الحملة الأولى",
    location: "القاهرة - حي المعادي (شارع 9 والزهراء)",
    date: "2026-07-28",
    monthYear: "يوليو 2026",
    malesCount: 22,
    femalesCount: 20,
    doctors: ["د. محمد عبد الرحمن", "د. سارة محمود"],
    notes: "تم تعقيم وتطعيم جميع الكلاب ضد رابيز (السعار) ووضع العلامات الأذنية (Ear-tipping). الحالة الصحية العامة ممتازة.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1000&q=80",
        caption: "فحص بيطري قبل التعقيم والتطعيم",
        date: "2026-07-28"
      },
      {
        url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1000&q=80",
        caption: "التعقيم والترقيم بالأذن (Ear Tip)",
        date: "2026-07-28"
      },
      {
        url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=1000&q=80",
        caption: "الإفاقة والتأكد من السلامة قبل الإطلاق",
        date: "2026-07-28"
      }
    ]
  },
  {
    id: "cm-002",
    title: "لجنة حي التجمع الخامس - المجاورة الثالثة",
    location: "القاهرة الجديدة - التجمع الخامس (حول النادي)",
    date: "2026-07-25",
    monthYear: "يوليو 2026",
    malesCount: 16,
    femalesCount: 14,
    doctors: ["د. نادية مصطفى", "د. خالد عمر"],
    notes: "حملة مكثفة لتعقيم وتطعيم كلاب الشوارع بالحي السكني بالكامل مع وضع أطوق عاكسة.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1000&q=80",
        caption: "الفحص السريري والتطعيم",
        date: "2026-07-25"
      },
      {
        url: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=1000&q=80",
        caption: "تجهيز الأدوات والتعقيم الجراحي",
        date: "2026-07-25"
      }
    ]
  },
  {
    id: "cm-003",
    title: "لجنة حي الشيخ زايد - الحي الثامن",
    location: "الجيزة - مدينة الشيخ زايد (الحديقة المركزية)",
    date: "2025-11-15",
    monthYear: "نوفمبر 2025",
    malesCount: 13,
    femalesCount: 12,
    doctors: ["د. عمرو إبراهيم", "د. هدى الحسيني"],
    notes: "تمت المعاينة والتعقيم والتحصين بالتعاون مع مديرية الطب البيطري بالجيزة.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1000&q=80",
        caption: "متابعة الكلاب بعد التعقيم والتطعيم",
        date: "2025-11-15"
      }
    ]
  },
  {
    id: "cm-004",
    title: "لجنة حي مصر الجديدة - الكوربة",
    location: "القاهرة - مصر الجديدة (حديقة الميريلاند)",
    date: "2026-07-31",
    monthYear: "يوليو 2026",
    malesCount: 10,
    femalesCount: 8,
    doctors: ["د. ياسمين الشريف", "د. طارق سعيد"],
    notes: "تم الانتهاء من 18 كلب معقم ومحصن.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1000&q=80",
        caption: "الفحص الميداني والترقيم",
        date: "2026-07-31"
      }
    ]
  }
];

export const sampleImageOptions = [
  { url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1000&q=80", caption: "فحص طبي ميداني" },
  { url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1000&q=80", caption: "ترقيم الأذن والتعقيم" },
  { url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=1000&q=80", caption: "إعادة الإطلاق بعد الفحص" },
  { url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1000&q=80", caption: "تطعيم مصل السعار" }
];
