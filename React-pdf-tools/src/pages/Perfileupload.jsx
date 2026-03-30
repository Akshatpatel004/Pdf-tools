import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype";
import Footer from "../component/Footer.jsx";
import { Trash2, GripVertical, ShieldCheck, Zap, Globe, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import PdfOrganizer from "../controler/PdfOrganizer.jsx";
import { triggerAdOnce } from "../App.jsx"


const Perfileupload = () => {
  const { toolName } = useParams();
  const navigate = useNavigate();
  const tool = tools.find(t => t.route === `toolperfile/${toolName}`);

  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initGapi = () => { if (window.gapi) window.gapi.load('picker', () => { }); };
    const timer = setInterval(() => { if (window.gapi) { initGapi(); clearInterval(timer); } }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.onbeforeunload = isLoading ? () => true : null;
  }, [isLoading]);

  const handleCloudImport = async (url, name, token = null) => {
    setIsLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(url, { headers });
      const blob = await response.blob();
      handleFiles([new File([blob], name, { type: blob.type })]);
    } catch (err) { alert("Failed to import cloud file."); }
    finally { setIsLoading(false); }
  };

  const openGoogleDrive = () => {
    if (!window.google?.picker) return alert("Google SDK is still warming up.");
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (res) => {
        if (res.error) return;
        const picker = new window.google.picker.PickerBuilder()
          .addView(window.google.picker.ViewId.DOCS)
          .setOAuthToken(res.access_token)
          .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
          .setCallback((data) => {
            if (data.action === window.google.picker.Action.PICKED) {
              const doc = data.docs[0];
              handleCloudImport(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, doc.name, res.access_token);
            }
          }).build();
        picker.setVisible(true);
      },
    });
    client.requestAccessToken();
  };

  const openDropbox = () => {
    if (!window.Dropbox) return alert("Dropbox SDK not loaded");
    window.Dropbox.choose({
      success: (files) => handleCloudImport(files[0].link, files[0].name),
      linkType: "direct",
      extensions: ['.pdf', '.jpg', '.png', '.docx'],
    });
  };

  const isOrganizePdfTool = tool.route.includes("Organize-pdf");
  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;
    setIsSuccess(false);

    const allowedExtraTypes = minetype_routename(tool.route) || [];
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');

    const isAllowed = isPdf || (tool.mineType && file.type === tool.mineType) ||
      (Array.isArray(allowedExtraTypes) ? allowedExtraTypes.includes(file.type) : file.type === allowedExtraTypes);

    if (isAllowed) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target.result;
        if (isPdf) {
          try {
            const pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
            file.pageNo = pdfDoc.getPageCount();
          } catch (err) { file.pageNo = null; }
        }
        setSelectedFile(file);
        if (isOrganizePdfTool && isPdf) {
          setPdfData(data);
          setShowEditor(true);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert(tool.noFileAlert || "Invalid file type.");
    }
  };

  // --- UPDATED SERVER COMMUNICATION ---
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile || isLoading) return;

    // 1. Open your HilltopAds Direct URL in a new tab
    triggerAdOnce();

    setIsLoading(true);
    const formData = new FormData();

    // CHANGE THIS: Match the server's upload.array('files')
    formData.append('files', selectedFile);

    try {
      const API_BASE = tool.api === 1 ? import.meta.env.VITE_SERVER_API : import.meta.env.VITE_SERVER_API2;

      const response = await fetch(`${API_BASE}${tool.action}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const timestamp = Date.now();
        const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        a.download = `${tool.downloadFileName}${fileNameWithoutExt}${timestamp}${tool.downloadFileType1}`;

        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setIsSuccess(true);
      } else {
        // Log the error to see what the server says
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        alert(tool.failAlert || "Server rejected the file.");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Communication error with server.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => { setSelectedFile(null); setPdfData(null); setShowEditor(false); setIsSuccess(false); };

  if (isOrganizePdfTool && showEditor && pdfData) {
    return <PdfOrganizer pdfData={pdfData} onCancel={removeFile} initialFile={selectedFile} />
  }

  if (!tool) return <div className="h-screen flex items-center justify-center bg-slate-50">Tool not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        <nav className="flex items-center justify-between mb-8">
          <div className="hidden md:flex items-center gap-3 text-sm tracking-tight">
            <span className="cursor-pointer font-medium text-slate-400 hover:text-red-500 transition-colors uppercase text-[11px] tracking-widest" onClick={() => navigate('/')}>Home</span>
            <span className="text-slate-300 font-light text-lg">/</span>
            <span className="font-medium text-red-600 text-base md:text-lg capitalize">{tool.title.replace(/-/g, ' ')}</span>
          </div>
          <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
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
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={32} className="text-green-600" /></div>
              <h3 className="text-xl font-bold text-slate-800">Success!</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">Your file has been processed.</p>
              <button onClick={removeFile} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer">Process New File</button>
            </div>
          ) : !selectedFile ? (
            <>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4"><img src={tool.img} alt="" className="w-10 h-10" /></div>
              <h3 className="text-lg font-bold text-slate-800">Drag and drop file here</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">Supported: {tool.accept || "PDF"}</p>
              <button onClick={() => fileInputRef.current.click()} className="px-10 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 cursor-pointer">Select File</button>

              <div className="flex items-start gap-4 p-4 mt-4">
                <button onClick={openGoogleDrive} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 transition-all cursor-pointer"><img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" alt="Drive" /></button>
                <button onClick={openDropbox} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 transition-all cursor-pointer"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-6 h-6" alt="Dropbox" /></button>
              </div>
              <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept={tool.accept} />
            </>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold flex items-center gap-2 text-sm"><GripVertical size={16} className="text-slate-400" /> Selected (1)</h3>
                <button onClick={removeFile} className="text-red-500 text-xs font-bold hover:underline cursor-pointer">Remove</button>
              </div>
              <div className="flex items-center gap-4 p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-red-200 transition-all">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0"><img src={tool.icon || tool.img} alt="" className="w-7 h-7" /></div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="font-bold text-slate-800 truncate text-[13px] leading-none mb-1">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none mt-[2px] font-medium">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB {selectedFile.pageNo && `• ${selectedFile.pageNo} Page(s)`}</p>
                </div>
                <button onClick={removeFile} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all"><Trash2 size={16} strokeWidth={2.5} /></button>
              </div>
              <div className="bg-[#1E293B] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between shadow-xl">
                <div className="text-white text-center md:text-left mb-4 md:mb-0">
                  <h4 className="font-bold text-base leading-tight">Ready to {tool.title.split('-')[0]}?</h4>
                  <p className="text-slate-400 text-xs mt-0.5">1 file selected for processing.</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`w-full md:w-auto px-10 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 cursor-pointer shadow-lg shadow-red-500/20 active:scale-95'}`}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Download NOW"}
                </button>
              </div>
            </div>
          )}
        </section>

        <Footer />
      </main>
    </div>
  );
};

export default Perfileupload;