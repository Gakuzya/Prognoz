# AdForecast — B2B SaaS предиктивной аналитики рекламных бюджетов

AdForecast — интеллектуальная платформа для моделирования и оптимизации рекламных бюджетов до их фактического расхода. Платформа помогает маркетологам, предпринимателям и сетевым брендам распределять средства между каналами с максимальным ожидаемым ROI на основе математической модели убывающей отдачи и юнит-экономики.

---

## 🚀 Ключевые возможности

- **Собственный ML-движок оптимизации**: алгоритм расчета точки насыщения каналов (закон убывающей отдачи), предотвращающий неэффективный перерасход.
- **Два режима симулятора**:
  - *Упрощенный (Simple Mode)*: быстрый расчет по сфере бизнеса и бюджету.
  - *Профессиональный (Pro Mode)*: тонкая настройка CAC, LTV, чека, маржинальности и конверсий.
- **AI Copilot (ИИ-помощник)**: интеллектуальные рекомендации по перераспределению бюджета с кнопкой применения в один клик.
- **Мультифилиальная архитектура**: привязка кампаний и прогнозов к конкретным филиалам/точкам с сегментацией аналитики.
- **Интерактивные графики и визуализация**: круговые и столбчатые диаграммы (Recharts) с детализацией по источникам.
- **Экспорт отчетов в PDF**: моментальная генерация презентационного отчета для руководства и инвесторов.
- **История прогнозов**: архив сохраненных симуляций с ключевыми метриками.

---

## 🛠 Технологический стек

### Frontend & Backend API
- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS, Lucide React
- **Visuals**: Recharts
- **PDF Generation**: html2canvas + jsPDF
- **Database ORM**: Prisma 6 (PostgreSQL / Supabase)
- **Authentication**: Supabase Auth

### AI Engine (Python Microservice)
- **Framework**: FastAPI, Uvicorn
- **Data & Math**: NumPy, Pandas, Scikit-learn
- **Algorithm**: Нелинейная модель убывающей отдачи + жадная итеративная оптимизация маржинального дохода

---

## 📦 Быстрый старт

### 1. Клонирование и настройка окружения
```bash
git clone <URL_РЕПОЗИТОРИЯ>
cd adforecast
cp .env.example .env
```
Заполните в `.env` реквизиты вашей базы данных Supabase:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `AI_ENGINE_URL="http://localhost:8000"`

### 2. Установка зависимостей и миграции базы данных
```bash
npm install
npx prisma generate
npx prisma db push
```

### 3. Запуск Python ML-микросервиса
```bash
cd ai-engine
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux / macOS:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

### 4. Запуск Next.js приложения
В отдельном терминале из корневой папки:
```bash
npm run dev
```
Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## 📄 Лицензия
Private / Proprietary.
