import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { toPersianDigits } from '../utils/persian';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 40, 50],
  itemLabel = 'مورد',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#042f2e]/90 border border-[#0d9488]/30 text-xs text-[#99f6e4] select-none ${className}`}
    >
      {/* Items count & Page Size Selector (10 to 50, step 10) */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          نمایش <strong className="text-white font-mono">{toPersianDigits(startIdx)}</strong> تا{' '}
          <strong className="text-white font-mono">{toPersianDigits(endIdx)}</strong> از مجموع{' '}
          <strong className="text-[#a3e635] font-mono">{toPersianDigits(totalItems)}</strong> {itemLabel}
        </span>

        <div className="flex items-center gap-1.5 bg-[#073834] px-2.5 py-1 rounded-xl border border-[#0d9488]/40">
          <span className="text-[11px] text-[#ccfbf1]">تعداد در صفحه:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize);
              onPageChange(1);
            }}
            className="bg-transparent text-[#84cc16] font-black text-xs focus:outline-none cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-[#073834] text-white">
                {toPersianDigits(opt)} تایی
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Buttons (Right & Left arrows, Page Numbers) */}
      <div className="flex items-center gap-1.5" dir="rtl">
        {/* Next / Prev Buttons in RTL:
            In Persian RTL, forward (next page) is logically pointing to Left (ChevronLeft)
            and backward (prev page) is pointing to Right (ChevronRight).
            We provide explicit title and tooltip so the user can easily navigate. */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className="p-1.5 sm:p-2 rounded-xl bg-[#073834] hover:bg-[#0d9488]/50 disabled:opacity-40 disabled:hover:bg-[#073834] text-[#ccfbf1] border border-[#0d9488]/40 transition-all flex items-center gap-1"
          title="صفحه قبلی"
          aria-label="صفحه قبلی"
        >
          <ChevronRight className="w-4 h-4" />
          <span className="text-[11px] hidden sm:inline">قبلی</span>
        </button>

        {/* Current page indicator / badge */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#073834] border border-[#0d9488]/40 font-mono text-xs">
          <span className="text-white font-bold">{toPersianDigits(safeCurrentPage)}</span>
          <span className="text-[#99f6e4]/60">/</span>
          <span className="text-[#99f6e4]">{toPersianDigits(totalPages)}</span>
        </div>

        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className="p-1.5 sm:p-2 rounded-xl bg-[#073834] hover:bg-[#0d9488]/50 disabled:opacity-40 disabled:hover:bg-[#073834] text-[#ccfbf1] border border-[#0d9488]/40 transition-all flex items-center gap-1"
          title="صفحه بعدی"
          aria-label="صفحه بعدی"
        >
          <span className="text-[11px] hidden sm:inline">بعدی</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
