import React, { useState, useEffect } from "react";
import tools from "../data/tools.json";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config.js";
import Footer from "../component/Footer.jsx";
import { triggerAdOnce } from "../App.jsx"

const Home = ({ searchQuery }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Popular Tools": return "bolt";
      case "Convert to PDF": return "picture_as_pdf";
      case "Convert from PDF": return "unarchive";
      case "Edit & Security": return "shield_lock";
      case "Optimize PDF": return "low_priority"; // Changed from FileDown to match style
      case "Image Editor": return "auto_fix_high"; // Suggestion for your new category
      default: return "category";
    }
  };

  const filteredTools = tools.filter((tool) =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allCategories = [...new Set(tools.map(tool => tool.Category))].sort((a, b) => {
    if (a === "Popular Tools") return -1;
    if (b === "Popular Tools") return 1;
    return 0;
  });

  const handleToolClick = (path) => {
    // 1. Open your HilltopAds Direct URL in a new tab
    triggerAdOnce();
    // 2. Navigate the user to the actual tool page in the current tab
    navigate(path);
  };

  const handleJoinBot = () => {
    window.open(import.meta.env.VITE_telegram_bot_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-background-dark overflow-x-hidden font-sans">

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowQR(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>

            <div className="text-center">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Scan for Telegram Bot</h3>
              <p className="text-sm text-slate-500 mb-6">Open your camera or Telegram to scan</p>

              <div className="mx-auto flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 p-4">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://t.me/Flexxpdf_bot"
                  alt="Telegram Bot QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="mt-6 text-xs font-bold text-[#24A1DE] uppercase tracking-widest">@Flexxpdf_bot</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-full grow flex-col">
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">

          {/* Hero Section */}
          <section className="mb-8 md:mb-12">
            <div className="rounded-2xl md:rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-primary/5">
              <div className="flex flex-col lg:flex-row">
                <div className="flex flex-col justify-center p-6 md:p-12 lg:w-1/2 gap-4 md:gap-6 order-2 lg:order-1">
                  <div className="space-y-3 md:space-y-4 text-center lg:text-left">
                    <h1 className="text-slate-900 dark:text-slate-100 text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                      The Ultimate <span className="text-red-500 text-nowrap">PDF</span> Solution
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm md:text-lg max-w-md mx-auto lg:mx-0 mt-3">
                      Every tool you need to use PDFs. All 100% FREE. Merge, Convert, and Edit with just a few clicks.
                    </p>
                  </div>
                  <div className="flex justify-center lg:justify-start pt-2">
                    {!user && (
                      <button
                        onClick={() => navigate("/login")}
                        className="w-full sm:w-auto flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-12 px-8 bg-red-500 text-white text-base font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform hover:opacity-90"
                      >
                        Get Started
                      </button>
                    )}
                  </div>
                </div>
                <div className="lg:w-1/2 bg-slate-100 dark:bg-slate-800 relative h-48 md:h-64 lg:h-auto order-1 lg:order-2">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop")' }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white dark:from-slate-900 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* Telegram Banner */}
          {searchQuery === "" && (
            <section className="mb-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:py-4 md:px-8 rounded-2xl bg-[#24A1DE] shadow-md border border-blue-400/20 transition-all">
                <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-white shadow-sm">
                    <svg className="w-7 h-7 fill-[#24A1DE]" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white text-lg font-extrabold leading-tight">FlexXpdf is now on Telegram!</h2>
                    <p className="text-blue-50 text-xs mt-0.5 opacity-90">Edit PDFs directly in Telegram. Fast, secure, and always available.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQR(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white hover:text-[#24A1DE] transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                  </button>

                  <button
                    onClick={handleJoinBot}
                    className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-2.5 font-bold text-[#24A1DE] shadow-sm transition-all hover:bg-blue-50 active:scale-95 cursor-pointer text-sm"
                  >
                    Join Bot
                    <span className="material-symbols-outlined text-base font-bold">open_in_new</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {allCategories.map((categoryName) => {
            const categoryTools = filteredTools.filter(t => t.Category === categoryName);
            if (categoryTools.length === 0) return null;

            return (
              <section key={categoryName} className="mb-12">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h2 className="text-slate-900 dark:text-slate-100 text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500 font-normal">
                      {getCategoryIcon(categoryName)}
                    </span>
                    {categoryName}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500">
                  {categoryTools.map((tool, idx) => (
                    <div key={idx} onClick={() => handleToolClick(`/tool/${tool.route}`)} className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white dark:bg-slate-900 p-6 transition-all cursor-pointer border-b-4 border-b-primary/10 hover:border-b-red-500 hover:-translate-y-1 hover:shadow-md">
                      <div className="w-16 h-16 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                        {tool.img ? <img src={tool.img} alt={tool.title} className="w-20 h-20 object-contain" /> : <span className="material-symbols-outlined text-3xl">description</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">{tool.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">{tool.disc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Home;