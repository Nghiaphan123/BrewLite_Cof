function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-stone-200 ${className}`} />;
}

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"
    />
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Đang tải đơn hàng" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4">
          <div className="w-1/2 space-y-2">
            <Block className="h-4 w-full" />
            <Block className="h-3 w-2/3" />
          </div>
          <div className="w-1/4 space-y-2">
            <Block className="h-5 w-full rounded-full" />
            <Block className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <main role="status" aria-label="Đang tải chi tiết sản phẩm" className="mx-auto max-w-md space-y-4 px-4 py-6">
      <Block className="h-4 w-24" />
      <Block className="aspect-[4/3] w-full rounded-2xl" />
      <Block className="h-7 w-3/4" />
      <Block className="h-5 w-1/3" />
      <div className="flex gap-2">
        <Block className="h-10 flex-1 rounded-xl" />
        <Block className="h-10 flex-1 rounded-xl" />
        <Block className="h-10 flex-1 rounded-xl" />
      </div>
      <Block className="h-24 w-full rounded-xl" />
      <Block className="h-12 w-full rounded-xl" />
    </main>
  );
}

export function DetailLinesSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="mt-4 space-y-3">
      <Block className="h-4 w-3/4" />
      <Block className="h-4 w-1/2" />
      <Block className="h-16 w-full rounded-xl" />
    </div>
  );
}
