import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype";
import Footer from "../component/Footer.jsx";
import { triggerAdOnce } from "../App.jsx"
import {
    Loader2, Trash2, ShieldCheck, Zap,
    Lock, Unlock, Eye, EyeOff, ArrowLeft, Shield, Globe
} from 'lucide-react';

const PasswordProtect = () => {
    const { toolName } = useParams();
    const navigate = useNavigate();

    const tool = tools.find(t => t.route.includes(toolName.replace('-', ' ')));
    const isUnlockPage = toolName.toLowerCase().includes('unlock');

    const [selectedFile, setSelectedFile] = useState(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);

    if (!tool) return <div className="h-screen flex items-center justify-center text-slate-400 font-medium">Tool not found.</div>;

    useEffect(() => {
        window.onbeforeunload = isLoading ? () => true : null;
    }, [isLoading]);

    // --- CLOUD LOGIC ---
    const handleCloudImport = async (url, name, token = null) => {
        setIsLoading(true);
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await fetch(url, { headers });
            const blob = await response.blob();
            const file = new File([blob], name, { type: blob.type });
            handleFiles([file]);
        } catch (err) {
            alert("Failed to import cloud file.");
        } finally {
            setIsLoading(false);
        }
    };

    const openGoogleDrive = () => {
        if (!window.google || !window.gapi) return alert("Google SDK is still loading.");

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: async (response) => {
                if (response.error) return;

                window.gapi.load('picker', () => {
                    const picker = new window.google.picker.PickerBuilder()
                        .addView(window.google.picker.ViewId.DOCS)
                        .setOAuthToken(response.access_token)
                        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
                        .setCallback((data) => {
                            if (data.action === window.google.picker.Action.PICKED) {
                                const doc = data.docs[0];
                                const downloadUrl = `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
                                handleCloudImport(downloadUrl, doc.name, response.access_token);
                            }
                        }).build();
                    picker.setVisible(true);
                });
            },
        });
        client.requestAccessToken();
    };

    const openDropbox = () => {
        if (!window.Dropbox) return alert("Dropbox SDK not loaded");
        window.Dropbox.choose({
            success: (files) => handleCloudImport(files[0].link, files[0].name),
            linkType: "direct",
            extensions: ['.pdf'],
        });
    };

    const handleFiles = (files) => {
        const file = files[0];
        if (!file) return;
        const allowedType = minetype_routename(tool.route);
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');
        const isAllowed = file.type === tool.mineType || file.type === allowedType;

        if (isAllowed || isPdf) {
            setSelectedFile(file);
            setIsSuccess(false);
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile || isLoading) return;
        if (!password) { alert("Password required."); return; }
        if (!isUnlockPage && password !== confirmPassword) { alert("Passwords do not match."); return; }

        // 1. Open your HilltopAds Direct URL in a new tab
        triggerAdOnce();

        setIsLoading(true);
        const formData = new FormData();
        formData.append('files', selectedFile);
        formData.append('password', password);

        try {
            const API_BASE = tool.api === 1 ? import.meta.env.VITE_SERVER_API : import.meta.env.VITE_SERVER_API2;
            const response = await fetch(`${API_BASE}${tool.action}`, { method: "POST", body: formData });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${tool.downloadFileName}${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setIsSuccess(true);
            } else {
                alert("Action failed. Please check your password.");
            }
        } catch (error) {
            alert("Connection failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <main className="max-w-6xl mx-auto px-4 py-6 md:py-10">
                <nav className="flex items-center justify-between mb-8">
                    <div className="hidden md:flex items-center gap-3 text-sm tracking-tight">
                        <span className="cursor-pointer font-medium text-slate-400 hover:text-red-500 transition-colors uppercase text-[11px] tracking-widest" onClick={() => navigate('/')}>Home</span>
                        <span className="text-slate-300 font-light text-lg">/</span>
                        <span className="font-medium text-slate-600 text-base md:text-lg">{isUnlockPage ? "Unlock PDF" : "Protect PDF"}</span>
                    </div>
                    <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                    <div className="md:hidden font-medium text-base text-slate-900 tracking-tight">{isUnlockPage ? "Unlock PDF" : "Protect PDF"}</div>
                    <div className="w-8 md:hidden"></div>
                </nav>

                <div className={`text-center mb-10 ${selectedFile ? 'hidden md:block' : 'block'}`}>
                    <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] mb-2">
                        {isUnlockPage ? "Unlock PDF" : "Protect PDF file"}
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto font-medium">
                        {isUnlockPage
                            ? "Remove PDF password security, giving you the freedom to use your PDFs as you want."
                            : "Encrypt your PDF with a strong password to prevent unauthorized access."}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7">
                        <section
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                            className={`relative rounded-3xl border-2 border-dashed min-h-[320px] md:min-h-[420px] flex flex-col items-center justify-center transition-all ${isDragging ? 'border-red-500 bg-red-50' : 'border-red-100 bg-red-50/30'}`}
                        >
                            {isSuccess ? (
                                <div className="flex flex-col items-center text-center animate-in zoom-in-95">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                                        {isUnlockPage ? <Unlock size={32} /> : <Shield size={32} />}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">{isUnlockPage ? "PDF Unlocked!" : "PDF Protected!"}</h3>
                                    <p className="text-sm text-slate-500 mt-1 mb-6">Your processed file has been downloaded.</p>
                                    <button onClick={() => { setSelectedFile(null); setIsSuccess(false); setPassword(""); setConfirmPassword(""); }} className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer">
                                        {isUnlockPage ? "Unlock Another" : "Protect Another"}
                                    </button>
                                </div>
                            ) : !selectedFile ? (
                                <div className="text-center p-6">
                                    <div className="w-20 h-20 bg-white shadow-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        {isUnlockPage ? <Unlock size={40} className="text-red-500" /> : <Lock size={40} className="text-red-500" />}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">{isUnlockPage ? "Ready to unlock?" : "Ready to protect?"}</h3>
                                    <p className="text-sm text-slate-400 mb-8 font-medium">Click button or drag your PDF here</p>

                                    <div className="flex flex-col items-center gap-4">
                                        <button onClick={() => fileInputRef.current.click()} className="px-10 py-3.5 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all cursor-pointer uppercase tracking-tight">
                                            Select PDF file
                                        </button>

                                        <div className="flex items-center gap-4 pt-4">
                                            <button type="button" onClick={openGoogleDrive} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer" title="Google Drive">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" alt="Google Drive" />
                                            </button>
                                            <button type="button" onClick={openDropbox} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer" title="Dropbox">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-6 h-6" alt="Dropbox" />
                                            </button>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept=".pdf" />
                                </div>
                            ) : (
                                <div className="w-full max-w-sm p-4">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                            <img src={tool.icon} alt="PDF" className="w-7 h-9" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate text-[13px] mb-1">{selectedFile.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {isUnlockPage ? "Unlock" : "Protect"}</p>
                                        </div>
                                        <button onClick={() => setSelectedFile(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="lg:col-span-5">
                        <form name="password-form" onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-red-50 rounded-lg text-red-500">{isUnlockPage ? <Unlock size={20} /> : <Lock size={20} />}</div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">{isUnlockPage ? 'Unlock Settings' : 'Security Settings'}</h2>
                            </div>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="main-password" className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        {isUnlockPage ? 'PDF Password' : 'Create Password'}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            id="main-password"
                                            name="password"
                                            autoComplete={isUnlockPage ? "current-password" : "new-password"}
                                            type={showPass ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={isUnlockPage ? "Enter password here" : "••••••••"}
                                            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 outline-none font-bold text-sm text-slate-700"
                                        />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 cursor-pointer">
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {!isUnlockPage && (
                                    <div className="space-y-2">
                                        <label htmlFor="confirm-password" className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                id="confirm-password"
                                                name="confirm-password"
                                                autoComplete="new-password"
                                                type={showPass ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 outline-none font-bold text-sm text-slate-700"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className={`p-4 rounded-2xl border flex gap-3 ${!isUnlockPage ? 'bg-blue-50/50 border-blue-100' : 'bg-red-50/50 border-red-100'}`}>
                                    <Zap size={20} className={`shrink-0 pt-1 ${!isUnlockPage ? 'text-blue-500' : 'text-red-500'}`} />
                                    <p className="text-[13px] leading-relaxed text-slate-500 font-bold">
                                        {isUnlockPage
                                            ? "Enter the current password to remove the security from this PDF."
                                            : "Passwords cannot be recovered if lost. Store it safely."}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !selectedFile}
                                    className={`w-full py-4 rounded-2xl font-black text-white text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-tight ${isLoading || !selectedFile ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#E53E3E] hover:bg-[#C53030] shadow-red-500/30 cursor-pointer'}`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            {isUnlockPage ? <Unlock size={20} /> : <Shield size={20} />}
                                            {isUnlockPage ? 'UNLOCK PDF' : 'PROTECT PDF'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <section className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto"><ShieldCheck size={24} /></div>
                        <h4 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider">Secure</h4>
                        <p className="text-xs text-slate-400">Files are encrypted and deleted after processing.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto"><Zap size={24} /></div>
                        <h4 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider">Fast</h4>
                        <p className="text-xs text-slate-400">High-speed processing without quality loss.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto"><Globe size={24} /></div>
                        <h4 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider">Universal</h4>
                        <p className="text-xs text-slate-400">Works on all devices and browsers.</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default PasswordProtect;