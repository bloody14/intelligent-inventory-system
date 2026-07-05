"use client";

import { useState, useEffect } from "react";
import { Database, Plus, RefreshCw, AlertCircle } from "lucide-react";

export function InventoryDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      // Connect to the Node MongoDB backend at 5000
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError("Node.js MongoDB Backend (Port 5000) is offline or unreachable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, price: parseFloat(newPrice) })
      });
      
      if (!res.ok) throw new Error("Failed to ingest data");
      
      setNewName("");
      setNewPrice("");
      await fetchItems(); // Refresh the list
    } catch (err: any) {
      console.error(err);
      setError("Failed to sync item. Is the Node server running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white tracking-tighter">Inventory Telemetry</h2>
        <button 
          onClick={fetchItems} 
          className="flex items-center gap-2 text-[#888888] hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[10px] uppercase tracking-widest font-mono">Sync</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ingest Panel */}
        <div className="bg-[rgba(20,20,20,0.4)] backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 h-fit">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#888888]" />
            Ingest Vector
          </h3>
          <form onSubmit={handleIngest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[#888888] font-mono">Item Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white font-mono text-sm outline-none focus:border-white/40 transition-colors"
                placeholder="e.g. RTX 4090 GPU"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-[#888888] font-mono">Price (INR)</label>
              <input 
                type="number" 
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white font-mono text-sm outline-none focus:border-white/40 transition-colors"
                placeholder="150000"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-4 bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              EXECUTE SYNC
            </button>
          </form>
        </div>

        {/* Database List */}
        <div className="lg:col-span-2 bg-[rgba(20,20,20,0.4)] backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6">MongoDB Cluster</h3>
          
          <div className="flex-grow overflow-auto">
            {loading && items.length === 0 ? (
              <div className="w-full h-32 flex items-center justify-center text-[#888888] font-mono text-sm uppercase tracking-widest">
                Fetching Data...
              </div>
            ) : items.length === 0 ? (
              <div className="w-full h-32 flex items-center justify-center text-[#888888] font-mono text-sm uppercase tracking-widest">
                Cluster is empty.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item, idx) => (
                  <div key={item._id || idx} className="bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.2)] transition-colors rounded-xl p-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white font-bold tracking-tight">{item.name}</span>
                      <span className="text-[#888888] text-[10px] font-mono uppercase tracking-widest mt-1">ID: {item._id}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-white font-mono font-bold tracking-tighter text-xl">₹{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
