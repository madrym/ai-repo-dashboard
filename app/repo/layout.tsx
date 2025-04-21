import { ReactNode } from "react"

interface RepoLayoutProps {
  children: ReactNode
}

export default function RepoLayout({ children }: RepoLayoutProps) {
  return <>{children}</>
} 