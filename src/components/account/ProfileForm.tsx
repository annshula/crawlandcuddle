"use client";

import { useActionState } from "react";

import {
  updateProfileAction,
  type ProfileState,
} from "@/app/account/profile/actions";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const initialState: ProfileState = { ok: true };

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

  const inputClass =
    "w-full rounded-tag border border-hairline bg-cream px-4 py-3 text-body text-ink placeholder:text-ink-faint focus:border-rose-400 focus:outline-none";

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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-label text-[0.7rem] tracking-[0.14em] text-ink-soft uppercase">
            First name
          </span>
          <input
            type="text"
            name="firstName"
            defaultValue={firstName ?? ""}
            placeholder="First name"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-label text-[0.7rem] tracking-[0.14em] text-ink-soft uppercase">
            Last name
          </span>
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
            "mt-4 rounded-tag px-4 py-3 text-body-sm",
            state.ok ? "bg-mint/40 text-ink" : "bg-rose-50 text-rose-700",
          )}
        >
          {state.message}
        </p>
      )}

      <div className="mt-5">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
