export type Locale = "en" | "kn";

export const DEFAULT_LOCALE: Locale = "kn";

type StringTable = Record<string, { en: string; kn: string }>;

export const STRINGS: StringTable = {
  appName:                { en: "Namma Anganwadi",                       kn: "ನಮ್ಮ ಅಂಗನವಾಡಿ" },
  tagline:                { en: "Photo + GPS. 90 seconds. Named CDPO.",  kn: "ಫೋಟೋ + ಜಿಪಿಎಸ್. 90 ಸೆಕೆಂಡ್. ಸಿಡಿಪಿಒ ಹೆಸರು." },
  reportCta:              { en: "Report this centre",                    kn: "ಈ ಕೇಂದ್ರವನ್ನು ವರದಿ ಮಾಡಿ" },
  findCentre:             { en: "Find my anganwadi",                     kn: "ನನ್ನ ಅಂಗನವಾಡಿ ಹುಡುಕಿ" },
  useMyLocation:          { en: "Use my location",                       kn: "ನನ್ನ ಸ್ಥಳವನ್ನು ಬಳಸಿ" },
  pickCategory:           { en: "What's wrong here?",                    kn: "ಇಲ್ಲಿ ಏನು ತಪ್ಪಾಗಿದೆ?" },
  takePhoto:              { en: "Take photo",                            kn: "ಫೋಟೋ ತೆಗೆದುಕೊಳ್ಳಿ" },
  submit:                 { en: "Submit",                                kn: "ಸಲ್ಲಿಸಿ" },
  submitting:             { en: "Submitting…",                           kn: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ…" },
  submittedTitle:         { en: "Filed",                                 kn: "ಸಲ್ಲಿಸಲಾಗಿದೆ" },
  submittedBody:          { en: "Filed against CDPO {cdpo} and MLA {mla}.", kn: "ಸಿಡಿಪಿಒ {cdpo} ಮತ್ತು ಶಾಸಕ {mla} ವಿರುದ್ಧ ಸಲ್ಲಿಸಲಾಗಿದೆ." },
  noFaces:                { en: "No photos with children's faces, please.", kn: "ಮಕ್ಕಳ ಮುಖಗಳಿರುವ ಫೋಟೋಗಳನ್ನು ತೆಗೆಯಬೇಡಿ." },
  workerIsNotTheTarget:   { en: "We never name the anganwadi worker. Pressure goes to CDPOs and contractors.", kn: "ನಾವು ಅಂಗನವಾಡಿ ಕಾರ್ಯಕರ್ತೆಯನ್ನು ಎಂದಿಗೂ ಹೆಸರಿಸುವುದಿಲ್ಲ. ಒತ್ತಡ ಸಿಡಿಪಿಒ ಮತ್ತು ಗುತ್ತಿಗೆದಾರರ ಮೇಲೆ." },
  leaderboard:            { en: "Leaderboard",                           kn: "ನಾಯಕಫಲಕ" },
  data:                   { en: "Data",                                  kn: "ಡೇಟಾ" },
  ngo:                    { en: "NGO partners",                         kn: "ಎನ್‌ಜಿಒ ಪಾಲುದಾರರು" },
};

export function t(key: keyof typeof STRINGS, locale: Locale = DEFAULT_LOCALE, vars?: Record<string, string>): string {
  const tpl = STRINGS[key]?.[locale] ?? key;
  if (!vars) return tpl;
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), tpl);
}
