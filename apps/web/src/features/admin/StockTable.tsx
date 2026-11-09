'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Spinner } from '@/components/Skeleton';
import { stockLevel, MAX_ADMIN_STOCK } from './stock-level';

export interface StockRow {
  id: string;
  name: string;
  price: number;
  stock?: number;
  imageUrl?: string;
}

interface StockTableProps {
  /** Tiêu đề cột đầu tiên, ví dụ "Món" hoặc "Topping". */
  itemLabel: string;
  /** Đơn vị đếm hiện trong bảng, ví dụ "ly" hoặc "phần". */
  unit: string;
  searchPlaceholder: string;
  emptyText: string;
  rows: StockRow[];
  loading: boolean;
  /** Lưu số tồn kho mới. Trả về true khi lưu được, để bảng xoá số đang sửa của dòng đó. */
  onSave: (id: string, stock: number) => Promise<boolean>;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

/** Giữ số trong khoảng 0..MAX_ADMIN_STOCK; ô trống hoặc chữ thành 0. */
const clampStock = (value: number) => Math.min(MAX_ADMIN_STOCK, Math.max(0, Math.trunc(value) || 0));

const LEVEL_BADGE = {
  ok: 'bg-emerald-100 text-emerald-800',
  low: 'bg-amber-100 text-amber-800',
  out: 'bg-red-100 text-red-800',
} as const;

const LEVEL_TEXT = {
  ok: { label: 'Còn hàng', className: 'text-emerald-600' },
  low: { label: 'Sắp hết', className: 'text-amber-600' },
  out: { label: 'Hết hàng', className: 'text-red-600' },
} as const;

/**
 * Bảng tồn kho dùng chung cho tab "Món" và tab "Topping" của trang admin.
 * Admin gõ số mới (hoặc bấm -10 / +10) rồi bấm "Lưu"; số chỉ đổi trên server khi bấm Lưu.
 */
export function StockTable({ itemLabel, unit, searchPlaceholder, emptyText, rows, loading, onSave }: StockTableProps) {
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const setEdit = (id: string, value: number) => setEdits((prev) => ({ ...prev, [id]: clampStock(value) }));

  const save = async (id: string, value: number) => {
    setSavingId(id);
    try {
      if (await onSave(id, value)) {
        setEdits((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setSavingId(null);
    }
  };

  const visible = rows.filter((row) => row.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-emerald-700 focus:outline-none sm:w-64"
      />

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
          {rows.length === 0 ? emptyText : 'Không tìm thấy kết quả phù hợp.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-5 py-3.5">{itemLabel}</th>
                  <th className="px-5 py-3.5">Đơn giá</th>
                  <th className="px-5 py-3.5">Số lượng tồn kho</th>
                  <th className="px-5 py-3.5">Trạng thái kho</th>
                  <th className="px-5 py-3.5 text-right">Điều chỉnh tồn kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visible.map((row) => {
                  const stock = row.stock ?? 0;
                  const level = stockLevel(stock);
                  const editValue = edits[row.id] ?? stock;
                  const isSaving = savingId === row.id;

                  return (
                    <tr key={row.id} data-testid={`stock-row-${row.id}`} className="transition hover:bg-stone-50/70">
                      <td className="px-5 py-4 font-semibold text-stone-900">
                        <div className="flex items-center gap-3">
                          {row.imageUrl && (
                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                              <Image src={row.imageUrl} alt={row.name} fill sizes="40px" unoptimized className="object-cover" />
                            </span>
                          )}
                          {row.name}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-stone-800">{formatVND(row.price)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${LEVEL_BADGE[level]}`}>
                          {stock} {unit} còn lại
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold ${LEVEL_TEXT[level].className}`}>{LEVEL_TEXT[level].label}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEdit(row.id, editValue - 10)}
                            title="-10"
                            className="rounded border border-stone-200 bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700 hover:bg-stone-200"
                          >
                            -10
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={MAX_ADMIN_STOCK}
                            aria-label={`Tồn kho mới của ${row.name}`}
                            value={editValue}
                            onChange={(e) => setEdit(row.id, parseInt(e.target.value, 10))}
                            className="w-20 rounded border border-stone-300 px-2 py-1 text-center text-xs font-bold text-stone-800 focus:border-emerald-800 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setEdit(row.id, editValue + 10)}
                            title="+10"
                            className="rounded border border-stone-200 bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700 hover:bg-stone-200"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => void save(row.id, editValue)}
                            disabled={isSaving || editValue === stock}
                            className="rounded bg-emerald-800 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-900 disabled:opacity-40"
                          >
                            {isSaving ? '...' : 'Lưu'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
