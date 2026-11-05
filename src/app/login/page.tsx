"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Compass,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { login, signup, type AuthState } from "./actions";

const initialState: AuthState = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(
    login,
    initialState
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signup,
    initialState
  );

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const pending = isLogin ? loginPending : signupPending;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#F7F6F2] bg-nordic-grid px-4 py-12 text-[#1C242B]">
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6460] hover:text-[#1F3A33] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>На Главную</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F3A33] hover:underline"
          >
            <span>Перейти в ИИ-Терминал (Демо)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-[#E2DDD3] bg-white p-7 nordic-shadow">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F3A33] text-white shadow-sm">
              <Compass className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold text-[#1C242B]">
              AdForecast Nordic AI
            </h1>
            <p className="mt-1 text-xs text-[#5C6460]">
              Авторизация в корпоративном кабинете аналитики
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-[#E2DDD3] bg-[#F2EFE9] p-1 text-xs font-bold">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 transition ${mode === m
                  ? "bg-[#1F3A33] text-white shadow-sm"
                  : "text-[#5C6460] hover:text-[#1C242B]"
                  }`}
              >
                {m === "login" ? "Вход в аккаунт" : "Регистрация"}
              </button>
            ))}
          </div>

          <form action={isLogin ? loginAction : signupAction} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#5C6460]">
                Корпоративный или личный Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F3A33]" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="founder@company.kz"
                  className="w-full rounded-xl border border-[#D8D2C5] bg-[#FBF9F5] py-2.5 pl-10 pr-3 text-sm text-[#1C242B] outline-none transition placeholder:text-[#7A827E] focus:border-[#1F3A33]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#5C6460]">
                Пароль
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1F3A33]" />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={isLogin ? undefined : 8}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#D8D2C5] bg-[#FBF9F5] py-2.5 pl-10 pr-3 text-sm text-[#1C242B] outline-none transition placeholder:text-[#7A827E] focus:border-[#1F3A33]"
                />
              </div>
            </label>

            {state.error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-[#E6CFC4] bg-[#FAF2EE] px-3 py-2.5 text-xs text-[#B85D3B]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B85D3B]" />
                {state.error}
              </p>
            )}
            {state.message && (
              <p className="flex items-start gap-2 rounded-xl border border-[#D5DFDA] bg-[#EAF0ED] px-3 py-2.5 text-xs text-[#1F3A33]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1F3A33]" />
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F3A33] py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#162B25] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Войти в систему" : "Создать бизнес-аккаунт"}
            </button>
          </form>

          <div className="mt-5 border-t border-[#ECE9E2] pt-4 text-center">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D5DFDA] bg-[#EAF0ED] py-2.5 text-xs font-bold text-[#1F3A33] transition hover:bg-[#DCE7E2]"
            >
              <span>Продолжить в Гостевом PRO-режиме без пароля</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
