import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype";
import { Upload, Download, X, FileText, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const ToolUpload = () => {
  const { toolName } = useParams();
  const navigate = useNavigate();
  const tool = tools.find(t => t.route === toolName);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);
  
  // Guard clause for missing tool
  if (!tool) return (
    <div className="h-screen flex items-center justify-center text-white bg-[#0F172A]">
      Tool not found
    </div>
  );

  let rouye_minetype = minetype_routename(tool.route);

  useEffect(() => {
    window.onbeforeunload = isLoading ? () => true : null;
  }, [isLoading]);

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(file => file.type === tool.mineType || rouye_minetype);
    if (validFiles.length === 0) {
      alert(tool.noFileAlert);
      return;
    }
    setIsSuccess(false);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length < tool.minFiles || isLoading) return;
    
    setIsLoading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));

    try {
      let API_BASE1 = import.meta.env.VITE_SERVER_API;
      let API_BASE2 = import.meta.env.VITE_SERVER_API2;
      const response = await fetch(`${tool.api === 1 ? API_BASE1 : API_BASE2}${tool.action}`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const timestamp = Date.now();
        a.download = selectedFiles.length === 1
          ? `${tool.downloadFileName}${timestamp}${tool.downloadFileType1}`
          : `${tool.downloadFileName}${timestamp}${tool.downloadFileType2}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setIsSuccess(true);
      } else {
        alert(tool.failAlert);
      }
    } catch (error) {
      alert("Communication error with server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-sky-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Tools</span>
          </button>
          <div className="flex items-center gap-3">
            <img src="/icons/logo.JPEG" alt="Logo" className="w-8 h-8 rounded" />
            <span className="font-bold tracking-tight text-white">FlexXPDF</span>
          </div>
          <div className="w-24"></div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tool Info & File Queue */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-sky-500/20 rounded-xl">
                <img src={tool.img} alt="icon" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">{tool.h1}</h1>
                <p className="text-sm text-slate-400 capitalize">{tool.route.replace(/-/g, ' ')}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{tool.p}</p>
          </div>

          <div className="flex-1 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col min-h-[350px]">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center justify-between">
              Files in Queue
              <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-sky-400 font-mono">
                {selectedFiles.length}
              </span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {selectedFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-sm py-10">
                  <FileText size={40} className="mb-2 opacity-20" />
                  Your queue is empty
                </div>
              ) : (
                selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/5 group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={tool.icon} alt="icon" className="w-8 h-8" />
                      {/* <FileText size={18} className="text-sky-400 shrink-0" /> */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(index)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Area */}
        <div className="lg:col-span-8">
          <div 
            onDragOver={onDragOver} 
            onDragLeave={onDragLeave} 
            onDrop={onDrop}
            className={`h-full min-h-[500px] relative rounded-[2.5rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8 md:p-12
              ${isDragging ? 'border-sky-500 bg-sky-500/5 scale-[0.99]' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}
          >
            {isLoading ? (
              /* Loading State */
              <div className="flex flex-col items-center text-center">
                <Loader2 size={64} className="text-sky-500 animate-spin mb-6" />
                <h2 className="text-3xl font-bold text-white mb-2">Processing Your PDF</h2>
                <p className="text-slate-400 max-w-xs">Hang tight! FlexXPDF is working its magic on your files.</p>
              </div>
            ) : isSuccess ? (
              /* Success State */
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle2 size={56} className="text-teal-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Ready for Download!</h2>
                <p className="text-slate-400 mb-8">Your files have been successfully processed.</p>
                <button 
                  onClick={() => {setSelectedFiles([]); setIsSuccess(false);}} 
                  className="px-10 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-semibold transition-all"
                >
                  Process Another File
                </button>
              </div>
            ) : (
              /* Default Upload State */
              <>
                <div className="mb-8 p-8 bg-sky-500/10 rounded-full group-hover:scale-110 transition-transform duration-500">
                  <Upload size={56} className="text-sky-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 text-center">
                  Drag & Drop files here
                </h2>
                <p className="text-slate-400 mb-10 text-center max-w-sm">
                  Upload {tool.accept || "PDF"} files.
                  <br />
                  <span className="text-xs opacity-60">Minimum {tool.minFiles} {tool.minFiles === 1 ? 'file' : 'files'} required.</span>
                </p>

                <div className="flex flex-col w-full max-w-sm gap-4">
                  {/* Choose Files Button */}
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold shadow-xl shadow-sky-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Upload size={22} />
                    Choose Files
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    multiple
                    accept={tool.accept}
                  />

                  {/* Primary Action: Process & Download Button */}
                  {selectedFiles.length >= tool.minFiles && (
                    <button
                      onClick={handleSubmit}
                      className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-teal-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 animate-in zoom-in-95 duration-300"
                    >
                      <Download size={22} />
                      Download
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ToolUpload;