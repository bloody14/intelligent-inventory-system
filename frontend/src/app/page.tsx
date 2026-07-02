import { InventoryDashboard } from "@/components/client/InventoryDashboard";
import { NeuralChatCanvas } from "@/components/client/NeuralChatCanvas";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-dotted-grid flex flex-col items-center py-16 px-4 gap-24">
      {/* Header */}
      <header className="text-center w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#aaaaaa]">Dual Backend Architecture</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 drop-shadow-2xl">
          Armory RAG System
        </h1>
        <p className="text-[#888888] text-lg md:text-xl max-w-2xl text-center">
          Monitoring MongoDB via Node.js port :5000 and running intelligent ChromaDB Vector generation via Python FastAPI port :8000.
        </p>
      </header>

      {/* Main Grids */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-24">
        <InventoryDashboard />
        <NeuralChatCanvas />
      </div>
      
    </main>
  );
}
