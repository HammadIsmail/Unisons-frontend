"use client";

import useRegistrationStore from "@/store/registrationStore";
import StepEmail from "./steps/StepEmail";
import StepOTP from "./steps/StepOTP";
import StepRegister from "./steps/StepRegister";
import { StepIndicator } from "./StepIndicator";

const STEPS = [
  { number: 1, label: "Verify Email" },
  { number: 2, label: "Enter Code" },
  { number: 3, label: "Your Details" },
];

export default function RegisterWizard() {
  const { step } = useRegistrationStore();

  return (
    <div className="w-full space-y-1">
      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {step === 1 && <StepEmail />}
        {step === 2 && <StepOTP />}
        {step === 3 && <StepRegister />}
      </div>
    </div>
  );
}
