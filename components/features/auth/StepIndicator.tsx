import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((s, index) => {
        const done = currentStep > s.number;
        const active = currentStep === s.number;
        const upcoming = currentStep < s.number;

        return (
          <div key={s.number} className="flex items-center flex-1 last:flex-none">
            {/* Step bubble + label */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`
                  h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${done
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : active
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-sm shadow-blue-600/30"
                    : "bg-muted text-muted-foreground ring-1 ring-border/60"
                  }
                `}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.number}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  done || active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-3 mb-5">
                <div
                  className={`h-px w-full transition-all duration-300 ${
                    done ? "bg-blue-600" : "bg-border/60"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
