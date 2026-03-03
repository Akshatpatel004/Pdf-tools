import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase-config.js";

const Navbar = ({ searchQuery, setSearchQuery, showSearch }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showPop, setShowPop] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setShowPop(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setShowPop(false);
            navigate("/login");
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-background-dark px-4 md:px-10 py-3 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4 md:gap-8">
                <div className="flex items-center gap-2 text-primary cursor-pointer" onClick={() => navigate("/")}>
                    <span className="material-symbols-outlined text-2xl md:text-3xl font-bold">picture_as_pdf</span>
                    <h2 className="text-red-500 dark:text-red-500 text-lg md:text-xl font-bold tracking-tight">FlexXpdf</h2>
                </div>
            </div>

            <div className="flex flex-1 justify-end gap-3 md:gap-6 items-center">

                {/* Conditional Search Bar: Only shows if showSearch is true */}
                {showSearch && (
                    <div className="relative hidden sm:flex items-center w-full max-w-[120px] md:max-w-64 animate-in fade-in duration-300 border-2">
                        <div className="absolute left-3 text-slate-500">
                            <span className="material-symbols-outlined text-xl pt-2 ">search</span>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-200/50 dark:bg-white/10 border-none focus:ring-2 focus:ring-red-500/50 text-sm text-slate-900"
                            placeholder="Search tools..."
                        />
                    </div>
                )}

                <div className="relative" ref={popoverRef}>
                    {user ? (
                        <>
                            <img
                                src={user?.photoURL || "/icons/sign in.jpeg"}
                                alt="profile"
                                className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-primary/20 cursor-pointer object-cover"
                                onClick={() => setShowPop(!showPop)}
                            />
                            {showPop && (
                                <div className="absolute right-0 mt-3 p-4 shadow-2xl rounded-2xl bg-white dark:bg-slate-900 border border-primary/10 w-[280px] md:w-64 z-[100]">
                                    <div className="text-center">
                                        <img src={user.photoURL || "/icons/sign in.jpeg"} className="w-16 h-16 rounded-full mx-auto mb-2 border" alt="Avatar" />
                                        <h6 className="font-bold text-slate-900 dark:text-white truncate">{user.displayName || "User"}</h6>
                                        <p className="text-slate-500 text-xs truncate mb-4">{user.email}</p>
                                        <hr className="mb-4 opacity-50" />
                                        <button onClick={handleLogout} className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold active:scale-95 transition-transform">
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className="flex items-center justify-center rounded-full h-9 md:h-10 px-4 md:px-6 bg-red-500 text-white text-xs md:text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;