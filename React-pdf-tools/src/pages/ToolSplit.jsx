import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype";
import Footer from "../component/Footer.jsx";
import { Loader2, Trash2, CheckCircle2, Plus, X, ShieldCheck, Zap, Globe, GripVertical, ArrowLeft } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { triggerAdOnce } from "../App.jsx"


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

  if (!tool) return <div className="h-screen flex items-center justify-center bg-slate-50">Tool not found</div>;

  useEffect(() => {
    window.onbeforeunload = isLoading ? () => true : null;
  }, [isLoading]);

  useEffect(() => {
    if (selectedFile) {
      setRanges([{ from: 1, to: totalPageCount }]);
      setMergePdf(false);
    }
  }, [selectedFile, totalPageCount]);

  // --- CLOUD INTEGRATION LOGIC ---
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
    if (!window.google || !window.google.picker) return alert("Google SDK is still warming up.");

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: async (response) => {
        if (response.error) return console.error(response.error);

        // Ensure the picker library is loaded before building
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
            })
            .build();
          picker.setVisible(true);
        });
      },
    });
    client.requestAccessToken();
  };

  const openDropbox = () => {
    if (!window.Dropbox) return alert("Dropbox SDK not loaded");
    window.Dropbox.choose({
      success: (files) => {
        handleCloudImport(files[0].link, files[0].name);
      },
      linkType: "direct",
      extensions: ['.pdf'],
    });
  };
  // --- END CLOUD LOGIC ---

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

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    setIsLoading(true);
    setIsSuccess(false);

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

  const removeRange = (index) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || isLoading) return;

    // 1. Open your HilltopAds Direct URL in a new tab
    triggerAdOnce();

    setIsLoading(true);
    const splitRange = ranges.map(r => `${r.from}-${r.to}`).join(',');
    const finalMergeValue = ranges.length === 1 ? true : mergePdf;

    const formData = new FormData();
    formData.append('files', selectedFile);
    formData.append('splitRange', splitRange);
    formData.append('mergePdf', finalMergeValue);
    formData.append('splitMode', 'fixed');

    try {
      let API_BASE = tool.api === 1 ? import.meta.env.VITE_SERVER_API : import.meta.env.VITE_SERVER_API2;
      const response = await fetch(`${API_BASE}${tool.action}`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = finalMergeValue ? ".pdf" : ".zip";
        a.download = `${tool.downloadFileName || 'split_'}${selectedFile.name.replace(/\.[^/.]+$/, "")}${Date.now()}${extension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setIsSuccess(true);
      } else {
        alert("Split failed. Please check your ranges.");
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <nav className="flex items-center justify-between mb-8">
          <div className="hidden md:flex items-center gap-3 text-sm tracking-tight">
            <span className="cursor-pointer font-medium text-slate-400 hover:text-red-500 transition-colors uppercase text-[11px] tracking-widest" onClick={() => navigate('/')}>Home</span>
            <span className="text-slate-300 font-light text-lg">/</span>
            <span className="font-medium text-slate-600 text-base md:text-lg capitalize">Split PDF</span>
          </div>
          <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
          <div className="md:hidden font-medium text-base text-slate-900 tracking-tight capitalize">Split PDF</div>
          <div className="w-8 md:hidden"></div>
        </nav>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#1E293B] mb-2">{tool.h1}</h1>
          <p className="text-slate-500">{tool.p}</p>
        </div>

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
              <p className="text-sm text-slate-500 mt-1 mb-6">PDF split successfully.</p>
              <button onClick={() => { setSelectedFile(null); setIsSuccess(false); }} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 cursor-pointer">
                Split New PDF
              </button>
            </div>
          ) : !selectedFile ? (
            <>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                <img src={tool.img} alt="" className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Drag and drop PDF here</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6 text-center">Select the PDF you want to split</p>

              <div className="flex flex-col items-center gap-4">
                <button onClick={() => fileInputRef.current.click()} className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 cursor-pointer">
                  Select PDF File
                </button>

                <div className="flex items-center gap-4 pt-4">
                  <button onClick={openGoogleDrive} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" alt="Google Drive" />
                  </button>
                  <button onClick={openDropbox} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-6 h-6" alt="Dropbox" />
                  </button>
                </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept=".pdf" />
            </>
          ) : (
            <div className="w-full max-w-md">
              <div className="flex items-center gap-4 p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                  <img src={tool.icon || tool.img} alt="" className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="font-bold text-slate-800 truncate text-[13px] leading-none mb-1">{selectedFile.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 leading-none mt-[2px] font-medium">
                    <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span className="text-[8px] opacity-40">•</span>
                    <span>{totalPageCount} Pages</span>
                  </div>
                </div>
                <button onClick={() => setSelectedFile(null)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          )}
        </section>

        {selectedFile && !isSuccess && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-bold flex items-center gap-2 text-sm text-slate-500">
                <GripVertical size={16} /> SPLIT RANGES
              </h3>
              <button onClick={() => setRanges([...ranges, { from: 1, to: totalPageCount }])} className="text-red-500 text-xs font-bold hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Range
              </button>
            </div>

            <div className="space-y-3 mb-10 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {ranges.map((range, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">From</span>
                      <input type="number" value={range.from} onChange={(e) => updateRange(index, 'from', e.target.value)} className="w-full bg-slate-50 pl-12 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:border-red-500 outline-none" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">To</span>
                      <input type="number" value={range.to} onChange={(e) => updateRange(index, 'to', e.target.value)} className="w-full bg-slate-50 pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:border-red-500 outline-none" />
                    </div>
                  </div>
                  {ranges.length > 1 && (
                    <button onClick={() => removeRange(index)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-[#1E293B] rounded-3xl p-6 shadow-xl border border-slate-700/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-white">
                  <h4 className="font-bold text-lg">Ready to split?</h4>
                  {ranges.length > 1 && (
                    <div className="mt-3 flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-xl border border-white/5">
                      <input type="checkbox" id="mergePdf" checked={mergePdf} onChange={(e) => setMergePdf(e.target.checked)} className="w-4 h-4 accent-red-500 cursor-pointer" />
                      <label htmlFor="mergePdf" className="text-[11px] font-bold text-slate-300 cursor-pointer">Merge all ranges into one PDF</label>
                    </div>
                  )}
                </div>
                <button onClick={handleSubmit} disabled={isLoading} className={`w-full md:w-auto px-12 py-4 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-700' : 'bg-red-500 shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 cursor-pointer'}`}>
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Download NOW"}
                </button>
              </div>
            </div>
          </div>
        )}
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

export default ToolSplit;