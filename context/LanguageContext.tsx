import React, { createContext, useContext, ReactNode } from "react";

const T = {
  homeTab: "الرئيسية",
  searchTab: "استكشاف",
  storeTab: "المتجر",
  bookingsTab: "حجوزاتي",
  profileTab: "حسابي",
  myAccount: "حسابي",
  settings: "الإعدادات",
  darkMode: "الوضع الداكن",
  language: "اللغة",
  city: "المدينة",
  notifications: "الإشعارات",
  editProfile: "تعديل الملف الشخصي",
  paymentMethods: "طرق الدفع",
  privacySecurity: "الخصوصية والأمان",
  helpSupport: "المساعدة والدعم",
  aboutApp: "عن التطبيق",
  deleteAccount: "حذف الحساب",
  session: "الجلسة",
  logout: "تسجيل الخروج",
  createAccount: "إنشاء حساب",
  accountSection: "الحساب",
  dangerZone: "منطقة الخطر",
  guestMode: "وضع الضيف",
  guestBannerSub: "اضغط لإنشاء حساب والاستمتاع بكل الميزات",
  mosul: "الموصل",
  arabic: "العربية",
  english: "English",
  version: "الإصدار",
  footer: "Shoot'ha © 2026 – الموصل",
  player: "لاعب",
  owner: "صاحب ملعب",
  supervisor: "مشرف",
  games: "مباريات",
  upcoming: "قادمة",
  expenses: "مصاريف",
  noShow: "لا حضور",
  logoutConfirmTitle: "تسجيل الخروج",
  logoutConfirmMsg: "هل تريد تسجيل الخروج من حسابك؟",
  cancel: "تراجع",
  confirm: "تأكيد",
  on: "مفعّل",
  off: "مُعطّل",
  deleteConfirmTitle: "حذف الحساب",
  deleteConfirmMsg: "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء",
  enterPassword: "أدخل كلمة المرور للتأكيد",
  passwordPlaceholder: "كلمة المرور",
  deleting: "جاري الحذف...",
  delete: "حذف الحساب",
  selectLanguage: "اختر اللغة",
  save: "حفظ",
  saving: "جاري الحفظ...",
  editProfileTitle: "تعديل الملف الشخصي",
  fullName: "الاسم الكامل",
  dateOfBirth: "تاريخ الميلاد",
  profileImage: "صورة الملف الشخصي",
  changePhoto: "تغيير الصورة",
  phone: "رقم الهاتف",
  phoneLocked: "لتغيير الهاتف تواصل مع الدعم",
  sendOtp: "إرسال رمز التحقق",
  sendingOtp: "جاري الإرسال...",
  verifyPhone: "التحقق من الرقم",
  otpPlaceholder: "أدخل الرمز المكون من 6 أرقام",
  verifyOtp: "تحقق وحدّث",
  verifying: "جاري التحقق...",
  phoneUpdated: "تم تحديث رقم الهاتف",
  savedSuccess: "تم الحفظ بنجاح",
  supportTitle: "المساعدة والدعم",
  whatsapp: "تواصل عبر واتساب",
  email: "راسلنا عبر الإيميل",
  contactForm: "نموذج التواصل",
  subject: "الموضوع",
  message: "الرسالة",
  subjectPlaceholder: "موضوع رسالتك",
  messagePlaceholder: "اكتب رسالتك هنا...",
  send: "إرسال",
  sending: "جاري الإرسال...",
  messageSent: "تم إرسال رسالتك، سنتواصل معك قريباً",
  fieldRequired: "هذا الحقل مطلوب",
  back: "رجوع",
  bookNow: "احجز الآن",
  venues: "الملاعب",
  upcomingBookings: "القادمة",
  completedBookings: "المكتملة",
  cancelledBookings: "الملغاة",
  cancelBookingTitle: "إلغاء الحجز",
  cancelBookingMsg: "هل تريد إلغاء هذا الحجز؟",
  comingSoon: "قريباً...",
  storeDesc: "سيتم إطلاق متجر المنتجات الرياضية قريباً داخل تطبيق Shoot'ha",
  searchPlaceholder: "ابحث عن ملعب...",
  sortByRating: "الأعلى تقييمًا",
  sortLow: "الأقل سعرًا",
  sortHigh: "الأعلى سعرًا",
  available: "متاح الآن",
  allFilter: "الكل",
  noBookings: "لا توجد حجوزات",
  noBookingsDesc: "سيظهر هنا سجل حجوزاتك",
  forgotPassword: "نسيت كلمة المرور؟",
  resetPassword: "إعادة تعيين كلمة المرور",
  newPasswordPlaceholder: "كلمة مرور جديدة",
  confirmPasswordPlaceholder: "تأكيد كلمة المرور",
  passwordsDoNotMatch: "كلمتا المرور غير متطابقتين",
  passwordTooShort: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  passwordChanged: "تم تغيير كلمة المرور بنجاح",
  payment: "الدفع",
  aboutAppText: "تطبيق Shoot'ha هو منصة ذكية لحجز الملاعب الرياضية بسهولة وسرعة.\nيتيح التطبيق للاعبين البحث عن أقرب الملاعب، معرفة الأوقات المتاحة، والحجز مباشرة بدون اتصالات أو انتظار.\n\nكما يساعد أصحاب الملاعب على إدارة الحجوزات وتنظيم الأوقات ومعرفة الدخل والإشغال بشكل واضح ومنظم، ليجعل عملية الحجز أسهل للجميع ويوفر الوقت والجهد.\n\nهدفنا هو تبسيط تجربة حجز الملاعب وربط اللاعبين بالملاعب القريبة منهم بضغطة واحدة.",
} as const;

export type TranslationKeys = keyof typeof T;

export type Language = "ar";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKeys) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const staticValue: LanguageContextValue = {
  language: "ar",
  setLanguage: async () => {},
  t: (key) => T[key] ?? key,
  isRTL: true,
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageContext.Provider value={staticValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
