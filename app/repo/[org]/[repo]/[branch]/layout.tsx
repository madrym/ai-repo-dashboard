import { ReactNode } from "react"

interface BranchLayoutProps {
  children: ReactNode
}

export default function BranchLayout({ children }: BranchLayoutProps) {
  return <>{children}</>
} 