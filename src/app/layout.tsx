import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdForecast Nordic AI — Платформа прогнозирования и продвижения бизнес-проектов",
  description:
    "Интеллектуальная B2B-платформа для расчета юнит-экономики, предиктивного распределения рекламного бюджета, построения воронки продаж и полного цикла запуска бизнеса с ИИ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className="h-full antialiased selection:bg-[#1F3A33] selection:text-white"
    >
      <body className="min-h-full flex flex-col bg-[#F7F6F2] text-[#1C242B] font-sans">
        {children}
      </body>
    </html>
  );
}
