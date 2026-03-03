import React, { useState, useEffect } from "react";
import tools from "../data/tools.json";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config.js";

const Home = ({ searchQuery }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Filter tools based on the searchQuery passed from App.jsx props
  const filteredTools = tools.filter((tool) =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle between showing 4 tools or all filtered tools
  const displayedTools = showAll ? filteredTools : filteredTools.slice(0, 4);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-background-dark overflow-x-hidden">
      <div className="flex h-full grow flex-col">
        {/* Navbar is rendered in App.jsx to manage global visibility */}

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

                {/* Hero Image / Gradient Area */}
                <div className="lg:w-1/2 bg-slate-100 dark:bg-slate-800 relative h-48 md:h-64 lg:h-auto order-1 lg:order-2">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop")' }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-white dark:from-slate-900 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* Tools Grid Section */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-slate-900 dark:text-slate-100 text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">bolt</span>
                Popular Tools
              </h2>
              <span
                onClick={() => setShowAll(!showAll)}
                className="text-red-600 text-xs md:text-sm font-bold cursor-pointer hover:underline select-none bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-full"
              >
                {showAll ? "View Less" : "View All"}
              </span>
            </div>

            {/* Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500">
              {displayedTools.map((tool, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/tool/${tool.route}`)}
                  className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white dark:bg-slate-900 p-6 transition-all cursor-pointer border-b-4 border-b-primary/10 hover:border-b-red-500 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                    {tool.img ? (
                      <img src={tool.img} alt={tool.title} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl">description</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">{tool.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">
                      {tool.disc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State for Search */}
            {filteredTools.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500">No tools found matching "{searchQuery}"</p>
              </div>
            )}
          </section>
        </main>

        {/* Footer Section */}
        <footer className="bg-white dark:bg-slate-900 border-t border-primary/5 py-8 md:py-10 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-red-500 opacity-80">
              <span className="material-symbols-outlined font-bold">picture_as_pdf</span>
              <span className="font-bold text-sm uppercase tracking-widest">FlexXpdf</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm order-3 md:order-2">
              © 2026 FlexXpdf Inc.
            </p>
            <div className="flex gap-6 text-slate-500 dark:text-slate-400 text-xs md:text-sm order-2 md:order-3">
              <a className="hover:text-red-500 transition-colors" href="#">Privacy</a>
              <a className="hover:text-red-500 transition-colors" href="#">Terms</a>
              <a className="hover:text-red-500 transition-colors" href="#">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;