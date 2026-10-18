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

  return (
    <style>{`
      .workspace-compose .chat-send {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0 !important;
        line-height: 0 !important;
      }

      .workspace-compose .chat-send svg {
        display: block;
        margin: 0;
        flex: 0 0 auto;
      }
    `}</style>
  );
}
