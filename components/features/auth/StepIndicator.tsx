"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

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
    <div className="flex items-center justify-between w-full mb-8 relative px-2">
      {/* Background Connector Bar */}
      <div className="absolute top-4 left-0 right-0 h-[2px] bg-muted -z-0 mx-8" />
      
      {/* Active Connector Bar */}
      <motion.div 
        className="absolute top-4 left-0 h-[2px] bg-[#0a66c2] -z-0 mx-8"
        initial={{ width: 0 }}
        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {steps.map((s) => {
        const isDone = currentStep > s.number;
        const isActive = currentStep === s.number;

        return (
          <div key={s.number} className="flex flex-col items-center relative z-10">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isDone || isActive ? "#0a66c2" : "#f3f4f6",
                color: isDone || isActive ? "#ffffff" : "#9ca3af",
                scale: isActive ? 1.1 : 1,
              }}
              className={`
                h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-shadow
                ${isActive ? "ring-4 ring-blue-500/20 shadow-blue-500/20" : ""}
              `}
            >
              {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : s.number}
            </motion.div>
            <motion.span
              animate={{
                color: isDone || isActive ? "#0a66c2" : "#9ca3af",
                fontWeight: isActive ? 700 : 500,
              }}
              className="text-[10px] mt-2 whitespace-nowrap uppercase tracking-wider"
            >
              {s.label}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
