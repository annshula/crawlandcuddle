"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title: string;
  description?: string;
  icon: IconName;
};

interface ToastContextValue {
  /** Shows a small on-brand confirmation toast, auto-dismissed after ~3.2s. */
  show: (toast: { title: string; description?: string; icon?: IconName }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3200;
let nextId = 0;

/**
 * A quiet, top-right-anchored confirmation toast, standing in for the cart
 * drawer on actions (like adding a pack from the PDP) that shouldn't yank the
 * shopper into a full panel every time. Sits just under the sticky header,
 * clear of the cart icon it's confirming an add for, and slides in from the
 * right — same direction the cart drawer itself opens from, so the motion
 * reads as "heading toward the bag." Same surface language as the rest of
 * the site's overlays (CartDrawer, ValueStack's popover): `rounded-panel`,
 * `shadow-drift`, a hairline border on `bg-paper`, GSAP for the motion with a
 * `prefersReducedMotion` fallback.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({
      title,
      description,
      icon = "check",
    }: {
      title: string;
      description?: string;
      icon?: IconName;
    }) => {
      const id = nextId++;
      setToasts((t) => [...t, { id, title, description, icon }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 top-[calc(var(--nav-height)+1rem)] z-90 flex flex-col items-center gap-2.5 sm:inset-x-auto sm:top-5 sm:right-5 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1 });
      return;
    }

    const tween = gsap.fromTo(
      el,
      { x: 32, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
    );
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div
      ref={ref}
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-panel border border-hairline bg-paper px-4 py-3.5 shadow-drift sm:w-auto",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-mint/60 text-ink">
        <Icon name={toast.icon} className="size-4" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-headline text-sm text-ink">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-body-sm text-ink-soft">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 text-ink-faint transition-colors duration-200 hover:text-rose-600"
      >
        <Icon name="close" className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
