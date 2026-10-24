"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase";

export type BranchActionState = {
  error?: string;
  success?: boolean;
};

const branchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Название филиала должно содержать не менее 2 символов")
    .max(50, "Слишком длинное название"),
});

/**
 * Серверное действие для безопасного создания филиала
 */
export async function createBranch(
  _prev: BranchActionState,
  formData: FormData
): Promise<BranchActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Вы не авторизованы" };
  }

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  if (!company) {
    return { error: "Компания не найдена. Пройдите онбординг." };
  }

  const rawName = formData.get("name");
  const parsed = branchSchema.safeParse({ name: rawName });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.branch.create({
      data: {
        companyId: company.id,
        name: parsed.data.name,
      },
    });

    revalidatePath("/dashboard/branches");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    // Проверка уникальности имени филиала для этой компании
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { error: "Филиал с таким названием уже существует" };
    }
    console.error("Ошибка при создании филиала:", error);
    return { error: "Не удалось создать филиал" };
  }
}

/**
 * Серверное действие для удаления филиала
 */
export async function deleteBranch(branchId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  });

  if (!company) return { error: "Company not found" };

  await prisma.branch.deleteMany({
    where: {
      id: branchId,
      companyId: company.id,
    },
  });

  revalidatePath("/dashboard/branches");
  revalidatePath("/dashboard");
  return { success: true };
}
