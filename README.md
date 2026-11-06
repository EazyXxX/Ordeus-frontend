# Ordeus Frontend

Интерфейс личного органайзера Ordeus: дневник с нейросетью, календарь и канбан. Сервер лежит в репозитории [Ordeus-backend](https://github.com/EazyXxX/Ordeus-backend).

## Стек

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, dnd-kit.

## Запуск

Нужен Node.js и запущенный сервер.

```bash
npm install
npm run dev
```

Приложение откроется на http://localhost:5173. Запросы к `/api` проксируются на `http://127.0.0.1:8080`. Другой адрес задаётся переменной `ORDEUS_API_URL`.

## Структура

```text
src/app/               оболочка приложения, боковая панель, темы
src/app/account/       вход, переключение аккаунтов и личный кабинет
src/components/        общие компоненты
src/lib/               API-клиент и общие помощники
src/modules/           разделы органайзера
src/modules/registry.ts  список разделов
```

## Новый раздел

Создайте страницу в `src/modules/<name>/` и добавьте запись в `src/modules/registry.ts`. Пункт меню и маршрут появятся сами.
