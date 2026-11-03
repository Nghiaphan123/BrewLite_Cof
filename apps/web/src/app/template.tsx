import type { ReactNode } from 'react';

// Chỉ đổi opacity: transform sẽ làm sai vị trí các phần tử fixed/sticky bên trong trang.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 animate-page-in flex-col">{children}</div>;
}
