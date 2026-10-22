"use client";

import useRegistrationStore from "@/store/registrationStore";
import StepEmail from "./steps/StepEmail";
import StepOTP from "./steps/StepOTP";
import StepRegister from "./steps/StepRegister";
import { StepIndicator } from "./StepIndicator";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = [
  { number: 1, label: "Verify Email" },
  { number: 2, label: "Enter Code" },
  { number: 3, label: "Your Details" },
];

export default function RegisterWizard() {
  const { step } = useRegistrationStore();

  return (
    <div className="w-full space-y-4">
      <StepIndicator steps={STEPS} currentStep={step} />

      <div className="relative overflow-hidden pt-2">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepEmail />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepOTP />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepRegister />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
