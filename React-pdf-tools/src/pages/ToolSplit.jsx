import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype";
import { Upload, Scissors, X, Plus, FileText, ArrowLeft, Loader2, Layers, CheckCircle2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const ToolSplit = () => {
    const { toolName } = useParams();
    const navigate = useNavigate();
    const tool = tools.find(t => t.route === "split-pdf") || tools.find(t => t.route === toolName);
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [totalPageCount, setTotalPageCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [ranges, setRanges] = useState([{ from: 1, to: 1 }]);
    const [mergePdf, setMergePdf] = useState(false);
    
    const fileInputRef = useRef(null);
    let rouye_minetype = minetype_routename(tool?.route);

    useEffect(() => {
        if (ranges.length <= 1) setMergePdf(false);
    }, [ranges.length]);

    useEffect(() => {
        if (selectedFile) {
            setRanges([{ from: 1, to: totalPageCount || 1 }]);
            setMergePdf(false);
        }
    }, [selectedFile, totalPageCount]);

    const getPageCount = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            return pdfDoc.getPageCount();
        } catch (error) {
            return 1;
        }
    };

    const handleFiles = async (files) => {
        const file = files[0];
        if (!file || (file.type !== tool?.mineType && !rouye_minetype)) {
            alert(tool?.noFileAlert || "Please upload PDF file");
            return;
        }
        setIsLoading(true);
        const pages = await getPageCount(file);
        setTotalPageCount(pages);
        setSelectedFile(file);
        setIsSuccess(false);
        setIsLoading(false);
    };

    const updateRange = (index, field, value) => {
        const newRanges = [...ranges];
        let numValue = value === "" ? "" : parseInt(value);
        if (numValue !== "" && numValue > totalPageCount) numValue = totalPageCount;
        if (numValue !== "" && numValue < 1) numValue = 1;
        newRanges[index][field] = numValue;
        setRanges(newRanges);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile || isLoading) return;
        setIsLoading(true);

        const splitRange = ranges.map(r => `${r.from}-${r.to}`).join(',');
        const finalMergeValue = ranges.length === 1 ? true : mergePdf;

        const formData = new FormData();
        formData.append('files', selectedFile);
        formData.append('splitRange', splitRange);
        formData.append('mergePdf', finalMergeValue); 
        formData.append('splitMode', 'fixed'); 

        try {
            let API_BASE = tool?.api === 1 ? import.meta.env.VITE_SERVER_API : import.meta.env.VITE_SERVER_API2;
            const response = await fetch(`${API_BASE}${tool?.action}`, { method: "POST", body: formData });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const extension = finalMergeValue ? ".pdf" : ".zip";
                a.download = `${tool?.downloadFileName || 'split_'}${selectedFile.name.split('.')[0]}${extension}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setIsSuccess(true);
            } else {
                alert(tool?.failAlert || "Server error occurred");
            }
        } catch (error) {
            alert("Connection error.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-sky-500/30">
            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Tools</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <img src="/icons/logo.JPEG" alt="Logo" className="w-8 h-8 rounded" />
                        <span className="font-bold tracking-tight text-white uppercase">FlexXPDF</span>
                    </div>
                    <div className="w-24"></div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: File Details & Ranges */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-sky-500/20 rounded-xl">
                                <Scissors className="text-sky-400" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white uppercase">{tool?.h1 || "Split PDF"}</h1>
                                <p className="text-xs text-slate-400">Extract or separate pages with precision</p>
                            </div>
                        </div>
                        {selectedFile && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                                <div className="flex items-center gap-3 truncate">
                                    <FileText className="text-sky-400" size={20} />
                                    <div className="truncate">
                                        <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                                        <p className="text-[10px] text-sky-400 font-bold uppercase">{totalPageCount} Pages Found</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedFile(null)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedFile && !isSuccess && (
                        <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col min-h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={16} className="text-sky-400" /> Range Manager
                                </h3>
                                <button onClick={() => setRanges([...ranges, { from: 1, to: totalPageCount }])} 
                                    className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                                    <Plus size={14} /> Add Range
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar max-h-[450px]">
                                {ranges.map((range, index) => (
                                    <div key={index} className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-xl border border-white/5 group transition-all hover:border-white/10">
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <span className="absolute left-3 top-[-8px] px-1 bg-[#161e31] text-[9px] text-slate-500 font-bold uppercase">From</span>
                                                <input type="number" value={range.from} onChange={(e) => updateRange(index, 'from', e.target.value)} 
                                                    className="w-full bg-transparent p-3 border border-white/10 rounded-lg text-sm text-white focus:border-sky-500 outline-none transition-all" />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-[-8px] px-1 bg-[#161e31] text-[9px] text-slate-500 font-bold uppercase">To</span>
                                                <input type="number" value={range.to} onChange={(e) => updateRange(index, 'to', e.target.value)} 
                                                    className="w-full bg-transparent p-3 border border-white/10 rounded-lg text-sm text-white focus:border-sky-500 outline-none transition-all" />
                                            </div>
                                        </div>
                                        {ranges.length > 1 && (
                                            <button onClick={() => setRanges(ranges.filter((_, i) => i !== index))} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {ranges.length > 1 && (
                                <div className="mt-6 p-4 bg-teal-500/5 rounded-xl border border-teal-500/20 flex items-center gap-3">
                                    <input type="checkbox" id="mergePdf" checked={mergePdf} onChange={(e) => setMergePdf(e.target.checked)} 
                                        className="w-5 h-5 accent-teal-500 cursor-pointer" />
                                    <label htmlFor="mergePdf" className="text-xs font-medium text-teal-400 cursor-pointer italic">
                                        Combine all selected ranges into a single PDF file
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Upload/Action Area */}
                <div className="lg:col-span-7">
                    <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} 
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                        className={`h-full min-h-[550px] relative rounded-[2.5rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8
                        ${isDragging ? 'border-sky-500 bg-sky-500/5 scale-[0.99]' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'} ${selectedFile ? 'border-none' : ''}`}>
                        
                        {!selectedFile && !isLoading ? (
                            <>
                                <div className="mb-8 p-8 bg-sky-500/10 rounded-full group-hover:scale-110 transition-transform duration-500">
                                    <Upload size={56} className="text-sky-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3 text-center uppercase tracking-tight">Drop your PDF here</h2>
                                <p className="text-slate-400 mb-10 text-center max-w-sm">Select a file to begin extracting pages</p>
                                <button onClick={() => fileInputRef.current.click()} className="px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold shadow-xl shadow-sky-900/20 transition-all flex items-center gap-3">
                                    <Upload size={22} /> Select PDF File
                                </button>
                                <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept={tool?.accept || ".pdf"} />
                            </>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center text-center">
                                <Loader2 size={64} className="text-sky-500 animate-spin mb-6" />
                                <h2 className="text-2xl font-bold text-white mb-2 uppercase">Processing PDF</h2>
                                <p className="text-slate-400">Analyzing pages and preparing workspace...</p>
                            </div>
                        ) : isSuccess ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <CheckCircle2 size={56} className="text-teal-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2 uppercase">Split Complete!</h2>
                                <p className="text-slate-400 mb-8">Your modified PDF has been downloaded.</p>
                                <button onClick={() => {setSelectedFile(null); setIsSuccess(false);}} className="px-10 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-semibold transition-all">
                                    Split Another File
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center w-full max-w-sm">
                                <div className="mb-8 p-8 bg-teal-500/10 rounded-full">
                                    <Scissors size={56} className="text-teal-400" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight italic">Ready to Split</h2>
                                <p className="text-slate-400 mb-10">Review your ranges on the left before proceeding.</p>
                                <button onClick={handleSubmit} className="w-full py-5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-teal-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 animate-in zoom-in-95 duration-300">
                                    <Scissors size={24} /> Split & Download
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ToolSplit;