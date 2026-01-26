import { ReactNode } from 'react';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { CheckIcon } from '@heroicons/react/24/solid';

interface WizardStep {
  title: string;
  description?: string;
  content: ReactNode;
  isValid?: boolean;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  completedSteps?: number[];
  className?: string;
}

export default function WizardLayout({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  isLoading = false,
  completedSteps = [],
  className = '',
}: WizardLayoutProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];
  const canGoNext = currentStepData?.isValid !== false;

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else if (!isLastStep) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep || completedSteps.includes(stepIndex)) {
      onStepChange(stepIndex);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            const isClickable = isPast || isCompleted;

            return (
              <div key={index} className="flex items-center flex-1">
                <div
                  onClick={() => isClickable && handleStepClick(index)}
                  className={`
                    flex flex-col items-center cursor-pointer
                    ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  {/* Step Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors
                      ${isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent ? 'text-slate-100' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mt-[-1.5rem]">
                    <div
                      className={`h-full ${
                        index < currentStep || isCompleted
                          ? 'bg-green-600'
                          : 'bg-slate-800'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                {currentStepData.title}
              </h2>
              {currentStepData.description && (
                <p className="text-slate-400">{currentStepData.description}</p>
              )}
            </div>

            <div className="mb-8">{currentStepData.content}</div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <div>
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isLoading}
                >
                  Previous
                </Button>

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext || isLoading}
                >
                  {isLoading
                    ? 'Processing...'
                    : isLastStep
                    ? 'Complete'
                    : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
