"use client";

import { useActionState } from "react";

import {
  updateProfileAction,
  type ProfileState,
} from "@/app/account/profile/actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const initialState: ProfileState = { ok: true };

const inputClass =
  "w-full rounded-tag border border-hairline bg-cream px-4 py-3 text-body text-ink transition-colors duration-300 ease-out-soft placeholder:text-ink-faint hover:border-rose-200 focus:border-rose-400 focus:outline-none";

const labelClass =
  "font-label text-[0.7rem] tracking-[0.14em] text-ink-soft uppercase";

export function ProfileForm({
  firstName,
  lastName,
}: {
  firstName: string | null;
  lastName: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-panel border border-hairline bg-paper p-6 shadow-soft"
    >
      <h2 className="font-display text-heading-sm text-ink uppercase">
        Your details
      </h2>
      <p className="mt-2 text-body-sm text-ink-soft">
        The name used on your orders and deliveries.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>First name</span>
          <input
            type="text"
            name="firstName"
            defaultValue={firstName ?? ""}
            placeholder="First name"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Last name</span>
          <input
            type="text"
            name="lastName"
            defaultValue={lastName ?? ""}
            placeholder="Last name"
            className={inputClass}
          />
        </label>
      </div>

      {state.message && (
        <p
          className={cn(
            "mt-5 flex items-start gap-2.5 rounded-tag px-4 py-3 text-body-sm",
            state.ok ? "bg-mint/40 text-ink" : "bg-rose-50 text-rose-700",
          )}
        >
          <Icon
            name={state.ok ? "check" : "close"}
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={2.2}
          />
          {state.message}
        </p>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
