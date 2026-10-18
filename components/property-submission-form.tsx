"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { createProperty } from "@/app/owner/actions";

export function PropertySubmissionForm({children}: {children: ReactNode}) {
  const [error,setError] = useState("");
  const [pending,startTransition] = useTransition();
  const locked = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => feedback.current?.focus());
  }
  return <form className="owner-form info-card" noValidate aria-busy={pending} onSubmit={event => {
    event.preventDefault();
    if (locked.current) return;
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      const invalid = Array.from(form.elements).filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
        (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) && !element.validity.valid);
      showError(invalid.map(field => `${field.labels?.[0]?.textContent?.trim() || field.name}: ${field.validationMessage}`).join(" "));
      return;
    }
    const data = new FormData(form);
    locked.current = true;
    setError("");
    startTransition(async () => {
      try {
        const result = await createProperty(data);
        if (result?.error) showError(result.error);
      } catch {
        showError("Could not connect to HomeTayo. Your details have been kept. Check your connection and try again.");
      } finally {
        locked.current = false;
      }
    });
  }}>
    {children}
    {error && <div ref={feedback} role="alert" tabIndex={-1} className="status-notice submission-error"><strong>Your rental has not been submitted.</strong><p>{error}</p></div>}
    <button className="button button-primary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle size={18} className="submission-spinner"/>Submitting…</> : "Publish rental"}
    </button>
  </form>;
}
