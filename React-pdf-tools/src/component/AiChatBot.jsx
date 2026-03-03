import { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  Paperclip,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const WEBHOOK_URL = import.meta.env.VITE_Flexxpdf_ai;

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I see you were working on a PDF. Would you like me to translate, Summarize, create MCQs, or generate questions from it?", 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendMessage = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend && !selectedFile) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentFile = selectedFile;

    setMessages((prev) => [...prev, { 
        role: "user", 
        text: textToSend, 
        fileName: currentFile ? currentFile.name : null,
        time: currentTime 
    }]);

    const formData = new FormData();
    formData.append("userPrompt", textToSend);
    formData.append("action", "chat");
    if (selectedFile) formData.append("file", selectedFile);

    if (!customText) setInput("");
    removeFile(); 
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });
      const contentType = res.headers.get("content-type");
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (contentType?.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url);
        setMessages((prev) => [...prev, { role: "bot", text: "📄 Your PDF has been generated.", time: botTime }]);
      } else {
        const data = await res.json();
        let aiText = data.output || data.response || data.text || data.message?.content || JSON.stringify(data);
        setMessages((prev) => [...prev, { role: "bot", text: aiText, time: botTime }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "⚠️ Something went wrong. Please check you have upload the FILE !", time: "" }]);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .typing-dot {
          width: 4px;
          height: 4px;
          background: #ef4444;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full bg-red-500 p-3 text-white shadow-2xl transition hover:scale-105"
        >
          <span className="material-symbols-outlined text-2xl">smart_toy</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] flex h-[80vh] w-[90%] max-w-[380px] flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl border border-gray-100">

          {/* Header */}
          <div className="relative flex items-center justify-between bg-red-500 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-white/20 p-1.5 backdrop-blur-md">
                <span className="material-symbols-outlined text-xl">smart_toy</span>
              </div>
              <div>
                <h4 className="text-sm font-bold leading-none tracking-tight">FLEXXPDF ASSISTANT</h4>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium opacity-90">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                  Online
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-black/10 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8F9FA] p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {/* Bot max-width increased by 2px (86%) */}
                <div className={`flex items-start gap-2 ${msg.role === "bot" ? "max-w-[86%]" : "max-w-[85%]"}`}>
                  {msg.role === "bot" && (
                    <div className="mt-1 shrink-0 flex items-center justify-center rounded-full bg-white p-1 shadow-sm">
                      <span className="material-symbols-outlined text-red-500 text-sm">smart_toy</span>
                    </div>
                  )}
                  <div className={`relative rounded-2xl px-3 py-2 shadow-sm text-sm ${msg.role === "user"
                      ? "bg-red-500 text-white rounded-tr-none"
                      : "bg-white border border-gray-100 text-slate-800 rounded-tl-none"
                    }`}>
                    
                    {msg.fileName && (
                      <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/20 p-2 border border-white/30">
                        <FileText size={16} className={msg.role === "user" ? "text-white" : "text-red-500"} />
                        <span className="text-[11px] font-medium truncate max-w-[150px]">{msg.fileName}</span>
                      </div>
                    )}

                    <div className="prose prose-sm prose-slate break-words leading-relaxed text-inherit">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                    <div className={`mt-1 text-[9px] text-right ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2 max-w-[86%]">
                <div className="mt-1 shrink-0 flex items-center justify-center rounded-full bg-white p-1 shadow-sm">
                  <span className="material-symbols-outlined text-red-500 text-sm">smart_toy</span>
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Area */}
          <div className="bg-white px-4 pb-4 pt-2 border-t">
            {!loading && (
              <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar py-1">
                {["Summarize", "Translate in Hindi", "Generate 20 MCQ", "Generate 10 short question"].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-500 active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* File Selection Display (ABOVE the textbox) */}
            {selectedFile && (
              <div className="mb-2 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg p-2 animate-in fade-in slide-in-from-bottom-1">
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} className="text-red-500 shrink-0" />
                  <span className="text-[11px] font-bold text-red-600 truncate">{selectedFile.name}</span>
                </div>
                <button onClick={removeFile} className="p-1 hover:bg-red-200 rounded-full transition-colors">
                  <X size={14} className="text-red-500" />
                </button>
              </div>
            )}

            {/* Input pill */}
            <div className="relative flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1.5 focus-within:ring-1 focus-within:ring-red-200 focus-within:bg-white border border-transparent transition-all">
              
              <button
                disabled={!!selectedFile}
                onClick={() => fileRef.current.click()}
                className={`${selectedFile ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'} transition-colors`}
              >
                <Paperclip size={18} />
              </button>
              
              <input type="file" ref={fileRef} hidden onChange={handleFileSelect} />
              
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-transparent py-1.5 text-xs outline-none text-slate-700"
              />

              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="flex items-center justify-center text-red-500 hover:bg-red-50 p-1.5 rounded-full disabled:opacity-30"
              >
                <Send size={18} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
