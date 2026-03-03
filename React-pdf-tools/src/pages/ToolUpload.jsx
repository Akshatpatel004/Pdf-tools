import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype"; // Importing your helper
import Footer from "../component/Footer.jsx";
import { Loader2, Trash2, GripVertical, CheckCircle2 , ShieldCheck, Zap, Globe } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const ToolUpload = () => {
  const { toolName } = useParams();
  const navigate = useNavigate();
  const tool = tools.find(t => t.route === toolName);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!tool) return <div className="h-screen flex items-center justify-center bg-slate-50">Tool not found</div>;

  useEffect(() => {
    window.onbeforeunload = isLoading ? () => true : null;
  }, [isLoading]);

  const getPageCount = async (file) => {
    try {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) return null;
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } catch (e) {
      console.error("Error reading PDF pages:", e);
      return null;
    }
  };

  const handleFiles = async (files) => {
    const fileList = Array.from(files);
    setIsSuccess(false);

    // Get the allowed minetype from your helper file
    const allowedType = minetype_routename(tool.route);

    const processedFiles = await Promise.all(fileList.map(async (file) => {
      // Logic for validation: Check tool.mineType, your helper, or if it's a PDF
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');
      const isAllowed = file.type === tool.mineType || file.type === allowedType;

      if (isAllowed) {
        if (isPdf) {
          const count = await getPageCount(file);
          file.pageNo = count;
        }
        return file;
      }
      return null;
    }));

    const validFiles = processedFiles.filter(f => f !== null);

    if (validFiles.length === 0) {
      alert(tool.noFileAlert || "Invalid file type for this tool.");
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length < (tool.minFiles || 1) || isLoading) return;

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
        alert(tool.failAlert || "Processing failed.");
      }
    } catch (error) {
      alert("Communication error with server.");
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || selectedFiles.length < (tool.minFiles || 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 py-3 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-slate-400">
          <span className="cursor-pointer hover:text-red-500" onClick={() => navigate('/')}>Home</span>
          <span>&rsaquo;</span>
          <span className="font-medium text-slate-900 capitalize">{tool.title.replace(/-/g, ' ')}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#1E293B] mb-2">{tool.h1}</h1>
          <p className="text-slate-500">{tool.p}</p>
        </div>

        {/* Interaction Area */}
        <section
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          className={`relative rounded-3xl border-2 border-dashed p-10 flex flex-col items-center justify-center mb-10 transition-all ${isDragging ? 'border-red-500 bg-red-50' : 'border-red-100 bg-red-50/30'}`}
        >
          {isSuccess ? (
            <div className="flex flex-col items-center text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Done!</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">File downloaded successfully.</p>
              <button onClick={() => { setSelectedFiles([]); setIsSuccess(false); }} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer">
                Process New File
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 transition-transform hover:scale-110">
                <img src={tool.img} alt="" className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Drag and drop files here</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
                Supported: {tool.accept || "PDF"}<br />
                <span className="opacity-70 font-medium text-red-400">Min. {tool.minFiles} {tool.minFiles === 1 ? 'file' : 'files'} required</span>
              </p>
              <button onClick={() => fileInputRef.current.click()} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer">
                Select Files
              </button>
              <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" multiple accept={tool.accept} />
            </>
          )}
        </section>

        {/* File Queue */}
        {selectedFiles.length > 0 && !isSuccess && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-bold flex items-center gap-2 text-sm"><GripVertical size={16} className="text-slate-400" /> Selected ({selectedFiles.length})</h3>
              <button onClick={() => setSelectedFiles([])} className="text-red-500 text-xs font-bold hover:underline cursor-pointer">Clear all</button>
            </div>

            <div className="space-y-2 mb-10">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-4 p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-red-200 transition-all">
                  <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <img src={tool.icon || tool.img} alt="" className="w-7 h-8" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {/* leading-none and mb-0 removes all space between name and size */}
                    <p className="font-bold text-slate-800 truncate text-[13px] leading-none mb-1">{file.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 leading-none mt-[2px] font-medium">
                      <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      {file.pageNo && (
                        <span className="flex items-center gap-1">
                          <span className="text-[8px] opacity-40">•</span>
                          <span>{file.pageNo} {file.pageNo === 1 ? 'Page' : 'Pages'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 pr-1">
                    <button onClick={() => removeFile(index)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all">
                      <Trash2 size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Ready Action Bar */}
            <div className="bg-[#1E293B] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between shadow-xl">
              <div className="text-white text-center md:text-left mb-4 md:mb-0">
                <h4 className="font-bold text-base leading-tight">Ready to {tool.route.split('-')[0]}?</h4>
                <p className="text-slate-400 text-xs mt-0.5">{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} ready for processing.</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isButtonDisabled}
                className={`w-full md:w-auto px-10 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 
                  ${isButtonDisabled ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-red-500 hover:bg-red-600 cursor-pointer shadow-lg shadow-red-500/20'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Download NOW <span className="material-symbols-outlined text-sm">magic_button</span></>}
              </button>
            </div>
          </div>
        )}
      </main>
      {/* FEATURE FOOTER (SECURE, QUALITY, WORKS EVERYWHERE) */}
      <section className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500"><ShieldCheck size={24} /></div>
            <h4 className="font-bold text-slate-800 mb-1">Secure Processing</h4>
            <p className="text-xs text-slate-400">Your files are encrypted and automatically deleted after processing.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500"><Zap size={24} /></div>
            <h4 className="font-bold text-slate-800 mb-1">Original Quality</h4>
            <p className="text-xs text-slate-400">Get high-quality results without compromising the integrity of your data.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500"><Globe size={24} /></div>
            <h4 className="font-bold text-slate-800 mb-1">Works Everywhere</h4>
            <p className="text-xs text-slate-400">Access our tools from any browser or device, anywhere in the world.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ToolUpload;
