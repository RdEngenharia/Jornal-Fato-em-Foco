import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  category: string;
};

function buildHref(page: number, category: string): string {
  const params = new URLSearchParams();
  if (category !== "todas") params.set("categoria", category);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default function Pagination({ currentPage, totalPages, category }: Props) {
  if (totalPages <= 1) return null;

  // Mostra um intervalo pequeno de páginas em volta da atual, mais a
  // primeira e a última, para não poluir a UI quando houver muitas
  // páginas (ex: 1 ... 4 5 [6] 7 8 ... 20).
  const pages = new Set<number>([1, totalPages, currentPage]);
  for (let p = currentPage - 1; p <= currentPage + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sortedPages = [...pages].sort((a, b) => a - b);

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10">
      <Link
        href={buildHref(Math.max(1, currentPage - 1), category)}
        aria-disabled={currentPage === 1}
        className={`font-sans text-sm px-3 py-2 rounded-md border transition-colors ${
          currentPage === 1
            ? "border-ink/10 text-mute/40 pointer-events-none"
            : "border-ink/10 text-ink hover:border-terracotta/40"
        }`}
      >
        ← Anterior
      </Link>

      {sortedPages.map((page, i) => {
        const prevPage = sortedPages[i - 1];
        const showEllipsis = prevPage !== undefined && page - prevPage > 1;
        return (
          <span key={page} className="flex items-center gap-1.5">
            {showEllipsis && <span className="font-sans text-sm text-mute px-1">…</span>}
            <Link
              href={buildHref(page, category)}
              className={`font-sans text-sm w-9 h-9 flex items-center justify-center rounded-md border transition-colors ${
                page === currentPage
                  ? "border-terracotta bg-terracotta text-white"
                  : "border-ink/10 text-ink hover:border-terracotta/40"
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1), category)}
        aria-disabled={currentPage === totalPages}
        className={`font-sans text-sm px-3 py-2 rounded-md border transition-colors ${
          currentPage === totalPages
            ? "border-ink/10 text-mute/40 pointer-events-none"
            : "border-ink/10 text-ink hover:border-terracotta/40"
        }`}
      >
        Próxima →
      </Link>
    </nav>
  );
}
