"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard, type MenuProduct } from "./ProductCard";

type ProductsResponse = {
  items: MenuProduct[];
  total: number;
};

type MenuState =
  | { status: "loading" }
  | { status: "success"; products: MenuProduct[] }
  | { status: "empty" }
  | { status: "error"; message: string };

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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

async function fetchProducts(signal: AbortSignal): Promise<MenuProduct[]> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Không thể tải menu (HTTP ${response.status}).`);
  }

  const body: unknown = await response.json();
  if (!isProductsResponse(body)) {
    throw new Error("Dữ liệu menu từ máy chủ không đúng định dạng.");
  }

  return body.items;
}

function MenuSkeleton() {
  return (
    <div
      aria-label="Đang tải menu"
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
              : "Đã xảy ra lỗi khi tải menu.",
        });
      });

    return () => controller.abort();
  }, [retryCount]);

  function retry() {
    setMenuState({ status: "loading" });
    setRetryCount((count) => count + 1);
  }

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900"
          >
            BrewLite
          </Link>
          <Link
            href="/cart"
            aria-label="Giỏ hàng, hiện có 0 sản phẩm"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Giỏ hàng
            <span className="sr-only">, 0 sản phẩm</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
          <p className="mt-2 text-zinc-600">
            Chọn món đồ uống yêu thích của bạn.
          </p>
        </div>

        {menuState.status === "loading" && <MenuSkeleton />}

        {menuState.status === "empty" && (
          <p
            role="status"
            className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center text-zinc-600"
          >
            Menu đang cập nhật. Vui lòng quay lại sau.
          </p>
        )}

        {menuState.status === "error" && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-white px-6 py-10 text-center"
          >
            <p className="text-red-700">{menuState.message}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Thử lại
            </button>
          </div>
        )}

        {menuState.status === "success" && (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {menuState.products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}