"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Reservation {
  id: string; productName: string; warehouseName: string;
  quantity: number; status: string;
  expiresAt: string; createdAt: string;
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [state, setState] = useState<"loading"|"active"|"confirmed"|"released"|"expired"|"error">("loading");
  const [timeLeft, setTimeLeft] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`/api/reservations/${params.id}`)
      .then(r => r.json())
      .then((data: Reservation) => {
        setReservation(data);
        const secs = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000);
        if (data.status === "CONFIRMED") setState("confirmed");
        else if (data.status === "RELEASED" || secs <= 0) setState("expired");
        else { setTimeLeft(secs); setState("active"); }
      })
      .catch(() => setState("error"));
  }, [params.id]);

  useEffect(() => {
    if (state !== "active") return;
    timer.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer.current!); setState("expired"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current!);
  }, [state]);

  async function handleConfirm() {
    setProcessing(true); setError(null);
    try {
      const res = await fetch(`/api/reservations/${params.id}/confirm`, { method: "POST" });
      const data = await res.json();
      if (res.status === 410) { setState("expired"); setError("Reservation expired before we could confirm."); return; }
      if (!res.ok) { setError(data.error ?? "Confirmation failed"); return; }
      setState("confirmed");
    } finally { setProcessing(false); }
  }

  async function handleCancel() {
    setProcessing(true);
    try {
      await fetch(`/api/reservations/${params.id}/release`, { method: "POST" });
      setState("released");
    } finally { setProcessing(false); }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const urgent = timeLeft < 60;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-xl mx-auto">
          <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to products
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">

        {state === "loading" && <p className="text-center text-slate-400 animate-pulse">Loading…</p>}

        {state === "confirmed" && (
          <div className="bg-white rounded-xl border border-emerald-200 p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
            <h2 className="text-xl font-semibold text-slate-900">Order confirmed!</h2>
            <p className="text-slate-500">{reservation?.productName}</p>
            <p className="text-xs text-slate-400">from {reservation?.warehouseName}</p>
            <button onClick={() => router.push("/")} className="mt-4 text-sm text-indigo-600 hover:underline">Back to products</button>
          </div>
        )}

        {state === "released" && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <h2 className="text-lg font-medium text-slate-700">Reservation cancelled</h2>
            <p className="text-slate-400 text-sm">Stock returned to available inventory.</p>
            <button onClick={() => router.push("/")} className="mt-4 text-sm bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700">Browse products</button>
          </div>
        )}

        {(state === "expired" || state === "error") && (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto text-2xl">⏱</div>
            <h2 className="text-lg font-semibold text-slate-900">
              {state === "error" ? "Reservation not found" : "Reservation expired"}
            </h2>
            <p className="text-slate-500 text-sm">{error ?? "Your 10-minute hold has passed. Units returned to stock."}</p>
            <button onClick={() => router.push("/")} className="mt-4 text-sm bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700">Start over</button>
          </div>
        )}

        {state === "active" && reservation && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-5 ${urgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Reservation expires in</p>
              <p className={`text-5xl font-mono font-bold tabular-nums ${urgent ? "text-red-600" : "text-amber-700"}`}>
                {mins}:{secs}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="px-5 py-4">
                <h2 className="font-semibold text-slate-900 text-lg">{reservation.productName}</h2>
                <p className="text-sm text-slate-500">Ships from {reservation.warehouseName}</p>
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Quantity</p>
                  <p className="font-medium text-slate-800">{reservation.quantity} unit</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Status</p>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">● Pending</span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Reservation ID</p>
                  <p className="font-mono text-xs text-slate-400">{reservation.id}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={processing}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${processing ? "bg-indigo-200 text-indigo-400" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"}`}>
                {processing ? "Processing…" : "Confirm purchase"}
              </button>
              <button onClick={handleCancel} disabled={processing}
                className="px-5 py-3 rounded-xl font-medium text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}