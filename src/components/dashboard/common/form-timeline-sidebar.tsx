"use client";

import { CheckCircle2, HelpCircle, LucideIcon, Sparkles } from "lucide-react";
import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface VerticalTimelineStep {
  id: number;
  label: string;
  icon: LucideIcon;
  complete?: boolean;
}

interface FormTimelineSidebarProps {
  timelineTitle: string;
  steps: VerticalTimelineStep[];
  currentStep: number;
  disclaimerTitle?: string;
  disclaimerDescription?: string;
  onStepClick?: (stepId: number) => void;
}

export function FormTimelineSidebar({
  timelineTitle,
  steps,
  currentStep,
  disclaimerTitle,
  disclaimerDescription,
  onStepClick,
}: FormTimelineSidebarProps) {
  return (
    <aside className="flex flex-col gap-6 order-2 lg:order-1">
      {/* 1. Steps Timeline Card */}
      <Card className="bg-card border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
            <Sparkles className="size-5 text-primary shrink-0" />
            {timelineTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="relative ps-7 space-y-8 before:absolute before:left-3 rtl:before:left-auto rtl:before:right-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isDone = Boolean(step.complete) || step.id < currentStep;
              const allowClick = Boolean(onStepClick);
              const isNextClickable =
                allowClick && !isActive && !isDone && step.id === currentStep + 1;

              const content = (
                <>
                  <div className="absolute -left-7 rtl:-left-auto rtl:-right-7 flex size-6.5 items-center justify-center">
                    {/* Expanding pulse ripple ring for next actionable step */}
                    {isNextClickable && (
                      <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75 pointer-events-none" />
                    )}
                    <span
                      className={`relative z-10 flex size-6.5 items-center justify-center rounded-full text-xs font-bold ring-4 ring-card transition-all ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : isNextClickable
                              ? "bg-card text-primary border-2 border-primary shadow-xs"
                              : "bg-muted text-muted-foreground"
                      } ${
                        allowClick
                          ? "group-hover:scale-110 group-hover:ring-primary/30 cursor-pointer"
                          : ""
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="size-4" /> : step.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0 ms-2">
                    <StepIcon
                      className={`size-5 shrink-0 transition-colors ${
                        isActive
                          ? "text-primary"
                          : isDone
                            ? "text-emerald-500"
                            : isNextClickable
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <span
                      className={`text-base font-medium truncate transition-colors ${
                        isActive
                          ? "text-foreground font-semibold"
                          : isDone
                            ? "text-foreground"
                            : isNextClickable
                              ? "text-foreground font-medium"
                              : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </>
              );

              if (allowClick && onStepClick) {
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => onStepClick(step.id)}
                    className="group relative flex w-full items-center gap-4 py-1 text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div key={step.id} className="relative flex items-center gap-4 py-1">
                  {content}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Optional Disclaimer Card */}
      {disclaimerTitle && disclaimerDescription && (
        <Card className="border shadow-xs border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
              <HelpCircle className="size-4 shrink-0" />
              {disclaimerTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">{disclaimerDescription}</p>
          </CardContent>
        </Card>
      )}
    </aside>
  );
}
