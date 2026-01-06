# راهنمای تنظیم Environment Variables

برای اینکه پروژه هم روی سیستم شما (development) و هم روی سرور (production) کار کند، باید فایل‌های زیر را ایجاد کنید:

## فایل‌های مورد نیاز

### 1. `.env.development` (برای development)
در پوشه `daroghe-client` این فایل را ایجاد کنید:

```env
# Development environment variables
VITE_API_BASE_URL=http://localhost:8090
```

### 2. `.env.production` (برای production)
در پوشه `daroghe-client` این فایل را ایجاد کنید:

```env
# Production environment variables
VITE_API_BASE_URL=/api
```

## نحوه استفاده

- **Development**: وقتی `npm run dev` را اجرا می‌کنید، خودکار از `.env.development` استفاده می‌شود
- **Production**: وقتی `npm run build` را اجرا می‌کنید، خودکار از `.env.production` استفاده می‌شود

## نکات مهم

- این فایل‌ها در `.gitignore` هستند و commit نمی‌شوند
- می‌توانید فایل `.env.local` هم ایجاد کنید که override می‌کند (اختیاری)

