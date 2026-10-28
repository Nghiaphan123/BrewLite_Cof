"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useCartStore } from "@/store/cart.store";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

type MenuProduct = Product;

const MENU_TABS = ["Tß║Ñt cß║ú", "C├á ph├¬", "Tr├á", "─É├í xay", "Kh├íc"] as const;
type MenuTab = (typeof MENU_TABS)[number];

type ProductsResponse = {
  items: MenuProduct[];
  total: number;
};

type MenuState =
  | { status: "loading" }
  | { status: "success"; products: MenuProduct[] }
  | { status: "empty" }
  | { status: "error"; message: string };

function isMenuProduct(value: unknown): value is MenuProduct {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const product = value as Record<string, unknown>;
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    typeof product.imageUrl === "string"
  );
}

function isProductsResponse(value: unknown): value is ProductsResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    Array.isArray(response.items) &&
    response.items.every(isMenuProduct) &&
    typeof response.total === "number" &&
    Number.isInteger(response.total) &&
    response.total === response.items.length
  );
}

function getProductCategory(product: Product): Exclude<MenuTab, "Tß║Ñt cß║ú"> {
  const name = product.name
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/─æ/g, "d");

  if (name.includes("da xay")) {
    return "─É├í xay";
  }
  if (name.includes("tra") || name.includes("tr")) {
    return "Trà";
  }
  if (
    ["ca phe", "cà phê", "bac xiu", "bạc xỉu", "sua", "sữa", "espresso", "americano", "cappuccino", "latte", "macchiato", "mocha", "cold brew"]
      .some((keyword) => name.includes(keyword))
  ) {
    return "C├á ph├¬";
  }
  return "Kh├íc";
}

async function fetchProducts(signal: AbortSignal): Promise<MenuProduct[]> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    if (typeof body === "object" && body !== null && "message" in body) {
      const message = body.message;
      if (typeof message === "string") {
        throw new Error(message);
      }
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        throw new Error(message.join(", "));
      }
    }
    throw new Error(`Kh├┤ng thß╗â tß║úi menu (HTTP ${response.status}).`);
  }

  const body: unknown = await response.json();
  if (!isProductsResponse(body)) {
    throw new Error("Dß╗» liß╗çu menu tß╗½ m├íy chß╗º kh├┤ng ─æ├║ng ─æß╗ïnh dß║íng.");
  }

  return body.items;
}

function MenuSkeleton() {
  return (
    <div
      data-testid="menu-loading"
      aria-label="─Éang tß║úi menu"
      aria-busy="true"
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
        >
          <div className="aspect-[4/3] animate-pulse bg-zinc-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MenuPage() {
  const [menuState, setMenuState] = useState<MenuState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState<MenuTab>("Tß║Ñt cß║ú");
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartTotal = useCartStore((state) => state.getTotalPrice());

  const products = menuState.status === "success" ? menuState.products : [];
  const visibleProducts =
    activeTab === "Tß║Ñt cß║ú"
      ? products
      : products.filter((product) => getProductCategory(product) === activeTab);

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal)
      .then((products) => {
        setMenuState(
          products.length === 0
            ? { status: "empty" }
            : { status: "success", products },
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setMenuState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "─É├ú xß║úy ra lß╗ùi khi tß║úi menu.",
        });
      });

    return () => controller.abort();
  }, [retryCount]);

  function retry() {
    setMenuState({ status: "loading" });
    setRetryCount((count) => count + 1);
  }

  return (
    <div className="min-h-full bg-[#faf8f3] pb-28 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#faf8f3]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
          >
            <span aria-hidden="true" className="text-2xl">Γÿò</span>
            BrewLite
          </Link>
          <Link
            href="/cart"
            aria-label={`Giß╗Å h├áng, hiß╗çn c├│ ${totalItems} sß║ún phß║⌐m`}
            className="flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900"
          >
            <span aria-hidden="true">≡ƒ¢Æ</span>
            <span>Giß╗Å h├áng</span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-emerald-950">
              {totalItems}
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-emerald-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="relative z-10 max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">
              Pha t╞░╞íi mß╗ùi ng├áy
            </p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Mß╗Öt ch├║t chill,<br className="hidden sm:block" /> mß╗Öt ch├║t BrewLite.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-emerald-100 sm:text-base">
              Chß╗ìn m├│n bß║ín th├¡ch, th├¬m nhanh v├áo giß╗Å v├á th╞░ß╗ƒng thß╗⌐c theo c├ích cß╗ºa bß║ín.
            </p>
          </div>
          <span
            aria-hidden="true"
            className="absolute -right-4 -top-14 select-none text-[15rem] opacity-10 sm:right-8 sm:top-[-5.5rem]"
          >
            Γÿò
          </span>
        </section>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
              Kh├ím ph├í h╞░╞íng vß╗ï
            </p>
            <h2 className="mt-1 font-sans text-3xl font-bold tracking-tight">
              Menu thß╗⌐c uß╗æng
            </h2>
          </div>
          {menuState.status === "success" && (
            <p className="text-sm text-stone-500">
              {visibleProducts.length} m├│n
            </p>
          )}
        </div>

        {menuState.status === "loading" && <MenuSkeleton />}

        {menuState.status === "empty" && (
          <p
            data-testid="menu-empty"
            role="status"
            className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center text-zinc-600"
          >
            Menu ─æang cß║¡p nhß║¡t. Vui l├▓ng quay lß║íi sau.
          </p>
        )}

        {menuState.status === "error" && (
          <div
            data-testid="menu-error"
            role="alert"
            className="rounded-lg border border-red-200 bg-white px-6 py-10 text-center"
          >
            <p className="text-red-700">{menuState.message}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Thß╗¡ lß║íi
            </button>
          </div>
        )}

        {menuState.status === "success" && (
          <div
            role="tablist"
            aria-label="Danh mß╗Ñc thß╗⌐c uß╗æng"
            className="mb-6 flex gap-2 overflow-x-auto pb-2"
          >
            {MENU_TABS.map((tab) => {
              const count =
                tab === "Tß║Ñt cß║ú"
                  ? products.length
                  : products.filter((product) => getProductCategory(product) === tab).length;
              const selected = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 ${
                    selected
                      ? "border-emerald-900 bg-emerald-900 text-white shadow-sm"
                      : "border-stone-300 bg-white text-stone-700 hover:border-emerald-700 hover:text-emerald-900"
                  }`}
                >
                  {tab}
                  <span className={`ml-2 text-xs ${selected ? "text-emerald-100" : "text-stone-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {menuState.status === "success" && (
          visibleProducts.length > 0 ? (
            <ul data-testid="menu-grid" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center text-stone-500">
              Ch╞░a c├│ m├│n trong danh mß╗Ñc n├áy.
            </p>
          )
        )}
      </main>

      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(28,25,23,0.08)] backdrop-blur sm:p-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-1 sm:px-2">
            <div>
              <p className="text-sm font-semibold text-stone-900">
                {totalItems} m├│n trong giß╗Å
              </p>
              <p className="text-xs text-stone-500">Tß║ím t├¡nh</p>
            </div>
            <Link
              href="/cart"
              className="flex min-h-12 items-center gap-4 rounded-xl bg-emerald-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <span>Xem giß╗Å h├áng</span>
              <span>{new Intl.NumberFormat("vi-VN").format(cartTotal)}Γé½</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
