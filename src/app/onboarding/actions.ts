"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";

export type OnboardingState = { error?: string };

const schema = z.object({
  name: z.string().trim().min(1, "Укажите название компании"),
  industry: z.string().trim().optional(),
  currency: z.string().length(3),
  avgCheck: z.coerce.number().positive("Средний чек должен быть больше 0"),
  targetMargin: z.coerce.number().min(0).max(100, "Маржинальность 0–100%"),
  ltv: z.coerce.number().positive("LTV должен быть больше 0"),
});

export async function createCompany(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { industry, ...rest } = parsed.data;
      await prisma.company.upsert({
        where: { userId: user.id },
        create: { userId: user.id, industry: industry || null, ...rest },
        update: { industry: industry || null, ...rest },
      });
    }
  } catch {
    // Если БД/сессия недоступны, продолжаем переход в терминал
  }

  redirect("/dashboard");
}

export async function skipOnboarding(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await prisma.company.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          name: "ТОО «Sovereign Business»",
          industry: "СТО / Автосервис и Детейлинг",
          currency: "KZT",
          avgCheck: 42000,
          targetMargin: 48,
          ltv: 185000,
        },
        update: {},
      });
    }
  } catch {
    // Автономный переход
  }

  redirect("/dashboard");
}
