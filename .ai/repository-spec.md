# 🧾 Repository Specification: AI Repo Dashboard

## 📘 Repository Overview  
- **Summary**:  
  A modern web application dashboard for AI repository management and feature development. Built with Next.js 15 and React 19, it provides tools for analyzing code, planning features with AI assistance, visualizing dependencies, and managing reusable templates.

- **Core Features**:  
  - **Feature Planning** — Create and analyze feature specifications with AI assistance
  - **Dependency Analysis** — Visualize code dependencies through interactive graphs
  - **Template Management** — Create, save, and reuse feature templates
  - **Repository History** — Track feature development and changes over time

---

## 🚀 CI/CD  
- **Workflows Detected**:  
  - No explicit CI/CD workflows detected in the repository

- **Tools Used**:  
  - None detected

- **Artifacts / Deployments**:  
  - Local development with `npm run dev`
  - Production build with `npm run build`

- **Relevant Links**:  
  - None detected

---

## 🧰 Integrated Tools  
- **Security Tools**:  
  - None explicitly detected

- **Quality / Monitoring Tools**:  
  - ESLint (`npm run lint`)

- **Testing / Automation Tools**:  
  - None explicitly detected

- **Other Tools**:  
  - Vercel AI SDK for AI-powered features
  - OpenAI integration via @ai-sdk/openai
  - Shadcn UI component library
  - Tailwind CSS for styling

---

## 🔀 Pull Request Workflows  
- **Triggers**:  
  - None explicitly configured

- **Checks / Bots**:  
  - None detected

- **Branch Rules**:  
  - None explicitly defined

---

## 🛠️ Languages & Versions  
- **Languages**:  
  - TypeScript (primary)
  - CSS (Tailwind)
  - SVG (for icons and graphics)

- **Language Versions**:  
  - Node.js (implied from Next.js requirements)
  - TypeScript 5.x

- **Package Managers**:  
  - npm (for scripts and dependencies)
  - pnpm (lock file present: pnpm-lock.yaml)

---

## 🧪 Testing & Coverage  
- **Frameworks Detected**:  
  - None explicitly detected

- **Test Directories / Files**:  
  - None detected

- **Estimated Coverage**:  
  - Unknown/None

- **Notable Test Types**:  
  - None detected

---

## 📦 Project Structure
- **App Directory Structure**:
  - Modern Next.js App Router architecture
  - Route-based organization with page.tsx files
  - API routes under app/api/

- **Core Directories**:
  - `app/` - Next.js application routes and pages
  - `components/` - Reusable UI components
  - `components/ui/` - Shadcn UI component library
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and helpers
  - `public/` - Static assets
  - `styles/` - Global CSS

---

## 📚 Dependencies
- **Frontend Framework**:
  - React 19
  - Next.js 15.2.4
  
- **UI & Styling**:
  - Tailwind CSS 3.4.17
  - Shadcn UI components
  - Radix UI primitives
  - Lucide React icons
  
- **AI/ML**:
  - AI SDK
  - OpenAI SDK for AI capabilities
  
- **Data Visualization**:
  - D3.js
  - Recharts 2.15.0
  
- **Form Handling**:
  - React Hook Form 7.54.1
  - Zod 3.24.1 for validation

---

## 🌐 Routes & Pages
- **Main Routes**:
  - `/` - Homepage/landing
  - `/auth` - Authentication page
  - `/dashboard` - Main dashboard
  - `/features` - Feature management
  - `/features/[id]` - Individual feature details
  - `/features/[id]/files` - Feature file details
  - `/dependencies` - Dependency analysis
  - `/history` - Repository history view
  - `/planner` - Feature planning interface
  - `/templates` - Template management
  - `/templates/[id]` - Individual template details
  - `/templates/create` - Create new templates

---

## 👥 Development
- **Getting Started**:
  ```bash
  # Install dependencies
  npm install
  
  # Run development server
  npm run dev
  
  # Build for production
  npm run build
  
  # Start production server
  npm run start
  
  # Run linting
  npm run lint
  ```

- **Environment Setup**:
  - Requires Node.js
  - Uses TypeScript for type safety
  - Configured for Tailwind CSS with PostCSS 