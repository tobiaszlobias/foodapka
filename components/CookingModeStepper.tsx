"use client";

import { useState } from "react";
import type { RecipeStep } from "@/lib/recipes";

type ScaledIngredient = { name: string; amount?: string };
type NormalizedStep = { text: string; ingredientIndexes: number[] };

export function normalizeSteps(instructions: (string | RecipeStep)[]): NormalizedStep[] {
  return instructions.map((step) =>
    typeof step === "string"
      ? { text: step, ingredientIndexes: [] }
      : { text: step.text, ingredientIndexes: step.ingredientIndexes ?? [] },
  );
}

/** Krokovací "cooking mode" — jen aktuální krok zvýrazněný, předchozí/
 * následující vidět vyšisovaně nad/pod, šipky pro přechod mezi kroky.
 * Sdílené mezi veřejnou stránkou receptu (TestRecipeDetail) a appkou
 * (RecipeSection), zatím jen pro recepty se strukturovanými kroky. */
export default function CookingModeStepper({
  steps,
  scaledIngredients,
  headingClassName = "text-foodappka-800 dark:text-foodappka-400",
  headingStyle,
}: {
  steps: NormalizedStep[];
  scaledIngredients: ScaledIngredient[];
  headingClassName?: string;
  headingStyle?: React.CSSProperties;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  function renderStepIngredients(step: NormalizedStep) {
    if (step.ingredientIndexes.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {step.ingredientIndexes.map((idx) => {
          const ing = scaledIngredients[idx];
          if (!ing) return null;
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-foodappka-50 dark:bg-foodappka-900/30 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300"
            >
              {ing.amount && <span className="font-bold text-zinc-900 dark:text-white">{ing.amount}</span>}
              <span className="capitalize">{ing.name}</span>
            </span>
          );
        })}
      </div>
    );
  }

  if (steps.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-foodappka-700 dark:text-foodappka-400 font-bold mb-4 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm">visibility</span>
        Obrazovka zůstane rozsvícená během vaření.
      </p>

      {currentStep > 0 && (
        <div className="opacity-35 mb-2">
          <h3 className={`text-2xl mb-1 ${headingClassName}`} style={headingStyle}>
            Krok {currentStep}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{steps[currentStep - 1].text}</p>
        </div>
      )}

      {currentStep > 0 && (
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-foodappka-700 text-white mx-auto mb-4 hover:bg-foodappka-800 transition"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      )}

      <div className="py-2">
        <h3 className={`text-3xl mb-2 ${headingClassName}`} style={headingStyle}>
          Krok {currentStep + 1}
        </h3>
        <p className="text-lg text-zinc-900 dark:text-white leading-relaxed font-medium">
          {steps[currentStep].text}
        </p>
        {renderStepIngredients(steps[currentStep])}
      </div>

      {currentStep < steps.length - 1 && (
        <button
          onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-foodappka-700 text-white mx-auto my-4 hover:bg-foodappka-800 transition"
        >
          <span className="material-symbols-outlined">arrow_downward</span>
        </button>
      )}

      {currentStep < steps.length - 1 && (
        <div className="opacity-35 mt-2">
          <h3 className={`text-2xl mb-1 ${headingClassName}`} style={headingStyle}>
            Krok {currentStep + 2}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{steps[currentStep + 1].text}</p>
        </div>
      )}
    </div>
  );
}
