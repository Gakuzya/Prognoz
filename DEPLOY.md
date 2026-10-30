# 🚀 Инструкция по деплою AdForecast (Docker / Render / Linux Server)

Проект полностью контейнеризирован в единый легковесный Docker-образ, содержащий:
1. **Next.js 16 (React 19)** — фронтенд, API-роуты, дашборд и авторизацию.
2. **Python FastAPI MMM Engine** — микросервис предиктивной аналитики на базе машинного обучения.

---

## Вариант 1. Запуск на Render через GitHub (Бесплатно / Рекомендуется)

Render собирает Dockerfile прямо из вашего репозитория GitHub и запускает его в облаке.

### Шаг 1. Отправьте код в GitHub
Если изменения еще не запушены:
```bash
git add .
git commit -m "feat: docker containerization for Render and Linux VPS"
git push origin main
```
> *Если `git push` запрашивает пароль, используйте свой GitHub Personal Access Token (PAT).*

### Шаг 2. Создайте сервис на Render
1. Зайдите на [render.com](https://render.com) и войдите через GitHub.
2. Нажмите синюю кнопку **«New +»** ➔ **«Web Service»**.
3. Выберите репозиторий `Prognoz` (или `Gakuzya/Prognoz`).
4. В настройках:
   - **Name**: `adforecast` (или любое другое имя)
   - **Language / Runtime**: `Docker`
   - **Region**: `Frankfurt (EU Central)`
   - **Instance Type**: `Free`
5. В секции **«Environment Variables»** (переменные окружения) добавьте ключи:
   - `DATABASE_URL` — строка подключения к Supabase PostgreSQL (pgbouncer)
   - `DIRECT_URL` — прямое подключение к Supabase (порт 5432)
   - `NEXT_PUBLIC_SUPABASE_URL` — URL вашего проекта Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — анонимный ключ Supabase
   - `GROQ_API_KEY` — серверный API-ключ Groq (`gsk_...`)
   - `AI_ENGINE_URL` — `http://127.0.0.1:8000` (FastAPI работает локально внутри контейнера)
6. Нажмите **«Deploy Web Service»**.

Render автоматически соберет контейнер, запустит микросервис и выдаст вам публичный HTTPS-домен (например, `https://adforecast.onrender.com`).

---

## Вариант 2. Запуск на Linux сервере (Ubuntu / Debian VPS)

### Быстрый запуск через Docker Compose:

1. **Клонируйте репозиторий на сервер**:
   ```bash
   git clone https://github.com/Gakuzya/Prognoz.git
   cd Prognoz
   ```

2. **Создайте файл `.env`** с вашими переменными:
   ```bash
   nano .env
   ```
   Вставьте:
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
   GROQ_API_KEY="gsk_..."
   AI_ENGINE_URL="http://127.0.0.1:8000"
   ```

3. **Соберите и запустите контейнер**:
   ```bash
   docker compose up -d --build
   ```

4. **Проверьте логи**:
   ```bash
   docker compose logs -f
   ```

Приложение будет доступно по адресу `http://<IP_СЕРВЕРА>:3000`.

---

## Полезные команды

* **Остановить контейнер**: `docker compose down`
* **Перезапустить**: `docker compose restart`
* **Проверить статус**: `docker compose ps`
