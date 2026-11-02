'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/ui.store';

function BrewingCup() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className="h-24 w-24 animate-cup">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" className="text-emerald-200">
        <path d="M34 28c-4-5 4-8 0-14" className="animate-steam" />
        <path d="M48 28c-4-5 4-8 0-14" className="animate-steam [animation-delay:250ms]" />
        <path d="M62 28c-4-5 4-8 0-14" className="animate-steam [animation-delay:500ms]" />
      </g>
      <path d="M22 38h52v22a22 22 0 0 1-22 22H44a22 22 0 0 1-22-22V38Z" fill="#fff" />
      <path d="M74 44h4a10 10 0 0 1 0 20h-5" fill="none" stroke="#fff" strokeWidth="5" />
    </svg>
  );
}

export function AppFeedback() {
  const loadingMessage = useUiStore((state) => state.loadingMessage);
  const toast = useUiStore((state) => state.toast);
  const pathname = usePathname();

  useEffect(() => {
    const { holdingForNavigation, releaseLoading } = useUiStore.getState();
    if (holdingForNavigation) releaseLoading();
  }, [pathname]);

  return (
    <>
      {loadingMessage && (
        <div
          role="status"
          data-testid="app-loading"
          className="fixed inset-0 z-[100] flex animate-page-in flex-col items-center justify-center bg-[#002C22] px-6 text-center text-white"
        >
          <BrewingCup />
          <p className="mt-4 font-serif text-3xl font-semibold tracking-tight">BrewLite</p>
          <p className="mt-2 text-sm text-emerald-100">{loadingMessage}</p>
        </div>
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          data-testid="app-toast"
          className="fixed inset-x-4 top-4 z-[90] mx-auto w-fit max-w-full animate-toast-in rounded-xl bg-[#002C22] px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <span aria-hidden="true" className="mr-2">✓</span>
          {toast.message}
        </div>
      )}
    </>
  );
}
