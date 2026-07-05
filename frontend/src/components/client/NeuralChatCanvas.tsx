"use client";

import { useState } from "react";
import { Send, Zap, ShieldAlert } from "lucide-react";

type ChatResponse = {
  user_query: string;
  items_retrieved_from_db: string[];
  ai_response: string;
};

export function NeuralChatCanvas() {
  const [query, setQuery] = useState("");
  const [chatLog, setChatLog] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setQuery("");
    setError(null);
    setIsTyping(true);

    // Optimistically add user message
    setChatLog(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      // Connect to Python FastAPI RAG backend dynamically
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_URL}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: userMessage })
      });

      if (!res.ok) throw new Error("FastAPI RAG Engine failed.");
      
      const data: ChatResponse = await res.json();
      
      setChatLog(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: data.ai_response, 
          vectors: data.items_retrieved_from_db 
        }
      ]);

    } catch (err: any) {
      console.error(err);
      setError("Python FastAPI (Port 8000) is offline. Cannot reach ChromaDB/Gemini.");
      setChatLog(prev => [...prev, { role: "system", content: "CRITICAL: RAG Engine disconnected." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-white tracking-tighter">Neural RAG Engine</h2>
        <p className="text-[#888888] text-sm">Query your vector database via Gemini 2.5 Flash.</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* The Chat Canvas */}
      <div className="bg-[rgba(20,20,20,0.4)] backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 min-h-[400px] flex flex-col">
        
        {/* Chat History */}
        <div className="flex-grow flex flex-col gap-6 mb-8 overflow-auto px-2">
          {chatLog.length === 0 && !isTyping && (
            <div className="m-auto text-[#555555] font-mono text-xs uppercase tracking-widest text-center flex flex-col items-center gap-4">
              <Zap className="w-8 h-8 opacity-50" />
              Vectors initialized. Awaiting input.
            </div>
          )}

          {chatLog.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {/* Message Bubble */}
              <div className={`px-6 py-4 rounded-2xl max-w-[80%] ${
                msg.role === "user" 
                  ? "bg-white text-black font-medium" 
                  : msg.role === "system"
                  ? "bg-red-900/50 border border-red-500/50 text-white font-mono text-xs uppercase tracking-widest"
                  : "bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.1)] text-white"
              }`}>
                {msg.content}
              </div>

              {/* Vector Hits (Glowing Accents) */}
              {msg.vectors && msg.vectors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.vectors.map((vec: string, vIdx: number) => (
                    <div key={vIdx} className="bg-black/60 backdrop-blur-md border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-lg px-3 py-1.5 text-white flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] font-mono tracking-widest uppercase">HIT: {vec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start">
              <div className="px-6 py-4 rounded-2xl bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.1)] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#888888] animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#888888] animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#888888] animate-bounce delay-200" />
              </div>
            </div>
          )}
        </div>

        {/* Armory Input Bar */}
        <form 
          onSubmit={handleAsk}
          className="w-full bg-[rgba(0,0,0,0.8)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-2 pl-6 pr-2 flex items-center justify-between"
        >
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isTyping}
            placeholder="Query the RAG vector database..." 
            className="bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-[#555555] w-full mr-4 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isTyping || !query.trim()}
            className="bg-white text-black w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-200 transition-colors shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
