import Image from "next/image";
import Link from "next/link";

export type MenuProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
};

type ProductCardProps = {
  product: MenuProduct;
};

const formatPrice = (price: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      aria-label={`Xem chi tiết ${product.name}`}
      className="group block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          unoptimized
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h2 className="truncate text-base font-semibold text-zinc-900">
          {product.name}
        </h2>
        <p className="mt-2 text-sm font-medium text-zinc-700">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}