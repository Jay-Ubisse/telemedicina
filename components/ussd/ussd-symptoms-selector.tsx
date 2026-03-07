"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const symptomOptions = [
  "Febre",
  "Tosse",
  "Dor de cabeça",
  "Dor no peito",
  "Dificuldade respiratória",
  "Tontura",
  "Fraqueza",
  "Dor abdominal forte",
  "Perda de consciência",
];

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function UssdSymptomsSelector({ value, onChange }: Props) {
  function toggleSymptom(symptom: string, checked: boolean) {
    if (checked) {
      onChange([...value, symptom]);
      return;
    }

    onChange(value.filter((item) => item !== symptom));
  }

  return (
    <div className="space-y-3">
      {symptomOptions.map((symptom) => {
        const checked = value.includes(symptom);

        return (
          <div key={symptom} className="flex items-center space-x-2">
            <Checkbox
              id={symptom}
              checked={checked}
              onCheckedChange={(state) =>
                toggleSymptom(symptom, Boolean(state))
              }
            />
            <Label htmlFor={symptom} className="text-sm font-normal">
              {symptom}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
