"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "cookie-notice";
const EVENT = "cookie-notice-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  return () => window.removeEventListener(EVENT, onStoreChange);
}

function isAccepted() {
  return localStorage.getItem(KEY) === "accepted";
}

export function CookieNotice() {
  const accepted = useSyncExternalStore(subscribe, isAccepted, () => true);
  if (accepted) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-4 shadow-lg">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6">
          Zorunlu yönetici oturumu dışında takip çerezi kullanılmıyor. Ayrıntılar{" "}
          <Link href="/cerez-politikasi" className="underline">
            çerez politikasında
          </Link>
          .
        </p>
        <button
          type="button"
          className="h-11 rounded-md bg-steel px-4 font-semibold text-white"
          onClick={() => {
            localStorage.setItem(KEY, "accepted");
            window.dispatchEvent(new Event(EVENT));
          }}
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
