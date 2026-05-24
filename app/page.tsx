"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StockInfo {
  warehouseId: string; warehouseName: string;
  warehouseLocation: string; available: number;
}
interface Product {
  id: string; name: string; description: string | null;
  imageUrl: string | null; stock: StockInfo[];
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json()).then(setProducts)
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  async function handleReserve(product: Product, stock: StockInfo) {
    const key = `${product.id}:${stock.warehouseId}`;
    setReserving(key); setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, warehouseId: stock.warehouseId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      router.push(`/checkout/${data.id}`);
    } finally { setReserving(null); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <p className="text-slate-400 animate-pulse">Loading inventory…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <h1 className="font-semibold text-slate-900">Allo Inventory</h1>
            <p className="text-xs text-slate-400">Multi-warehouse fulfillment</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex gap-4 p-5">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name}
                  className="w-20 h-20 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
              )}
              <div>
                <h2 className="font-semibold text-slate-900">{product.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{product.description}</p>
              </div>
            </div>

            <div className="border-t border-slate-100">
              {product.stock.map(stock => {
                const key = `${product.id}:${stock.warehouseId}`;
                const outOfStock = stock.available === 0;
                const lowStock = stock.available > 0 && stock.available <= 3;
                return (
                  <div key={stock.warehouseId}
                    className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${outOfStock ? "bg-red-400" : lowStock ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <span className="text-sm font-medium text-slate-700">{stock.warehouseName}</span>
                      <span className="text-xs text-slate-400">{stock.warehouseLocation}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${outOfStock ? "bg-red-50 text-red-600" : lowStock ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {outOfStock ? "Out of stock" : `${stock.available} left`}
                      </span>
                      <button onClick={() => handleReserve(product, stock)}
                        disabled={outOfStock || !!reserving}
                        className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-all ${outOfStock ? "bg-slate-100 text-slate-400 cursor-not-allowed" : reserving === key ? "bg-indigo-100 text-indigo-500" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"}`}>
                        {reserving === key ? "Reserving…" : "Reserve"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}