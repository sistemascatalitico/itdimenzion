import { useState } from 'react';

interface UseMultiStepProps {
  steps: number;
  initialStep?: number;
}

export const useMultiStep = ({ steps, initialStep = 0 }: UseMultiStepProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  const next = () => {
    if (currentStep < steps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const goTo = (step: number) => {
    if (step >= 0 && step < steps) {
      setCurrentStep(step);
    }
  };
  
  return {
    currentStep,
    next,
    prev,
    goTo,
    isFirst: currentStep === 0,
    isLast: currentStep === steps - 1,
    progress: ((currentStep + 1) / steps) * 100
  };
};