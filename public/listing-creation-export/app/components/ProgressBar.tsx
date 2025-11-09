import React from "react";
import { CheckCircle, Circle, Play } from "lucide-react";

export interface Step {
  id: number;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
  required?: boolean;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function ProgressBar({
  steps,
  currentStep,
  className = "",
}: ProgressBarProps) {
  const getStepIcon = (step: Step, index: number) => {
    if (step.status === "completed") {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (step.status === "active") {
      return <Play className="w-5 h-5 text-[#D4AF3D]" />;
    } else if (step.status === "error") {
      return <Circle className="w-5 h-5 text-red-500" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatus = (step: Step, index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "pending";
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(
      (_, index) => index < currentStep
    ).length;
    return Math.round((completedSteps / (steps.length - 1)) * 100);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {getProgressPercentage()}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-[#D4AF3D] to-[#b8932f] h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const isActive = status === "active";
          const isCompleted = status === "completed";

          return (
            <div
              key={step.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                isActive
                  ? "border-[#D4AF3D] bg-[#D4AF3D]/5 shadow-md"
                  : isCompleted
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {/* Step Number Badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#D4AF3D] text-white ring-2 ring-[#D4AF3D] ring-offset-2"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : step.id}
                </div>
                {step.required && (
                  <span className="text-xs text-red-600 font-medium">
                    Required
                  </span>
                )}
              </div>

              {/* Step Content */}
              <div className="space-y-2">
                <h3
                  className={`font-semibold text-sm transition-colors ${
                    isActive
                      ? "text-[#D4AF3D]"
                      : isCompleted
                      ? "text-green-800"
                      : "text-gray-600"
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-xs transition-colors ${
                    isActive
                      ? "text-[#D4AF3D]/80"
                      : isCompleted
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {/* Active Step Highlight */}
              {isActive && (
                <div className="absolute inset-0 border-2 border-[#D4AF3D] rounded-lg animate-pulse opacity-20" />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Details */}
      {steps[currentStep] && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-800">
              Current Step: {steps[currentStep].title}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {steps[currentStep].description}
          </p>
        </div>
      )}
    </div>
  );
}
