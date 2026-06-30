import Link from "next/link";

const CATEGORIES = [
  { value: "todas", label: "Todas" },
  { value: "geral", label: "Geral" },
  { value: "politica", label: "Política" },
  { value: "economia", label: "Economia" },
  { value: "policia", label: "Polícia" },
  { value: "justica", label: "Justiça" },
  { value: "cultura", label: "Cultura" },
  { value: "esporte", label: "Esporte" },
  { value: "saude", label: "Saúde" },
  { value: "turismo", label: "Turismo" },
  { value: "educacao", label: "Educação" },
];

export default function CategoryTabs({ active }: { active: string }) {
  return (
    <nav className="border-b border-ink/10 px-5 sm:px-10 overflow-x-auto">
      <div className="mx-auto max-w-6xl flex gap-1 min-w-max">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.value;
          const href = cat.value === "todas" ? "/" : `/?categoria=${cat.value}`;
          return (
            <Link
              key={cat.value}
              href={href}
              className={`font-sans text-sm px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-terracotta text-terracotta font-medium"
                  : "border-transparent text-mute hover:text-ink"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
