"use client";

import { useEffect, useState } from "react";
import { getHealth, type Health } from "@/lib/api";

type Status = "waking" | "online" | "offline";

const STYLES: Record<Status, { dot: string; text: string }> = {
  waking: { dot: "bg-amber-500 animate-pulse", text: "Waking server" },
  online: { dot: "bg-emerald-600", text: "Live" },
  offline: { dot: "bg-rose-600", text: "Offline" },
};

export default function ApiStatus({ onHealth }: { onHealth?: (h: Health) => void }) {
  const [status, setStatus] = useState<Status>("waking");

  useEffect(() => {
    let tries = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    // Render's free tier sleeps after inactivity; retry for ~60s while it wakes
    const ping = async () => {
      const health = await getHealth();
      if (stopped) return;
      if (health) {
        setStatus("online");
        onHealth?.(health);
        return;
      }
      if (++tries >= 12) return setStatus("offline");
      timer = setTimeout(ping, 5000);
    };
    ping();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [onHealth]);

  const s = STYLES[status];
  return (
    <div className="inline-flex items-center gap-2 border border-line bg-ivory/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ink/70 backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.text}
    </div>
  );
}
