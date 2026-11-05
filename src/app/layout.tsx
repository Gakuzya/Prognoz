import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdForecast Sovereign AI — ИИ-прогнозирование и продвижение бизнес-проектов",
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
      className="dark h-full antialiased selection:bg-amber-500 selection:text-black"
    >
      <body className="min-h-full flex flex-col bg-[#070709] text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
