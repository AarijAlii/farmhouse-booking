"use client";

import { useRef, useState } from "react";
import { CircleCheck, ImagePlus, Loader2, X } from "lucide-react";

export function UploadProof({
  bookingRef,
  phone,
  onUploaded,
}: {
  bookingRef: string;
  phone: string;
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function pick(f: File | null) {
    setError("");
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("phone", phone);
      form.set("file", file);
      const res = await fetch(`/api/bookings/${bookingRef}/proof`, { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed, please try again");
      setDone(true);
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed, please try again");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-800 ring-1 ring-emerald-200">
        <CircleCheck className="h-5 w-5 shrink-0" />
        <p className="text-[14.5px] font-medium">Screenshot received — we’ll verify it shortly.</p>
      </div>
    );
  }

  return (
    <div>
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 py-10 text-stone-500 transition-colors hover:border-emerald-700 hover:text-emerald-800"
        >
          <ImagePlus className="h-7 w-7" />
          <span className="text-[14.5px] font-medium">Tap to add your receipt screenshot</span>
          <span className="text-[12.5px] text-stone-400">JPEG, PNG or WebP · up to 5 MB</span>
        </button>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Receipt preview" className="h-24 w-16 rounded-lg object-cover ring-1 ring-stone-200" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-stone-800">{file.name}</p>
            <p className="text-[12.5px] text-stone-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />

      {error && (
        <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-[13.5px] text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      {file && (
        <button
          onClick={upload}
          disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-900 px-7 py-3.5 text-[15px] font-medium text-emerald-50 transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-900/50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Uploading..." : "Send screenshot for verification"}
        </button>
      )}
    </div>
  );
}
