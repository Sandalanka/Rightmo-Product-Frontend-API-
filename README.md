# Rightmo Product Frontend

A product management dashboard built with Next.js. Users sign up or log in, then browse, search, filter, add, edit and delete products, manage product images, and write reviews. Pages are server-rendered (SSR) and the layout works on phones, tablets and desktops.

It talks to the [Rightmo Product Backend API](https://github.com/Sandalanka/Rightmo-Product-Backend-API) (Laravel).

## Features

- **Authentication**: register, log in and log out with a Bearer token. `/dashboard` pages are protected, and an expired session sends you back to the login page.
- **Product listing**: search, filter by category and price range, sort (newest, price, top rated, name) and paginate. Filters are kept in the URL, so links can be shared and the back button works.
- **Product management**: add, edit and delete products, and upload, replace or remove up to 10 images per product.
- **Product details**: image gallery, price, category, average rating, and reviews that can be added, edited and deleted.
- **Categories page**: click a category to see its products.
- **Server-side rendering**: each page loads its data on the server, so it arrives already filled in.
- **Feedback**: success messages (toasts) after each action, and loading spinners on buttons, images and pages.

## Tech stack

| Area | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [TypeScript 5](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) (utility classes) |
| API calls | [Axios](https://axios-http.com) |
| Data fetching and caching | [TanStack Query 5](https://tanstack.com/query) (React Query) |
| Route protection | Next.js Proxy (`src/proxy.ts`) |
| Testing | [Vitest 4](https://vitest.dev), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro), [jsdom](https://github.com/jsdom/jsdom), [axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter) |
| Linting | ESLint 9 with `eslint-config-next` |

## Prerequisites

- **Node.js 20** or newer, with npm
- **The backend API running**. By default the frontend expects it at `http://localhost:8089/api/v1`. To start it with Docker:

  ```bash
  git clone git@github.com:Sandalanka/Rightmo-Product-Backend-API.git
  cd Rightmo-Product-Backend-API
  docker compose up -d
  ```

  See the backend's own README for database setup and seeding.

## Getting started

1. **Clone the repository and install the packages**

   ```bash
   git clone git@github.com:Sandalanka/Rightmo-Product-Frontend-API-.git
   cd Rightmo-Product-Frontend-API-
   npm install
   ```

2. **Create your environment file**

   ```bash
   cp .env.example .env.local
   ```

   The defaults work when the backend runs locally on port 8089. See [Environment variables](#environment-variables) to change them.

3. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You'll be sent to the login page. Register an account to get started. If port 3000 is busy, Next.js uses the next free port and prints it in the terminal.

### Production build

```bash
npm run build
npm start
```

## Environment variables

Set these in `.env.local`. Variables starting with `NEXT_PUBLIC_` are built into the app, so restart the dev server or rebuild after changing them.

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8089/api/v1` | Backend API address, including the version prefix |
| `NEXT_PUBLIC_API_TIMEOUT` | `15000` | Request timeout in milliseconds |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | `Rs.` | Symbol shown before prices |
| `NEXT_PUBLIC_TIME_ZONE` | `Asia/Colombo` | Time zone used to show dates |
| `API_INTERNAL_URL` | *(uses `NEXT_PUBLIC_API_BASE_URL`)* | Optional, server-only. The address the Next.js server uses to reach the API, for example `http://nginx/api/v1` when both run in Docker |

## Testing

The tests use Vitest and React Testing Library. API calls are faked with `axios-mock-adapter`, so **the backend does not need to be running**.

```bash
npm test             # run all tests once
npm run test:watch   # re-run tests when files change
npm run typecheck    # check TypeScript types
npm run lint         # run ESLint
```

To run one test file or the tests matching a name:

```bash
npx vitest run tests/product-form.test.tsx
npx vitest run -t "deletes the product"
```

The tests are in [`tests/`](tests/) and cover:

- **API and auth**: API client, auth service, session storage, login and register forms, logout, route protection
- **Products**: services, filters, validation, listing, add and edit form, detail page, image management
- **Reviews**: add, edit and delete
- **UI**: buttons, inputs, toasts, spinners, the dashboard layout and search bar
- **Server-side rendering**: data loading on the server, the 404 page, and expired sessions

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── app/                  # Pages (App Router)
│   ├── (auth)/           # /login and /register
│   └── dashboard/        # Products, product detail/add/edit, categories
├── components/
│   ├── auth/             # Login, register and logout
│   ├── dashboard/        # Header, sidebar, search bar
│   ├── products/         # Product listing, cards, filters, form, gallery, images
│   ├── ratings/          # Review form and list
│   └── ui/               # Reusable UI: Button, Input, Toast, Spinner, Drawer, Pagination…
├── config/env.ts         # Environment variables
├── context/              # AuthContext (useAuth)
├── hooks/                # useForm, product and review queries
├── lib/
│   ├── api/              # Axios client, endpoints, error handling
│   ├── auth/             # Token and session storage
│   ├── server/           # Server-side API access for SSR
│   └── validation/       # Form validation
├── services/             # Auth, product, category and review API calls
├── types/                # TypeScript types
└── proxy.ts              # Protects /dashboard and redirects signed-in users
tests/                    # Vitest tests
```

## Notes

- `package-lock.json` is not committed, so use `npm install` rather than `npm ci`.
- Product images are loaded from the backend's `/storage` path. If an image file is missing on the backend, a placeholder is shown instead.
