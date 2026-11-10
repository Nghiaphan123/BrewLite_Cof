"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { calculateUnitPrice } from "@/features/product/pricing";
import { useCartStore } from "@/store/cart.store";
import { useUiStore } from "@/store/ui.store";
import { isOutOfStock, remainingForCart } from "@/features/product/stock";
import type { Product, SizeOption } from "@/types";

export type MenuProduct = Product & {
  imageUrl: string;
};

type ProductCardProps = {
  product: MenuProduct;
};

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

const SIZES: SizeOption[] = ["S", "M", "L"];

const iconProps = {
  "aria-hidden": true,
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function CartIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
    </svg>
  );
}

function PayIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const showToast = useUiStore((state) => state.showToast);
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [size, setSize] = useState<SizeOption>("M");
  const unitPrice = calculateUnitPrice(product.price, size, []);
  // Mục 5: món hết hàng (hoặc giỏ đã có đủ số ly còn lại) thì không cho thêm nhanh.
  const outOfStock = isOutOfStock(product);
  const canAdd = remainingForCart(product, cartItems) > 0;

  function addToCart() {
    if (!canAdd) return;
    addItem(product, size, []);
    setAdded(true);
    showToast(`Đã thêm ${product.name} (size ${size}) vào giỏ`);
  }

  function buyNow() {
    if (!canAdd) return;
    addItem(product, size, []);
    router.push("/checkout");
  }

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <Link
        href={`/products/${product.id}`}
        aria-label={`Xem chi tiết ${product.name}`}
        className="relative block aspect-[4/3] overflow-hidden bg-stone-100 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-emerald-800"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            unoptimized
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${outOfStock ? "grayscale" : ""}`}
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full items-center justify-center text-5xl"
          >
            ☕
          </span>
        )}
        {outOfStock && (
          <span
            data-testid={`out-of-stock-${product.id}`}
            className="absolute left-2 top-2 rounded-full bg-stone-900/85 px-2.5 py-1 text-xs font-bold text-white"
          >
            Hết hàng
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/products/${product.id}`} className="focus-visible:outline-2 focus-visible:outline-emerald-800">
          <h3 className="line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-stone-900 sm:text-base">
            {product.name}
          </h3>
        </Link>
        <div
          role="radiogroup"
          aria-label={`Chọn size cho ${product.name}`}
          className="mt-2 grid grid-cols-3 gap-1.5"
        >
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              aria-label={`Size ${s}`}
              data-testid={`card-size-${product.id}-${s}`}
              onClick={() => setSize(s)}
              className={`min-h-9 rounded-lg border text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:text-sm ${
                size === s
                  ? "border-emerald-900 bg-emerald-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-emerald-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-stone-600">
          Giá:{" "}
          <span data-testid={`card-price-${product.id}`} className="text-base font-bold text-emerald-900">
            {formatPrice(unitPrice)}
          </span>
        </p>
        <Link
          href={`/products/${product.id}`}
          className="mt-1 text-xs font-medium text-emerald-700 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-800"
        >
          Xem chi tiết →
        </Link>
        {canAdd ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
              onClick={addToCart}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-900 px-2 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:text-sm"
            >
              {added ? "Đã thêm" : "Thêm vào giỏ"}
              <CartIcon />
            </button>
            <button
              type="button"
              aria-label={`Mua ngay ${product.name}`}
              onClick={buyNow}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-900 bg-emerald-900 px-2 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:text-sm"
            >
              Mua ngay
              <PayIcon />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled
            aria-label={outOfStock ? `${product.name} đã hết hàng` : `Giỏ đã có hết số ${product.name} còn lại`}
            className="mt-auto flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl border border-stone-300 bg-stone-100 px-2 py-2 text-xs font-semibold text-stone-500 sm:px-3 sm:text-sm"
          >
            {outOfStock ? "Hết hàng" : "Đã đủ trong giỏ"}
          </button>
        )}
      </div>
    </article>
  );
}