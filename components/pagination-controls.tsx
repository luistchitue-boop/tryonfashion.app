"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const ITEMS_PER_PAGE = 6;

type PaginationControlsProps = {
  itemCount: number;
  page: number;
  onPageChange: (page: number) => void;
  label: string;
};

export function PaginationControls({ itemCount, page, onPageChange, label }: PaginationControlsProps) {
  const pageCount = Math.ceil(itemCount / ITEMS_PER_PAGE);
  if (pageCount <= 1) return null;

  const firstItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const lastItem = Math.min(page * ITEMS_PER_PAGE, itemCount);
  const buttonClass = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-stone-200 disabled:hover:bg-white";

  return (
    <nav aria-label={`${label} pagination`} className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:px-4">
      <p className="w-full text-center text-sm text-stone-600 sm:w-auto sm:text-left" aria-live="polite">
        Showing <span className="font-medium text-stone-900">{firstItem}–{lastItem}</span> of <span className="font-medium text-stone-900">{itemCount}</span>
      </p>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <button type="button" className={buttonClass} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Go to previous page">
          <ChevronLeft className="h-4 w-4" /> <span>Previous</span>
        </button>
        <span className="min-w-16 text-center text-sm font-medium tabular-nums text-stone-700" aria-current="page">{page} / {pageCount}</span>
        <button type="button" className={buttonClass} onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} aria-label="Go to next page">
          <span>Next</span> <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
