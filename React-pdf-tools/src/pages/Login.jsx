import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { auth } from "../firebase-config.js";

const Login = () => {
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();
    const [isSignup, setIsSignup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [sName, setSName] = useState("");
    const [sEmail, setSEmail] = useState("");
    const [sPassword, setSPassword] = useState("");
    const [lEmail, setLEmail] = useState("");
    const [lPassword, setLPassword] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) navigate("/");
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleGoogle = async () => {
        try { await signInWithPopup(auth, provider); } catch (err) { alert(err.message); }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const result = await createUserWithEmailAndPassword(auth, sEmail, sPassword);
            await updateProfile(result.user, { displayName: sName });
        } catch (err) { alert(err.message); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try { await signInWithEmailAndPassword(auth, lEmail, lPassword); } catch (err) { alert(err.message); }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-950 font-sans overflow-x-hidden">
            <main className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-12">
                <div className="flex w-full max-w-6xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">

                    {/* Left Side: Brand Section */}
                    <div className="hidden w-1/2 flex-col justify-center bg-red-600 p-12 text-white lg:flex">
                        <h1 className="mb-6 text-5xl font-extrabold leading-tight">
                            {isSignup ? "Manage your PDFs with ease." : "Master your PDF workflow with ease."}
                        </h1>
                        <p className="mb-10 text-lg opacity-90 pt-3">
                            Join thousands of professionals who trust FlexXpdf to edit, sign, and convert documents in seconds.
                        </p>

                        <div className="space-y-8 pt-3">
                            <div className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-3xl pt-2">bolt</span>
                                <div>
                                    <h3 className="font-bold text-xl">Lightning Fast</h3>
                                    <p className="text-sm opacity-80">Convert and merge files instantly in your browser.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-3xl pt-2">shield</span>
                                <div>
                                    <h3 className="font-bold text-xl">Enterprise Security</h3>
                                    <p className="text-sm opacity-80">Your files are encrypted and automatically deleted after processing.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-3xl pt-2">cloud</span>
                                <div>
                                    <h3 className="font-bold text-xl">Cloud Sync</h3>
                                    <p className="text-sm opacity-80">Access your documents from any device, anywhere.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Auth Form */}
                    <div className="flex w-full flex-col justify-center px-6 py-10 md:px-12 lg:w-1/2 lg:p-16">
                        <div className="mx-auto w-full max-w-md">
                            <header className="mb-8">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                                    {isSignup ? "Create account" : "Welcome Back"}
                                </h2>
                                <p className="mt-2 text-slate-500 dark:text-slate-400">
                                    {isSignup ? "Join FlexXpdf to manage documents." : "Please enter your details to sign in."}
                                </p>
                            </header>

                            {/* Social Buttons with fixed text colors */}
                            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <button
                                    onClick={handleGoogle}
                                    className="group flex items-center justify-center gap-3 rounded-xl border border-slate-200 hover:border-slate-700 py-3.5 font-bold text-slate-900 hover:text-white transition-all hover:bg-slate-50 hover:bg-slate-800 active:scale-95 cursor-pointer"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span>Google</span>
                                </button>

                                <button className="group flex items-center justify-center gap-3 rounded-xl border border-slate-200 hover:border-slate-700 py-3.5 font-bold text-slate-900 hover:text-white transition-all hover:bg-slate-50 hover:bg-slate-800 active:scale-95 cursor-pointer hover:fill-white">
                                    <svg className="w-5 h-5 fill-slate-900 hover:fill-white" viewBox="0 0 384 512">
                                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                    </svg>
                                    <span>Apple</span>
                                </button>
                            </div>

                            <div className="relative mb-8 text-center">
                                <hr className="border-slate-200 dark:border-slate-700" />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Or email
                                </span>
                            </div>

                            <form className="space-y-4" onSubmit={isSignup ? handleSignup : handleLogin}>
                                {isSignup && (
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                                        <input
                                            required type="text" placeholder="John Doe" value={sName}
                                            onChange={(e) => setSName(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                                    <input
                                        required type="email" placeholder="name@company.com"
                                        value={isSignup ? sEmail : lEmail}
                                        onChange={(e) => isSignup ? setSEmail(e.target.value) : setLEmail(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between">
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                        {!isSignup && <a href="#" className="text-sm font-semibold text-red-600 hover:underline">Forgot?</a>}
                                    </div>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={isSignup ? sPassword : lPassword}
                                            onChange={(e) => isSignup ? setSPassword(e.target.value) : setLPassword(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-xl select-none">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {!isSignup && (
                                    <div className="flex items-center gap-2 py-1">
                                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-red-600 cursor-pointer" id="remember" />
                                        <label htmlFor="remember" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Remember for 30 days</label>
                                    </div>
                                )}

                                <button className="w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-700 active:scale-[0.98] cursor-pointer">
                                    {isSignup ? "Get Started →" : "Sign In →"}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 pt-3">
                                {isSignup ? "Already have an account?" : "Don't have an account?"}
                                <button
                                    onClick={() => setIsSignup(!isSignup)}
                                    className="ml-2 font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                    {isSignup ? "Log In" : "Sign Up for Free"}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="px-8 py-6 text-center text-xs font-medium text-slate-400 uppercase tracking-widest">
                © 2026 FlexXpdf, Inc. • Secure Document Solutions
            </footer>
        </div>
    );
};

export default Login;


