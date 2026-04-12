import React, { useState, useEffect, useRef } from 'react';
import { 
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, 
  DragOverlay, TouchSensor
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, rectSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  RotateCw, Trash2, FileText, Plus, RefreshCw, X, Loader2, Check
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// --- Sortable Page Item Component ---
function SortablePageItem({ id, page, index, onRotate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-2 group w-full md:w-auto">
      <div 
        {...attributes} 
        {...listeners}
        className="relative bg-white border border-slate-200 rounded-xl p-2 md:p-2 transition-all duration-200 hover:border-red-400 shadow-sm md:shadow-md cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="aspect-[3/4] bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden relative">
          <img 
            src={page.image} 
            style={{ transform: `rotate(${page.rotation}deg)` }} 
            className="max-w-full max-h-full transition-transform duration-300 pointer-events-none object-contain" 
            alt={`Page ${index + 1}`} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 md:gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onRotate(index); }} 
            className="p-2 md:p-1 text-slate-400 hover:text-red-500 active:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCw size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(index); }} 
            className="p-2 md:p-1 text-slate-400 hover:text-red-600 active:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 md:bg-transparent px-2 py-0.5 md:px-0 rounded">
          Page {index + 1}
        </span>
      </div>
    </div>
  );
}

export default function PdfOrganizer({ initialFile, onCancel }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const scrollableContainerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { 
      activationConstraint: { 
        delay: 800, // Reduced to 500ms for a more responsive "hold" feel
        tolerance: 10 
      } 
    })
  );

  useEffect(() => { 
    if (initialFile) { loadNewFile(initialFile, true); } 
  }, [initialFile]);

  const handleCloudImport = async (url, name, token = null) => {
    setLoading(true);
    setIsMenuOpen(false);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(url, { headers });
      const blob = await response.blob();
      loadNewFile(new File([blob], name, { type: blob.type }), false);
    } catch (err) {
      alert("Failed to import cloud file.");
      setLoading(false);
    }
  };

  const openGoogleDrive = () => {
    if (!window.google?.picker) return alert("Google Drive is Loading...");
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
    if (!window.Dropbox) return alert("Dropbox is Loading...");
    window.Dropbox.choose({
      success: (files) => handleCloudImport(files[0].link, files[0].name),
      linkType: "direct",
      extensions: ['.pdf'],
    });
  };

  const loadNewFile = async (file, replace = false) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
      const pdf = await loadingTask.promise;
      const newItems = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        
        const uniqueId = `p-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        newItems.push({ id: uniqueId, image: canvas.toDataURL('image/jpeg', 0.8), rotation: 0, fileRef: file, originalIndex: i - 1 });
        if (i % 3 === 0) await new Promise(r => setTimeout(r, 0));
        canvas.width = 0; canvas.height = 0; 
      }
      setPages(prev => replace ? newItems : [...prev, ...newItems]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Error loading PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    if (pages.length === 0) return;
    setLoading(true);
    try {
      const newDoc = await PDFDocument.create();
      const pdfCache = new Map();
      for (const p of pages) {
        let sourceDoc = pdfCache.get(p.fileRef) || await PDFDocument.load(await p.fileRef.arrayBuffer());
        pdfCache.set(p.fileRef, sourceDoc);
        const [copied] = await newDoc.copyPages(sourceDoc, [p.originalIndex]);
        if (p.rotation !== 0) copied.setRotation(degrees(p.rotation));
        newDoc.addPage(copied);
      }
      const cleanFileName = initialFile?.name.replace(/\.pdf$/i, '') || 'Document';
      const timestamp = Date.now();
      const bytes = await newDoc.save();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      link.download = `FlexXpdf_Organize_${cleanFileName}_${timestamp}.pdf`;
      link.click();
    } catch (err) { console.error("Export Error:", err); } finally { setLoading(false); }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    // Haptic feedback for mobile users
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50); 
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIdx = items.findIndex(i => i.id === active.id);
        const newIdx = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
    setActiveId(null);
  };

  const activePage = pages.find(p => p.id === activeId);
  const fileSize = initialFile ? (initialFile.size / (1024 * 1024)).toFixed(2) : "0.00";

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-[calc(100vh-90px)] bg-[#F8F9FA] overflow-hidden md:rounded-xl border border-slate-200 md:shadow-xl relative">
      <input type="file" hidden ref={fileInputRef} accept="application/pdf" onChange={(e) => { if(e.target.files[0]) loadNewFile(e.target.files[0], false); setIsMenuOpen(false); }} />

      {/* --- SIDEBAR: DESKTOP --- */}
      <aside className="hidden md:flex w-64 bg-[#F1F3F4] border-r border-slate-200 p-6 flex-col gap-8">
        <div>
          <h1 className="text-red-600 font-black text-xl mb-6">FlexXpdf</h1>
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">Organize<br/>Pages</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex items-center gap-1 group focus-within:border-red-500 transition-all">
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-between p-2 pl-3 font-bold text-slate-700 hover:text-red-600 transition-all text-sm cursor-pointer">
              Add Pages <Plus size={14} className="text-slate-400 group-hover:text-red-500" />
            </button>
            <div className="h-6 w-[1px] bg-slate-200" />
            <div className="flex items-center px-1">
              <button onClick={openGoogleDrive} className="p-1.5 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"><img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-4 h-4" alt="Drive" /></button>
              <button onClick={openDropbox} className="p-1.5 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-4 h-4" alt="Dropbox" /></button>
            </div>
          </div>
          <button onClick={() => initialFile && loadNewFile(initialFile, true)} className="flex items-center justify-between w-full p-3 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 hover:border-red-500 transition-all text-sm cursor-pointer shadow-sm">
            Reset Layout <RefreshCw size={14} className="text-slate-400" />
          </button>
        </div>

        <div className="mt-auto bg-slate-200/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded">SELECTION</span>
            <span className="text-[10px] font-bold text-red-600">{pages.length} Pages</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Rearrange, rotate, or delete pages before finalizing.</p>
          <button onClick={handleApplyChanges} disabled={loading || pages.length === 0} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Apply Changes"}
          </button>
        </div>
      </aside>

      {/* --- SIDEBAR: MOBILE --- */}
      <aside className="md:hidden w-14 bg-[#F1F3F4] border-l border-slate-200 flex flex-col items-center py-6 gap-6 order-last relative z-10">
        <div className="relative flex flex-col items-center gap-4">
          <div className={`flex flex-col gap-3 transition-all duration-300 origin-bottom ${isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'}`}>
             <button onClick={openDropbox} className="p-2.5 bg-white rounded-full border border-slate-200 shadow-xl active:bg-slate-50 transition-colors"><img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-5 h-5" alt="Dropbox" /></button>
             <button onClick={openGoogleDrive} className="p-2.5 bg-white rounded-full border border-slate-200 shadow-xl active:bg-slate-50 transition-colors"><img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5" alt="Drive" /></button>
             <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-white rounded-full border border-slate-200 shadow-xl active:bg-slate-50 transition-colors text-slate-600"><FileText size={20} /></button>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 shadow-md transition-all duration-300 ${isMenuOpen ? 'bg-red-600 text-white' : 'bg-white text-red-600'}`}>
            <Plus size={22} className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-45' : 'rotate-0'}`} />
          </button>
        </div>
        <button onClick={() => initialFile && loadNewFile(initialFile, true)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-500 shadow-sm active:bg-slate-50"><RefreshCw size={20} /></button>
      </aside>

      {/* --- MAIN PANEL --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-white" onClick={() => setIsMenuOpen(false)}>
        <header className="hidden md:flex h-20 bg-white border-b border-slate-200 px-8 items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-2.5 bg-red-50 rounded-lg text-red-500 flex-shrink-0"><FileText size={24} /></div>
            <h3 className="font-bold text-slate-800 text-sm truncate">{initialFile?.name || 'Untitled-Document.pdf'}</h3>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 uppercase">File Size <span className="text-red-600 ml-1">{fileSize} MB</span></div>
            <button onClick={onCancel} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer bg-white"><X size={14} /> CANCEL</button>
          </div>
        </header>

        <div 
          ref={scrollableContainerRef} 
          className="flex-1 overflow-y-auto bg-[#FBFBFC]"
        >
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
            autoScroll={{
              threshold: { x: 0, y: 0.1 },
              acceleration: 15,
              canScroll: (element) => element === scrollableContainerRef.current
            }}
          >
            <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
              {loading && pages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-red-500" size={32} />
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Generating Workspace...</p>
                </div>
              ) : (
                <div className="p-6 md:p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10 max-w-7xl mx-auto pb-20 md:pb-10">
                    {pages.map((p, i) => (
                      <SortablePageItem 
                        key={p.id} id={p.id} page={p} index={i}
                        onRotate={(idx) => setPages(prev => prev.map((pg, pi) => pi === idx ? {...pg, rotation: (pg.rotation + 90) % 360} : pg))}
                        onDelete={(idx) => setPages(prev => prev.filter((_, pi) => pi !== idx))}
                      />
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="hidden md:flex aspect-[3/4] border-2 border-dashed border-slate-200 rounded-xl flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition-all text-slate-300 hover:text-red-400 cursor-pointer"
                    >
                      <Plus size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Page</span>
                    </button>
                  </div>
                </div>
              )}
            </SortableContext>

            <DragOverlay adjustScale={true} dropAnimation={null}>
              {activeId ? (
                /* Scale-90 added here for the 'shrinking' effect when dragging */
                <div className="w-32 md:w-40 shadow-2xl rounded-xl overflow-hidden border-2 border-red-500 bg-white pointer-events-none opacity-90 z-[1000] scale-90 transition-transform duration-200">
                  <img 
                    src={activePage?.image} 
                    style={{ transform: `rotate(${activePage?.rotation}deg)` }} 
                    className="w-full h-auto" 
                    alt="" 
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <button 
        onClick={handleApplyChanges}
        disabled={loading || pages.length === 0}
        className="md:hidden fixed bottom-6 right-20 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 z-20"
      >
        {loading ? <Loader2 size={24} className="animate-spin" /> : <Check size={28} />}
      </button>
    </div>
  );
}