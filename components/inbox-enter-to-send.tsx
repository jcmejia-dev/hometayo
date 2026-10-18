"use client";

import { useEffect } from "react";

export function InboxEnterToSend() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;

      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement) || target.id !== "message-body") return;

      event.preventDefault();
      if (!target.value.trim()) return;

      target.form?.requestSubmit();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
