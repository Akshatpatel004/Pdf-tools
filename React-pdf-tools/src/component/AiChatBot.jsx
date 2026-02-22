import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Paperclip,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const WEBHOOK_URL = import.meta.env.VITE_Flexxpdf_ai;

export default function AiChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sendMessage = async () => {
    if (!input && !selectedFile) return;

    const formData = new FormData();
    formData.append("userPrompt", input);
    formData.append("action", "chat");

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/pdf")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url);

        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "📄 Your PDF has been generated." },
        ]);
      } else {
        const data = await res.json();

        let aiText = "";

        if (Array.isArray(data)) {
          aiText = data[0]?.output || JSON.stringify(data);
        } else {
          aiText =
            data.output ||
            data.response ||
            data.text ||
            data.message?.content ||
            JSON.stringify(data);
        }

        setMessages((prev) => [
          ...prev,
          { role: "bot", text: aiText },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Something went wrong." },
      ]);
    }

    setLoading(false);
    removeFile();
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] rounded-full bg-blue-600 p-4 text-white shadow-2xl transition hover:scale-105 hover:bg-blue-700"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[9999] flex h-[75vh] w-[95%] max-w-md flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl backdrop-blur-xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-center font-semibold text-white">
            FlexxPDF AI Assistant
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-400">
                👋 Upload a PDF and ask your question.
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl p-3 text-sm shadow ${
                  msg.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-white text-black prose prose-sm max-w-none"
                }`}
              >
                {msg.role === "bot" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                AI is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="flex items-center justify-between bg-blue-50 px-3 py-2 text-xs">
              <span className="truncate text-blue-700">
                📎 {selectedFile.name}
              </span>
              <button onClick={removeFile}>
                <X size={16} className="text-red-500" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t bg-white p-3">
            <div className="flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-400">

              {/* Upload Icon */}
              <button
                type="button"
                disabled={selectedFile}
                onClick={() => fileRef.current.click()}
                className={`${
                  selectedFile
                    ? "cursor-not-allowed text-gray-400"
                    : "text-gray-500 hover:text-blue-600"
                }`}
              >
                <Paperclip size={18} />
              </button>

              <input
                type="file"
                ref={fileRef}
                hidden
                onChange={handleFileSelect}
              />

              <input
                type="text"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-transparent text-sm outline-none"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-full bg-blue-600 p-2 text-white transition hover:bg-blue-700"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
