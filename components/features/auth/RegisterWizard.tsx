"use client";

import useRegistrationStore from "@/store/registrationStore";
import StepEmail from "./steps/StepEmail";
import StepOTP from "./steps/StepOTP";
import StepRegister from "./steps/StepRegister";

const STEPS = [
  { number: 1, label: "Verify Email" },
  { number: 2, label: "Enter Code" },
  { number: 3, label: "Your Details" },
];

export default function RegisterWizard() {
  const { step } = useRegistrationStore();

  return (
    <div className="w-full max-w-md mx-auto">

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, index) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                  step > s.number
                    ? "bg-green-800 text-white"
                    : step === s.number
                    ? "bg-green-800 text-white ring-4 ring-green-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {step > s.number ? "✓" : s.number}
              </div>
              <span className={`mt-1 text-xs ${step >= s.number ? "text-green-800 font-medium" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition ${step > s.number ? "bg-green-800" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && <StepEmail />}
      {step === 2 && <StepOTP />}
      {step === 3 && <StepRegister />}

    </div>
  );
}