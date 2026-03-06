"use client";

import { Check, Loader2, Upload, FileCheck, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadStep } from "@/hooks/useImportProcessor";

interface Step {
  id: UploadStep;
  label: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: "uploading", label: "Uploading", icon: Upload },
  { id: "validating", label: "Validating", icon: FileCheck },
  { id: "finalizing", label: "Finalizing", icon: CheckCircle2 },
];

interface ImportStepperProps {
  currentStep: UploadStep;
  progress: number;
  error?: string | null;
}

export function ImportStepper({ currentStep, progress, error }: ImportStepperProps) {
  const getStepStatus = (step: Step): "completed" | "current" | "upcoming" | "error" => {
    if (currentStep === "error") {
      const stepIndex = steps.findIndex((s) => s.id === step.id);
      const errorStepIndex = steps.findIndex(
        (s) =>
          s.id === "uploading" ||
          s.id === "validating" ||
          s.id === "finalizing"
      );
      if (stepIndex <= errorStepIndex) return "error";
      return "upcoming";
    }

    if (currentStep === "complete") return "completed";

    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    const stepIndex = steps.findIndex((s) => s.id === step.id);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const isActive = currentStep !== "idle" && currentStep !== "complete" && currentStep !== "error";
  const isComplete = currentStep === "complete";
  const isError = currentStep === "error";

  if (currentStep === "idle") return null;

  return (
    <div className="w-full py-4">
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out rounded-full",
              isError ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-indigo-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step circle */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  status === "completed" && "border-green-500 bg-green-500 text-white",
                  status === "current" && "border-indigo-500 bg-indigo-50 text-indigo-600",
                  status === "upcoming" && "border-slate-200 bg-white text-slate-400",
                  status === "error" && "border-red-500 bg-red-50 text-red-600"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : status === "current" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : status === "error" ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors",
                  status === "completed" && "text-green-600",
                  status === "current" && "text-indigo-600",
                  status === "upcoming" && "text-slate-400",
                  status === "error" && "text-red-600"
                )}
              >
                {step.label}
              </span>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5 h-0.5 transition-colors",
                    status === "completed" ? "bg-green-500" : "bg-slate-200"
                  )}
                  style={{
                    left: `calc(${((index + 0.5) / steps.length) * 100}%)`,
                    width: `calc(${(1 / steps.length) * 100}%)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Success/Error message */}
      {isComplete && (
        <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Import completed successfully!</span>
        </div>
      )}

      {isError && error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}

export default ImportStepper;
