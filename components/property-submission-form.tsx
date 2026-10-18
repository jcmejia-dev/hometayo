"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { createProperty } from "@/app/owner/actions";
import { uploadRentalPhotos } from "@/lib/client-rental-photo-upload";

export function PropertySubmissionForm({children}: {children: ReactNode}) {
  const [error,setError] = useState("");
  const [progress,setProgress] = useState("");
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
    const photos=form.elements.namedItem("photos");
    const files=photos instanceof HTMLInputElement&&photos.files?Array.from(photos.files):[];
    locked.current = true;
    setError("");
    setProgress("");
    startTransition(async () => {
      try {
        const data = new FormData(form);
        data.delete("photos");
        if(files.length){
          setProgress(`Uploading 0 of ${files.length} photos…`);
          const urls=await uploadRentalPhotos(files,(done,total)=>setProgress(`Uploading ${done} of ${total} photos…`));
          data.set("photoUrls",JSON.stringify(urls));
          setProgress("Photos uploaded. Publishing rental…");
        }else data.set("photoUrls","[]");
        const result = await createProperty(data);
        if (result?.error) showError(result.error);
      } catch (uploadError) {
        showError(uploadError instanceof Error?uploadError.message:"Could not upload the selected photos.");
      } finally {
        locked.current = false;
        setProgress("");
      }
    });
  }}>
    {children}
    {progress&&<p role="status" className="status-notice">{progress}</p>}
    {error && <div ref={feedback} role="alert" tabIndex={-1} className="status-notice submission-error"><strong>Your rental has not been submitted.</strong><p>{error}</p></div>}
    <button className="button button-primary" type="submit" disabled={pending}>
      {pending ? <><LoaderCircle size={18} className="submission-spinner"/>{progress||"Submitting…"}</> : "Publish rental"}
    </button>
  </form>;
}
