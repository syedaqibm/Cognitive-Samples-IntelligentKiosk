export type CategorySlug =
  | "no-toilet"
  | "no-water"
  | "no-electricity"
  | "centre-closed"
  | "no-meal"
  | "no-thr"
  | "no-medicine"
  | "broken-building";

export interface Category {
  slug: CategorySlug;
  emoji: string;
  labelEn: string;
  labelKn: string;
  blamesContractor: boolean;
}

export const CATEGORIES: Category[] = [
  { slug: "no-toilet",        emoji: "🚽", labelEn: "No toilet",            labelKn: "ಶೌಚಾಲಯವಿಲ್ಲ",         blamesContractor: false },
  { slug: "no-water",         emoji: "🚰", labelEn: "No drinking water",    labelKn: "ಕುಡಿಯುವ ನೀರಿಲ್ಲ",      blamesContractor: false },
  { slug: "no-electricity",   emoji: "💡", labelEn: "No electricity",       labelKn: "ವಿದ್ಯುತ್ ಇಲ್ಲ",         blamesContractor: false },
  { slug: "centre-closed",    emoji: "🔒", labelEn: "Centre closed in hours", labelKn: "ಕೇಂದ್ರ ಮುಚ್ಚಿದೆ",      blamesContractor: false },
  { slug: "no-meal",          emoji: "🍲", labelEn: "No meal today",        labelKn: "ಇಂದು ಆಹಾರವಿಲ್ಲ",        blamesContractor: true  },
  { slug: "no-thr",           emoji: "📦", labelEn: "No take-home ration",  labelKn: "ಮನೆಗೆ ತೆಗೆದುಕೊಳ್ಳುವ ಆಹಾರವಿಲ್ಲ", blamesContractor: true  },
  { slug: "no-medicine",      emoji: "💊", labelEn: "No medicine / scale",  labelKn: "ಔಷಧಿ / ತೂಕ ಮಾಪಕವಿಲ್ಲ",  blamesContractor: false },
  { slug: "broken-building",  emoji: "🧱", labelEn: "Building broken",      labelKn: "ಕಟ್ಟಡ ಒಡೆದಿದೆ",        blamesContractor: false },
];

export function getCategory(slug: CategorySlug): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
