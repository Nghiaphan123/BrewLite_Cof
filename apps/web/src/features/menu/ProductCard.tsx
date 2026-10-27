"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart.store";
import type { Product } from "@/types";

type ProductCardProps = {
  product: Product;
};

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  function addToCart() {
    addItem(product, "M", []);
    setAdded(true);
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
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full items-center justify-center text-5xl"
          >
            ☕
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link href={`/products/${product.id}`} className="focus-visible:outline-2 focus-visible:outline-emerald-800">
          <h3 className="line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-stone-900 sm:text-base">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-xs text-stone-500">Giá size S</p>
        <p className="text-base font-bold text-emerald-900">
          {formatPrice(product.price)}
        </p>
        <button
          type="button"
          aria-label={`Thêm nhanh ${product.name} vào giỏ`}
          onClick={addToCart}
          className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-900 px-3 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:text-sm"
        >
          <span aria-hidden="true">{added ? "✓" : "+"}</span>
          {added ? "Đã thêm · size M" : "Thêm nhanh · size M"}
        </button>
      </div>
    </article>
  );
}