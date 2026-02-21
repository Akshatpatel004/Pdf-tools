import React, { useState, useRef, useEffect } from 'react';
import { useParams } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype";
import { Upload, Scissors, X, Plus } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const ToolSplit = () => {
    const { toolName } = useParams();
    const tool = tools.find(t => t.route === "split-pdf") || tools.find(t => t.route === toolName);
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [totalPageCount, setTotalPageCount] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const [ranges, setRanges] = useState([{ from: 1, to: 1 }]);
    const [mergePdf, setMergePdf] = useState(false);
    
    const fileInputRef = useRef(null);
    let rouye_minetype = minetype_routename(tool?.route);

    // Auto-reset merge checkbox if ranges are reduced to 1
    useEffect(() => {
        if (ranges.length <= 1) {
            setMergePdf(false);
        }
    }, [ranges.length]);

    const getPageCount = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            return pdfDoc.getPageCount();
        } catch (error) {
            console.error("Error reading PDF:", error);
            return 1;
        }
    };

    useEffect(() => {
        if (selectedFile) {
            setRanges([{ from: 1, to: totalPageCount || 1 }]);
            setMergePdf(false);
        }
    }, [selectedFile, totalPageCount]);

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

        // Prepare range string: "1-10, 15-20"
        const splitRange = ranges.map(r => `${r.from}-${r.to}`).join(',');

        // LOGIC: If only 1 range, force mergePdf to true so backend returns PDF
        // Otherwise, use the checkbox state
        const finalMergeValue = ranges.length === 1 ? true : mergePdf;

        const formData = new FormData();
        formData.append('files', selectedFile);
        formData.append('splitRange', splitRange);
        formData.append('mergePdf', finalMergeValue); 
        formData.append('splitMode', 'fixed'); 

        try {
            let API_BASE = tool?.api === 1 ? import.meta.env.VITE_SERVER_API : import.meta.env.VITE_SERVER_API2;
            
            const response = await fetch(`${API_BASE}${tool?.action}`, {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                
                // Set extension based on merging logic
                const extension = finalMergeValue ? ".pdf" : ".zip";
                const cleanFileName = selectedFile.name.split('.')[0];
                a.download = `${tool?.downloadFileName || 'split_'}${cleanFileName}${Date.now()}${extension}`;
                
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const errorText = await response.text();
                alert(`Error: ${errorText || tool?.failAlert}`);
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("An error occurred connecting to the server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#7494EC] flex items-center justify-center p-4 font-sans text-slate-700">
            <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-8 flex flex-col transition-all duration-300">
                
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-500 tracking-wider uppercase">{tool?.h1 || "Split PDF"}</h1>
                    <p className="text-sm text-slate-400">{tool?.p || "Extract pages from your PDF"}</p>
                </div>

                {!selectedFile ? (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors 
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-[#A8B3E3] bg-gradient-to-b from-white to-[#F1F6FF]'}`}
                    >
                        <img src="/icons/cloud.png" alt="cloud" />
                        <span className="text-slate-500 text-sm mb-2 pt-3">Drag & Drop PDF here</span>
                        <span className="text-slate-500 text-sm mb-2 pt-1 font-bold">OR</span>
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="bg-[#025bee] text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
                        >
                            <Upload size={18} /> Choose File To Upload
                        </button>
                        <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept={tool?.accept || ".pdf"} />
                    </div>
                ) : (
                    <>
                        <div className="bg-[#eff5ff] text-[#025bee] flex items-center justify-between p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-3 truncate">
                                <img src={tool?.icon || "/icons/pdf.png"} alt="pdf" className="w-8 h-8 object-contain" />
                                <div className='flex flex-col truncate'>
                                    <span className="text-sm font-bold truncate">{selectedFile.name}</span>
                                    <span className="text-[10px] opacity-70 font-bold uppercase">{totalPageCount} Pages Found</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select Ranges</h3>
                                    <button onClick={() => setRanges([...ranges, { from: 1, to: totalPageCount }])} className="text-[#025bee] flex items-center gap-1 text-xs font-bold hover:underline">
                                        <Plus size={14} /> Add Range
                                    </button>
                                </div>
                                <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {ranges.map((range, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold uppercase">From</span>
                                                    <input 
                                                        type="number" 
                                                        value={range.from} 
                                                        onChange={(e) => updateRange(index, 'from', e.target.value)} 
                                                        className="w-full bg-white pl-12 pr-2 py-2 border rounded-lg text-sm outline-none focus:border-blue-400" 
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold uppercase">To</span>
                                                    <input 
                                                        type="number" 
                                                        value={range.to} 
                                                        onChange={(e) => updateRange(index, 'to', e.target.value)} 
                                                        className="w-full bg-white pl-8 pr-2 py-2 border rounded-lg text-sm outline-none focus:border-blue-400" 
                                                    />
                                                </div>
                                            </div>
                                            {ranges.length > 1 && (
                                                <button onClick={() => setRanges(ranges.filter((_, i) => i !== index))} className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Hide checkbox if only 1 range exists */}
                                {ranges.length > 1 && (
                                    <div className="mt-4 flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                        <input 
                                            type="checkbox" 
                                            id="mergePdf" 
                                            checked={mergePdf} 
                                            onChange={(e) => setMergePdf(e.target.checked)} 
                                            className="w-4 h-4 accent-[#025bee] cursor-pointer" 
                                        />
                                        <label htmlFor="mergePdf" className="text-xs font-bold text-slate-600 cursor-pointer italic">Merge all ranges in one PDF</label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <div className="mt-8">
                    <button
                        disabled={isLoading || !selectedFile}
                        onClick={handleSubmit}
                        className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 text-white font-bold text-lg transition-all 
                        ${selectedFile && !isLoading ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        {isLoading ? "Processing..." : "Split PDF"}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default ToolSplit;
