"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Crown,
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
    <main className="relative flex min-h-screen items-center justify-center bg-[#070709] bg-gold-grid px-4 py-12 text-zinc-100">
      <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-amber-300 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>На Главную</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline"
          >
            <span>Перейти в ИИ-Терминал (Демо)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-amber-500/30 bg-[#101016] p-7 shadow-2xl gold-glow">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/25">
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold text-white">
              AdForecast Sovereign AI
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Авторизация в корпоративном кабинете аналитики
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/50 p-1 text-xs font-bold">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 transition ${
                  mode === m
                    ? "bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Вход в аккаунт" : "Регистрация"}
              </button>
            ))}
          </div>

          <form action={isLogin ? loginAction : signupAction} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Корпоративный или личный Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="founder@company.kz"
                  className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Пароль
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
                <input
                  name="password"
                  type="password"
                  required
                  minLength={isLogin ? undefined : 8}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/15 bg-black/50 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400"
                />
              </div>
            </label>

            {state.error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                {state.error}
              </p>
            )}
            {state.message && (
              <p className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 py-3 text-xs font-extrabold uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Войти в систему" : "Создать бизнес-аккаунт"}
            </button>
          </form>

          {/* Мгновенный вход без ожидания */}
          <div className="mt-5 border-t border-white/10 pt-4 text-center">
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
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
