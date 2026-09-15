# 🎓 Rewaa (منصة رواء التعليمية)

A modern, high-performance, bilingual (Arabic & English) Learning Management System (LMS) and Educational Platform frontend built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

---

## 🌟 Overview

**Rewaa** is an educational platform designed for teachers, academies, and students. It offers a role-aware user experience with separate, dedicated interfaces for administrative management (teachers/assistants) and learning (students), coupled with public report verification and full RTL (Right-to-Left) localization.

### 👥 User Roles & Spaces

- **Instructor & Assistant Dashboard (`/dashboard`)**: Full-featured administrative suite to manage courses, lessons, question banks, exams, student enrollments, financial billing, and team permissions.
- **Student Portal (`/student-dashboard`)**: Distraction-free learning portal for students to browse enrolled courses, watch video lessons, take timed exams, track academic progress, and manage their profile.
- **Public Verification & Legal Pages**: Public student report cards (`/student-report/:studentId`), terms of service, and privacy policies.

---

## 🛠️ Tech Stack

| Category                | Technologies                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**           | [Next.js 16](https://nextjs.org/) (App Router, Server Components, Standalone Output)                                                      |
| **Library**             | [React 19](https://react.dev/) + React Compiler                                                                                           |
| **Styling**             | [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)                   |
| **Localization**        | [next-intl](https://next-intl-docs.vercel.app/) (Arabic & English, RTL-first, ICU plurals)                                                |
| **Data Fetching**       | [TanStack Query v5](https://tanstack.com/query), [Axios](https://axios-http.com/)                                                         |
| **Forms & Validation**  | [TanStack Form](https://tanstack.com/form), [Zod](https://zod.dev/)                                                                       |
| **Charts & Reporting**  | [Recharts](https://recharts.org/), [@react-pdf/renderer](https://react-pdf.org/) (PDF invoice generation)                                 |
| **Content & Editing**   | [@mdxeditor/editor](https://mdxeditor.dev/), [@next/mdx](https://nextjs.org/docs/app/building-your-application/configuring/mdx)           |
| **Animations**          | [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)                                                      |
| **DevOps & Containers** | [Docker](https://www.docker.com/) (Alpine standalone), [GitHub Actions](https://github.com/features/actions), [Nginx](https://nginx.org/) |

---

## ✨ Key Features

### 1. 📚 Course & Lesson Management

- Dynamic course builder with multiple pricing models, thumbnail uploads, and group access codes.
- Structured curriculum organization (modules, lessons, video hosting embeds, and file attachments).
- Markdown/MDX rich-text lesson notes editor.

### 2. 📝 Exam Engine & Question Bank

- Comprehensive question bank supporting multiple choice, essay, and media-rich questions.
- Timed online exam system with real-time countdown, automatic autosave, and grading.
- Post-exam analytics, student complaint tracking, and question performance breakdowns.

### 3. 👥 Student Roster & Billing

- Complete student directory with search, filter by governorate/city, and parent emergency contact details.
- Automated invoice generation and printable PDF export via React-PDF.
- Subscription and course purchase verification system.

### 4. 🌐 Full Bilingual & RTL Support

- Native Arabic-first design powered by **IBM Plex Sans Arabic** typography.
- Seamless switching between Arabic (RTL) and English (LTR).
- Grammatically accurate Arabic pluralization rules using ICU syntax (`zero`, `one`, `two`, `few`, `many`, `other`).

### 5. 🔐 Role-Based Access & Proxy Protection

- Intelligent server-side route proxy (`src/proxy.ts`) redirecting users to their role-specific dashboard.
- Cookie-based authentication (`rewaa_auth` & `rewaa_role`).
- Supports magic link login, password reset, and registration workflows.

---

## 📂 Project Structure

```text
rewaa/
├── .github/
│   └── workflows/deploy.yml       # GitHub Actions CI/CD deployment pipeline
├── deploy/
│   └── nginx/rewaa.conf           # Production Nginx reverse proxy configuration
├── docs/
│   ├── deployment-guide.md        # Comprehensive VPS/Droplet deployment guide
│   ├── dashboard-guide.md         # Dashboard architecture and workflows
│   └── dashboard-conventions.md   # UI/UX coding standards and patterns
├── messages/
│   ├── ar.json                    # Arabic translations
│   └── en.json                    # English translations
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   └── (main)/
│   │   │       ├── (auth)/        # Login, register, magic-link, password reset
│   │   │       ├── (dashboard)/   # Admin & Teacher management panel
│   │   │       ├── (student-dashboard)/ # Student learning portal
│   │   │       └── (landing)/     # Public reports and legal pages
│   │   └── api/                   # Next.js API route handlers
│   ├── components/
│   │   ├── dashboard/             # Management components (courses, exams, students, billing)
│   │   ├── student/               # Student portal UI components
│   │   └── ui/                    # Reusable Shadcn UI primitives
│   ├── hooks/                     # Custom React hooks
│   ├── i18n/                      # next-intl configuration and routing
│   ├── lib/                       # API clients, utilities, and storage helpers
│   ├── providers/                 # TanStack Query & Tooltip providers
│   ├── proxy.ts                   # Edge-level auth and internationalization proxy
│   └── types/                     # TypeScript interfaces and API schemas
├── docker-compose.prod.yml        # Production Docker Compose definition
├── Dockerfile                     # Multi-stage optimized standalone container
└── next.config.ts                 # Next.js standalone build configuration
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js**: v20 or v22 LTS
- **Package Manager**: [pnpm](https://pnpm.io/) (v9+)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/AmrMohamed27/rewaa.git
cd rewaa
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure your variables:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Auth Cookie Name (optional, defaults to rewaa_auth)
COOKIE_NAME=rewaa_auth

# Optional OpenAPI key for Orval code generation
OPENAPI_API_KEY=
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command               | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`            | Starts the Next.js development server with Turbopack                     |
| `pnpm build`          | Compiles production bundle with standalone output                        |
| `pnpm start`          | Starts the production server locally                                     |
| `pnpm type-check`     | Runs TypeScript compiler check (`tsc --noEmit`)                          |
| `pnpm lint`           | Runs ESLint rules across the codebase                                    |
| `pnpm generate:orval` | Generates TypeScript API clients & React Query hooks from OpenAPI schema |
| `pnpm docker:build`   | Builds local Docker image                                                |
| `pnpm docker:up`      | Runs containerized app locally                                           |
| `pnpm docker:down`    | Stops local Docker containers                                            |

---

## 🚢 Production Deployment

Rewaa is built to deploy on a **Digital Ocean Droplet** (or any 1 vCPU / 2 GB Linux VPS) with minimal resource usage (~150–200 MB RAM):

- **Automated CI/CD**: A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the standalone Docker container on GitHub's free 7 GB RAM runners, pushes the image to GitHub Container Registry (`ghcr.io`), and triggers an SSH restart on your droplet.
- **Host Nginx**: Proxies requests from ports 80/443 directly to `127.0.0.1:3000` with 1-year immutable caching for static assets.
- **Auto-SSL**: Free Let's Encrypt certificates provisioned via Certbot.

👉 **Read the full step-by-step instructions in the [Deployment Guide](docs/deployment-guide.md).**

---

## 🤝 Code Standards & Conventions

- **Back Buttons**: Sub-pages use a standardized circular icon button `<Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full shrink-0"><Link href={...}><ArrowLeft className="h-4 w-4 rtl:rotate-180" /></Link></Button>`.
- **Arabic ICU Plurals**: Always pass `{ count }` to `t()` with grammatical dual/few/many distinctions. Avoid manual string concatenation.
- **Git Hooks**: Pre-commit linting and formatting enforced via Husky, lint-staged, and Prettier.

---

## 📄 License

Proprietary © [Rewaa](https://rewaa.org). All rights reserved.
