import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Accepted-payment brand marks, shown under the CTA in place of a plain
 * "secure checkout" line — the row itself is the reassurance. Google Pay,
 * Apple Pay and Mastercard are drawn as inline SVG (no external logo file);
 * Visa uses the real brand asset at public/images/payments/visa.png. Each
 * mark sits on its own neutral chip so it reads on both the cream and paper
 * section backgrounds this panel can sit on.
 */
const methods: { name: string; mark: React.ReactNode }[] = [
  {
    name: "Google Pay",
    mark: (
      <svg viewBox="0 0 48 20" className="h-3.5 w-auto" aria-hidden="true">
        <path
          d="M22.7 10.2v4.4h-1.4V4.4h3.6c.9 0 1.7.3 2.3.9.6.6 1 1.4 1 2.2 0 .9-.3 1.6-1 2.2-.6.6-1.4.9-2.3.9h-2.2zm0-4.5v3.2h2.3c.5 0 1-.2 1.3-.5.4-.4.5-.8.5-1.2 0-.5-.2-.9-.5-1.2-.3-.3-.8-.5-1.3-.5h-2.3z"
          fill="#5F6368"
        />
        <path
          d="M31.6 7.7c1 0 1.8.3 2.3.8.6.5.9 1.2.9 2.1v4h-1.3v-.9h-.1c-.5.8-1.3 1.2-2.2 1.2-.8 0-1.4-.2-2-.7-.5-.5-.8-1-.8-1.7 0-.7.3-1.3.8-1.7.6-.4 1.3-.6 2.2-.6.8 0 1.4.1 1.9.4v-.3c0-.4-.2-.8-.5-1.1-.4-.3-.8-.5-1.3-.5-.7 0-1.3.3-1.7.9l-1.2-.8c.7-1 1.7-1.1 2-1.1zm-1.8 4.7c0 .3.1.6.4.8.3.2.6.3 1 .3.5 0 1-.2 1.4-.6.4-.4.6-.8.6-1.4-.4-.3-1-.5-1.7-.5-.5 0-1 .1-1.3.4-.3.2-.4.5-.4 1z"
          fill="#5F6368"
        />
        <path
          d="M42 8l-4.7 10.8h-1.4l1.7-3.8L34.5 8H36l2 4.9h0L40 8h2z"
          fill="#5F6368"
        />
        <path
          d="M16.9 9.7c0-.4 0-.9-.1-1.3h-5.4v2.5h3.1a2.7 2.7 0 0 1-1.1 1.8v1.5h1.8c1-1 1.7-2.5 1.7-4.5z"
          fill="#4285F4"
        />
        <path
          d="M11.4 15.8c1.5 0 2.8-.5 3.7-1.4l-1.8-1.4c-.5.3-1.1.5-1.9.5-1.5 0-2.7-1-3.2-2.3H6.4v1.5a5.8 5.8 0 0 0 5 3.1z"
          fill="#34A853"
        />
        <path
          d="M8.2 11.2a3.5 3.5 0 0 1 0-2.2V7.5H6.4a5.8 5.8 0 0 0 0 5.2l1.8-1.5z"
          fill="#FBBC04"
        />
        <path
          d="M11.4 6.7c.8 0 1.6.3 2.2.9l1.6-1.6a5.7 5.7 0 0 0-3.8-1.5 5.8 5.8 0 0 0-5 3.1l1.8 1.5c.5-1.4 1.7-2.4 3.2-2.4z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    name: "Apple Pay",
    mark: (
      <svg viewBox="0 0 48 20" className="h-3.5 w-auto" aria-hidden="true">
        <path
          d="M9.4 5.5c.5-.6.9-1.5.8-2.3-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.4-.8 2.2.8.1 1.6-.4 2.1-1z"
          fill="#000"
        />
        <path
          d="M10.2 6.7c-1.1-.1-2.1.6-2.6.6-.5 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8-1.2 2.2-.3 5.4.9 7.2.6.9 1.3 1.9 2.3 1.8 1-.1 1.3-.6 2.4-.6s1.4.6 2.4.6c1 0 1.6-.9 2.2-1.7.7-1 1-1.9 1-2 0 0-1.9-.7-1.9-2.9 0-1.9 1.5-2.7 1.6-2.8-.9-1.3-2.3-1.4-2.7-1.4z"
          fill="#000"
        />
        <path
          d="M20.1 4.1c2.1 0 3.5 1.4 3.5 3.5s-1.5 3.5-3.6 3.5h-2.3v3.6h-1.6V4.1h4zm-2.4 5.6h1.9c1.4 0 2.2-.8 2.2-2.1s-.8-2.1-2.2-2.1h-1.9v4.2z"
          fill="#000"
        />
        <path
          d="M24 12.6c0-1.4 1-2.2 2.9-2.3l2-.1v-.6c0-.8-.6-1.3-1.5-1.3-.8 0-1.4.4-1.5 1h-1.5c.1-1.4 1.4-2.4 3.1-2.4 1.9 0 3 1 3 2.6v5.4h-1.5v-1.3h0c-.4.8-1.4 1.4-2.4 1.4-1.5 0-2.6-.9-2.6-2.4zm4.9-.7v-.6l-1.8.1c-.9.1-1.4.5-1.4 1.1 0 .6.5 1 1.3 1 1 0 1.9-.7 1.9-1.6z"
          fill="#000"
        />
        <path
          d="M31.6 17.6v-1.3c.1 0 .4.1.6.1.7 0 1.1-.3 1.3-1.1l.1-.4-2.6-7.3h1.7l1.8 5.9h0l1.8-5.9h1.7l-2.7 7.7c-.6 1.8-1.3 2.4-2.8 2.4-.1-.1-.5-.1-.9-.1z"
          fill="#000"
        />
      </svg>
    ),
  },
  {
    name: "Visa",
    mark: (
      <Image
        src="/images/payments/visa.png"
        alt="Visa"
        width={48}
        height={20}
        className="h-4 w-auto object-contain"
      />
    ),
  },
  {
    name: "Mastercard",
    mark: (
      <svg viewBox="0 0 32 20" className="h-4 w-auto" aria-hidden="true">
        <circle cx="12" cy="10" r="7" fill="#EB001B" />
        <circle cx="20" cy="10" r="7" fill="#F79E1B" />
        <path d="M16 4.5a7 7 0 0 1 0 11 7 7 0 0 1 0-11z" fill="#FF5F00" />
      </svg>
    ),
  },
];

export function PaymentIcons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <span className="font-headline text-body-sm text-ink-soft">
        Pay with
      </span>
      <ul className="flex flex-wrap items-center gap-2">
        {methods.map((m) => (
          <li
            key={m.name}
            title={m.name}
            className="flex h-8 items-center justify-center rounded-tag border border-hairline bg-paper px-3"
          >
            {m.mark}
          </li>
        ))}
      </ul>
    </div>
  );
}
