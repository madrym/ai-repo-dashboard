"use client"

import React from "react"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
  currentStep: number
  className?: string
  children: React.ReactNode
}

interface StepProps {
  title: string
  description?: string
}

// Context for the stepper
const StepperContext = React.createContext<{ currentStep: number }>({ currentStep: 0 })
const StepIndexContext = React.createContext<number>(0)

export function Stepper({ currentStep, className, children }: StepperProps) {
  return (
    <StepperContext.Provider value={{ currentStep }}>
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-between">
          {React.Children.map(children, (child, index) => (
            <React.Fragment key={index}>
              {index > 0 && <div className={cn("h-1 flex-1", index <= currentStep ? "bg-primary" : "bg-muted")} />}
              <StepIndexContext.Provider value={index}>{child}</StepIndexContext.Provider>
            </React.Fragment>
          ))}
        </div>
      </div>
    </StepperContext.Provider>
  )
}

export function Step({ title, description }: StepProps) {
  const { currentStep } = React.useContext(StepperContext)
  const index = React.useContext(StepIndexContext)

  const isCompleted = index < currentStep
  const isCurrent = index === currentStep

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border-2 text-center",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : isCurrent
              ? "border-primary text-primary"
              : "border-muted bg-muted text-muted-foreground",
        )}
      >
        {isCompleted ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
      </div>
      <div className="flex flex-col items-center text-center">
        <span className={cn("text-sm font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
          {title}
        </span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
    </div>
  )
}
