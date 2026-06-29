"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "politica", label: "Política" },
  { value: "negocios", label: "Negócios" },
  { value: "policia", label: "Polícia" },
  { value: "cultura", label: "Cultura" },
  { value: "esporte", label: "Esporte" },
  { value: "saude", label: "Saúde" },
  { value: "turismo", label: "Turismo" },
];

type Props = {
  defaultValue: string;
  onChange?: (category: string) => void;
};

export default function CategorySelectField({ defaultValue, onChange }: Props) {
  const [category, setCategory] = useState(defaultValue);

  function handleChange(value: string) {
    setCategory(value);
    onChange?.(value);
  }

  return (
    <div>
      <label className="font-sans text-xs text-mute block mb-1">Categoria</label>
      <select
        name="category"
        value={category}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full font-sans text-sm text-ink bg-white border border-ink/10 rounded-md px-4 py-2.5 focus:border-terracotta"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {category === "policia" && (
        <div className="mt-2 rounded-md bg-terracotta/10 border border-terracotta/20 px-3 py-2.5">
          <p className="font-sans text-xs text-terracotta-dark leading-relaxed">
            <strong>Cuidado com a imagem desta matéria.</strong> Evite fotos
            que exponham corpos, vítimas ou cenas de crime — mesmo cobertas
            ou de outros veículos. Prefira imagens genéricas (viatura, local,
            sem a cena específica) ou nenhuma imagem.
          </p>
        </div>
      )}
    </div>
  );
}
