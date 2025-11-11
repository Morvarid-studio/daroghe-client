# Sneat Vue Front-End

این پروژه نسخه‌ی مستقل فرانت‌اند (Vue 3 + Vite + Vuetify) از قالب Sneat است. بک‌اند لاراول از پروژه حذف شده و می‌توانید فرانت‌اند را مستقیماً روی هر API خارجی اجرا کنید.

## پیش‌نیازها

- Node.js 18 به بالا
- pnpm یا npm (نمونه دستورات با npm نوشته شده است)

## راه‌اندازی سریع

```sh
npm install
npm run dev
```

سرور توسعه روی پورت 5173 بالا می‌آید. برای اجرا روی شبکه محلی:

```sh
npm run dev -- --host
```

## تنظیم API بک‌اند

متغیر `VITE_API_BASE_URL` را در `.env` یا `.env.local` تعریف کنید تا درخواست‌ها به سرور شما ارسال شوند:

```
VITE_API_BASE_URL=https://your-api.example.com
```

در صورت عدم تعریف، مقدار پیش‌فرض `/api` است.

## بیلد نهایی

```sh
npm run build
```

خروجی در پوشه‌ی `dist` قرار می‌گیرد و می‌تواند روی هر وب‌سروری سرو شود.

## lint و تایپ

```sh
npm run lint
npm run typecheck
```
