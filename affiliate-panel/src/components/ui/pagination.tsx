import { ChevronLeft, ChevronRight } from "lucide-react";

const PER_PAGE = 50;

export interface PaginationProps {
  page: number;
  total: number;
  perPage?: number;
  onPageChange: (page: number) => void;
  /** حداکثر تعداد دکمه‌های شمارهٔ صفحه در کنار هم (غیر از اولین و آخرین) */
  maxVisible?: number;
}

function getPageNumbers(current: number, totalPages: number, maxVisible: number): (number | "ellipsis")[] {
  if (totalPages <= maxVisible + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out: (number | "ellipsis")[] = [];
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  if (start > 1) {
    out.push(1);
    if (start > 2) out.push("ellipsis");
  }
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) out.push("ellipsis");
    out.push(totalPages);
  }
  return out;
}

export function Pagination({ page, total, perPage = PER_PAGE, onPageChange, maxVisible = 5 }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.max(1, Math.min(page, totalPages));
  const pages = getPageNumbers(current, totalPages, maxVisible);

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap" dir="ltr">
      <button
        type="button"
        onClick={() => onPageChange(current - 1)}
        disabled={current <= 1}
        className="rounded-lg px-3 py-2 text-sm font-medium bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center gap-1"
      >
        <ChevronRight className="w-4 h-4" />
        قبلی
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[2.25rem] h-9 rounded-lg px-2 text-sm font-medium transition-colors ${
                p === current
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted/80 text-foreground hover:bg-muted"
              }`}
            >
              {p.toLocaleString("fa-IR")}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(current + 1)}
        disabled={current >= totalPages}
        className="rounded-lg px-3 py-2 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground transition-colors flex items-center gap-1"
      >
        بعدی
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
