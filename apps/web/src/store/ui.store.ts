import { create } from 'zustand';

const MIN_LOADING_MS = 600;
const MAX_NAVIGATION_WAIT_MS = 8000;
const TOAST_MS = 2500;

interface UiState {
  loadingMessage: string | null;
  holdingForNavigation: boolean;
  toast: { id: number; message: string } | null;
  setLoadingMessage: (message: string | null) => void;
  holdLoadingUntilNavigation: () => void;
  releaseLoading: () => void;
  showToast: (message: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  loadingMessage: null,
  holdingForNavigation: false,
  toast: null,
  setLoadingMessage: (loadingMessage) => set({ loadingMessage }),
  // Gọi ngay trước router.push: màn hình load giữ tới khi đường dẫn đổi (AppFeedback), có giới hạn nếu điều hướng lỗi.
  holdLoadingUntilNavigation: () => {
    set({ holdingForNavigation: true });
    setTimeout(() => {
      if (get().holdingForNavigation) get().releaseLoading();
    }, MAX_NAVIGATION_WAIT_MS);
  },
  releaseLoading: () => set({ loadingMessage: null, holdingForNavigation: false }),
  showToast: (message) => {
    const id = Date.now();
    set({ toast: { id, message } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, TOAST_MS);
  },
}));

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Hiện màn hình load trong lúc chạy task; giữ tối thiểu một nhịp để không bị nháy khi API trả về quá nhanh. */
export async function runWithLoading<T>(message: string, task: () => Promise<T>): Promise<T> {
  const { setLoadingMessage, releaseLoading } = useUiStore.getState();
  setLoadingMessage(message);
  try {
    const [result] = await Promise.all([task(), wait(MIN_LOADING_MS)]);
    return result;
  } finally {
    if (!useUiStore.getState().holdingForNavigation) releaseLoading();
  }
}
