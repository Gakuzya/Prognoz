"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";

export type AuthState = { error?: string; message?: string };

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

/** Вход по email и паролю */
export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Введите email и пароль" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Неверный email или пароль" };

  // redirect() бросает исключение, поэтому вызываем его вне try/catch
  redirect("/dashboard");
}

/** Регистрация нового пользователя */
export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Введите email и пароль" };
  if (password.length < 8) {
    return { error: "Пароль должен содержать минимум 8 символов" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Если в Supabase включено подтверждение email, сессии пока нет
  if (!data.session) {
    return { message: "Мы отправили письмо для подтверждения. Проверьте почту." };
  }

  redirect("/dashboard");
}

/** Выход из аккаунта */
export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
