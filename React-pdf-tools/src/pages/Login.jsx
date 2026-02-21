import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    signOut
} from "firebase/auth";
import { auth } from "../firebase-config.js";

const Login = () => {
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();
    
    const [user, setUser] = useState(null);
    const [isSignup, setIsSignup] = useState(false);

    // Form States
    const [sName, setSName] = useState("");
    const [sEmail, setSEmail] = useState("");
    const [sPassword, setSPassword] = useState("");
    const [lEmail, setLEmail] = useState("");
    const [lPassword, setLPassword] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogle = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (err) { alert(err.message); }
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
        try {
            await signInWithEmailAndPassword(auth, lEmail, lPassword);
        } catch (err) { alert(err.message); }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0F172A] font-['Montserrat']">
            
            {/* Liquid Background Blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-[120px] -left-[120px] w-[400px] height-[400px] rounded-full bg-sky-500 blur-[120px] opacity-60"></div>
                <div className="absolute -bottom-[150px] -right-[150px] w-[450px] height-[450px] rounded-full bg-teal-500 blur-[120px] opacity-60"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] height-[350px] rounded-full bg-slate-800 blur-[120px] opacity-60"></div>
            </div>

            {user ? (
                /* Profile Card Section */
                <div className="relative z-10 p-12 rounded-[25px] bg-[#0F172A]/75 backdrop-blur-3xl border border-white/15 text-center text-slate-200 shadow-2xl">
                    <div className="mb-5 inline-block">
                        <img 
                            src={user.photoURL || "/default-avatar.png"} 
                            alt="User" 
                            className="w-[120px] h-[120px] rounded-full border-3 border-sky-500"
                        />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Welcome, {user.displayName || "User"}!</h1>
                    <p className="text-slate-400 mb-6">{user.email}</p>
                    <div className="flex flex-col gap-3">
                        <button 
                            className="py-3 px-6 rounded-xl bg-linear-to-br from-sky-500 to-teal-500 text-white font-semibold cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(14,165,233,0.3)]"
                            onClick={() => navigate("/")}
                        >
                            Open PDF Tools
                        </button>
                        <button 
                            className="py-3 px-6 rounded-xl bg-red-500 text-white font-semibold cursor-pointer transition-all hover:bg-red-600"
                            onClick={handleLogout}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            ) : (
                /* Main Auth Container */
                <div className="relative z-10 w-[850px] max-w-[95%] min-h-[550px] bg-[#0F172A]/75 backdrop-blur-3xl border border-white/15 rounded-[30px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                    
                    {/* Sign Up Form */}
                    <div className={`absolute top-0 h-full w-full md:w-1/2 flex items-center justify-center p-8 md:p-14 transition-all duration-600 ease-in-out ${isSignup ? "translate-x-0 md:translate-x-full opacity-100 z-50" : "opacity-0 z-10"}`}>
                        <form onSubmit={handleSignup} className="w-full flex flex-col">
                            <h1 className="text-white text-3xl font-bold mb-5">Join FlexXPDF</h1>
                            <button type="button" onClick={handleGoogle} className="mb-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white font-semibold hover:bg-white/15 transition-all">
                                Sign up with Google
                            </button>
                            <input className="bg-white/5 border border-white/15 p-3.5 rounded-xl mb-4 text-white outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all" placeholder="Full Name" value={sName} onChange={e => setSName(e.target.value)} required />
                            <input className="bg-white/5 border border-white/15 p-3.5 rounded-xl mb-4 text-white outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all" type="email" placeholder="Email" value={sEmail} onChange={e => setSEmail(e.target.value)} required />
                            <input className="bg-white/5 border border-white/15 p-3.5 rounded-xl mb-4 text-white outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all" type="password" placeholder="Password" value={sPassword} onChange={e => setSPassword(e.target.value)} required />
                            <button type="submit" className="py-3 mt-2 rounded-xl bg-linear-to-br from-sky-500 to-teal-500 text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all">Create Account</button>
                            <button type="button" onClick={() => setIsSignup(false)} className="md:hidden mt-4 text-teal-500 text-sm">Already have an account? Sign In</button>
                        </form>
                    </div>

                    {/* Sign In Form */}
                    <div className={`absolute top-0 h-full w-full md:w-1/2 flex items-center justify-center p-8 md:p-14 transition-all duration-600 ease-in-out ${isSignup ? "translate-x-0 md:translate-x-full opacity-0 z-10" : "translate-x-0 opacity-100 z-20"}`}>
                        <form onSubmit={handleLogin} className="w-full flex flex-col">
                            <h1 className="text-white text-3xl font-bold mb-5">Welcome Back</h1>
                            <button type="button" onClick={handleGoogle} className="mb-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white font-semibold hover:bg-white/15 transition-all">
                                Sign in with Google
                            </button>
                            <input className="bg-white/5 border border-white/15 p-3.5 rounded-xl mb-4 text-white outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all" type="email" placeholder="Email" value={lEmail} onChange={e => setLEmail(e.target.value)} required />
                            <input className="bg-white/5 border border-white/15 p-3.5 rounded-xl mb-4 text-white outline-none focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all" type="password" placeholder="Password" value={lPassword} onChange={e => setLPassword(e.target.value)} required />
                            <span onClick={() => {
                                if(!lEmail) return alert("Enter email first");
                                sendPasswordResetEmail(auth, lEmail).then(() => alert("Email sent!"));
                            }} className="text-sm text-teal-500 cursor-pointer hover:underline mb-2">Forgot password?</span>
                            <button type="submit" className="py-3 mt-2 rounded-xl bg-linear-to-br from-sky-500 to-teal-500 text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all">Sign In</button>
                            <button type="button" onClick={() => setIsSignup(true)} className="md:hidden mt-4 text-teal-500 text-sm">New here? Create Account</button>
                        </form>
                    </div>

                    {/* Toggle Panels (Desktop Only) */}
                    <div className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-600 ease-in-out z-100 ${isSignup ? "-translate-x-full rounded-r-[150px]" : "rounded-l-[150px]"}`}>
                        <div className={`relative -left-full h-full w-[200%] bg-linear-to-br from-sky-500 to-teal-500 transition-all duration-600 ease-in-out ${isSignup ? "translate-x-1/2" : "translate-x-0"}`}>
                            {/* Panel Left */}
                            <div className={`absolute top-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center text-white transition-all duration-600 ${isSignup ? "translate-x-0" : "-translate-x-[200%]"}`}>
                                <h1 className="text-3xl font-bold mb-4">Hello, Editor!</h1>
                                <p className="mb-6">Already have an account? Sign in to continue your work.</p>
                                <button className="px-10 py-2 border border-white rounded-xl font-semibold hover:bg-white/20 transition-all" onClick={() => setIsSignup(false)}>Sign In</button>
                            </div>
                            {/* Panel Right */}
                            <div className={`absolute top-0 right-0 flex flex-col items-center justify-center w-1/2 h-full px-10 text-center text-white transition-all duration-600 ${isSignup ? "translate-x-[200%]" : "translate-x-0"}`}>
                                <h1 className="text-3xl font-bold mb-4">Why FlexXPDF?</h1>
                                <p className="mb-6">The ultimate tool for PDF manipulation. Join us for free.</p>
                                <button className="px-10 py-2 border border-white rounded-xl font-semibold hover:bg-white/20 transition-all" onClick={() => setIsSignup(true)}>Sign Up</button>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default Login;