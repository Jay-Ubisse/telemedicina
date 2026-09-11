"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  OTHER_LOCATION,
  OTHER_LOCATION_LABEL,
  maputoNeighbourhoods,
  normalizeNeighbourhood,
} from "@/lib/data/locations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Campo de bairro com a opção «Outro» (§13 do relatório).
 *
 * A lista de bairros da cidade de Maputo deixou de ser fechada: escolhendo
 * «Outro», aparece um campo de texto para escrever o bairro à mão. Usado no
 * registo de conta, no pedido de teleconsulta e no perfil — para que a regra
 * seja a mesma em toda a plataforma.
 *
 * O estado vive fora: `value` é o bairro escolhido na lista (ou o sentinela
 * `OTHER_LOCATION`) e `customValue` é o texto escrito. O valor efectivo é
 * calculado por `resolveNeighbourhood`.
 */
export function NeighbourhoodField({
  id,
  label = "Bairro",
  value,
  customValue,
  onChange,
  onCustomChange,
  hint = "O serviço opera na cidade de Maputo. Não é recolhida a rua nem o número de residência.",
  required = true,
}: {
  id: string;
  label?: string;
  value: string;
  customValue: string;
  onChange: (value: string) => void;
  onCustomChange: (value: string) => void;
  hint?: string;
  required?: boolean;
}) {
  const isOther = value === OTHER_LOCATION;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-required={required}
          className="h-11 w-full rounded-xl"
        >
          <SelectValue placeholder="Seleccione o bairro" />
        </SelectTrigger>
        <SelectContent>
          {maputoNeighbourhoods.map((bairro) => (
            <SelectItem key={bairro} value={bairro}>
              {bairro}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_LOCATION}>{OTHER_LOCATION_LABEL}</SelectItem>
        </SelectContent>
      </Select>

      {isOther ? (
        <Input
          id={`${id}-custom`}
          name={`${id}-custom`}
          value={customValue}
          onChange={(event) => onCustomChange(event.target.value)}
          placeholder="Escreva o nome do bairro"
          aria-label="Indique o bairro"
          required={required}
          aria-required={required}
          minLength={3}
          className="h-11 rounded-xl px-3.5"
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        {isOther
          ? "Escreva o bairro onde a criança se encontra. A lista não é fechada."
          : hint}
      </p>
    </div>
  );
}

/**
 * Valor efectivo do campo: o bairro da lista ou o texto escrito quando a opção
 * escolhida foi «Outro».
 */
export function resolveNeighbourhood(value: string, customValue: string) {
  if (value !== OTHER_LOCATION) return value.trim();
  return normalizeNeighbourhood(customValue);
}

/**
 * Estado inicial do campo a partir de um bairro já guardado: se não consta da
 * lista, o campo abre em «Outro» com o texto preenchido.
 */
export function splitNeighbourhood(stored: string | undefined) {
  const value = (stored ?? "").trim();
  if (!value) return { value: "", customValue: "" };

  const listed = (maputoNeighbourhoods as readonly string[]).includes(value);
  return listed
    ? { value, customValue: "" }
    : { value: OTHER_LOCATION, customValue: value };
}
