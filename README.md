# AI Repo Dashboard

A modern web application dashboard for AI repository management and feature development. Built with Next.js 15 and React 19, it provides tools for analyzing code, planning features with AI assistance, visualizing dependencies, and managing reusable templates.

## ✨ Key Features

-   **Feature Planning**: Create and analyze feature specifications with AI assistance.
-   **Dependency Analysis**: Visualize code dependencies through interactive graphs.
-   **Template Management**: Create, save, and reuse feature templates.
-   **Repository History**: Track feature development and changes over time.

## 🚀 Tech Stack

-   **Framework**: Next.js 15
-   **UI Library**: React 19
-   **Styling**: Tailwind CSS with Shadcn UI & Radix UI primitives
-   **Language**: TypeScript
-   **AI Integration**: Vercel AI SDK, OpenAI
-   **Data Visualization**: D3.js, Recharts
-   **Form Handling**: React Hook Form, Zod
-   **Package Manager**: pnpm

## 🛠️ Getting Started

### Prerequisites

-   Node.js (Check Next.js 15 requirements for specific version)
-   npm or pnpm
-   pnpm

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd ai-repo-dashboard
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Environment Variables:**
    *   Set up any necessary environment variables (e.g., API keys for OpenAI). You might need a `.env.local` file. Refer to project specifics if needed.

### Running Locally

1.  **Start the development server:**
    ```bash
    pnpm dev
    ```
2.  Open your browser and navigate to `http://localhost:3000`.

## ⚙️ Available Scripts

-   `pnpm dev`: Starts the development server.
-   `pnpm build`: Builds the application for production.
-   `pnpm start`: Starts the production server (requires a prior build).
-   `pnpm lint`: Runs the ESLint linter to check code quality.

## 📂 Project Structure

The project follows the Next.js App Router structure:

-   `app/`: Contains application routes, pages, and API endpoints.
-   `components/`: Reusable React components.
    -   `components/ui/`: Shadcn UI components.
-   `hooks/`: Custom React hooks.
-   `lib/`: Utility functions and helpers.
-   `public/`: Static assets (images, fonts, etc.).
-   `styles/`: Global CSS and Tailwind configuration.

*(Based on `.ai/repository-spec.md`)* 