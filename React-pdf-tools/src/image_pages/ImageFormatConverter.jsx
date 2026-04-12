import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import tools from "../data/tools.json";
import { minetype_routename } from "../data/Minetype";
import Footer from "../component/Footer.jsx";
import { Loader2, Trash2, GripVertical, CheckCircle2, ShieldCheck, Zap, Globe, ArrowLeft, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { triggerAdOnce } from "../App.jsx"

// --- DND KIT IMPORTS ---
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableFileCard = ({ file, index, removeFile, tool, isLoading }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.6 : 1,
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-red-200 transition-all ${isDragging ? 'shadow-md border-red-400' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className={`p-1 ${isLoading ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
            >
                <GripVertical size={16} className="text-slate-400" />
            </div>

            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                <img src={tool.icon || tool.img} alt="" className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="font-bold text-slate-800 truncate text-[13px] leading-none mb-1">{file.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 leading-none mt-[2px] font-medium">
                    <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
            </div>
            <button
                onClick={() => removeFile(index)}
                disabled={isLoading}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-all disabled:opacity-30"
            >
                <Trash2 size={16} strokeWidth={2.5} />
            </button>
        </div>
    );
};

const ImageFormatConverter = () => {
    const { toolName } = useParams();
    const navigate = useNavigate();

    const tool = tools.find(t => t.route === "image-format-converter") || tools.find(t => t.route === toolName);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [targetFormat, setTargetFormat] = useState('png'); 
    const fileInputRef = useRef(null);

    const formats = ['jpeg', 'jpg', 'png', 'tiff', 'webp', 'gif'];

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- CLOUD IMPORT LOGIC ---
    useEffect(() => {
        const initGapi = () => {
            if (window.gapi) {
                window.gapi.load('picker', () => console.log("Picker pre-loaded"));
            }
        };
        const timer = setInterval(() => {
            if (window.gapi) {
                initGapi();
                clearInterval(timer);
            }
        }, 500);
        return () => clearInterval(timer);
    }, []);

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
        if (!window.google || !window.google.picker) return alert("Google SDK warming up...");
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: async (response) => {
                if (response.error) return;
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
            },
        });
        client.requestAccessToken();
    };

    const openDropbox = () => {
        if (!window.Dropbox) return alert("Dropbox SDK not loaded");
        window.Dropbox.choose({
            success: (files) => handleCloudImport(files[0].link, files[0].name),
            linkType: "direct",
            extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tiff'],
        });
    };

    if (!tool) return <div className="h-screen flex items-center justify-center bg-slate-50">Tool not found</div>;

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setSelectedFiles((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleFiles = async (files) => {
        const fileList = Array.from(files);
        setIsSuccess(false);

        const allowedExtraTypes = minetype_routename(tool.route);
        const toolDefinedType = tool.minetype || tool.mineType;

        const processedFiles = fileList.map((file) => {
            const isAllowedByHelper = Array.isArray(allowedExtraTypes)
                ? allowedExtraTypes.includes(file.type)
                : file.type === allowedExtraTypes;

            const isAllowedByTool = toolDefinedType && file.type === toolDefinedType;

            if (isAllowedByHelper || isAllowedByTool) {
                file.id = `${file.name}-${Date.now()}-${Math.random()}`;
                return file;
            }
            return null;
        });

        const validFiles = processedFiles.filter(f => f !== null);

        if (validFiles.length === 0) {
            alert(tool.noFileAlert || "Invalid file type. Please select supported image formats.");
            return;
        }

        setSelectedFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length < (tool.minFiles || 1) || isLoading) return;
        setIsLoading(true);
        triggerAdOnce();

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('files', file));
        formData.append('format', targetFormat);

        try {
            const API_BASE = tool.api === 1 ? import.meta.env.VITE_SERVER_API : import.meta.env.VITE_SERVER_API2;
            const response = await fetch(`${API_BASE}${tool.action}`, { method: "POST", body: formData });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const timestamp = Date.now();
                a.download = selectedFiles.length === 1
                    ? `${tool.downloadFileName}${selectedFiles[0].name.replace(/\.[^/.]+$/, "")}_${timestamp}.${targetFormat}`
                    : `${tool.downloadFileName}${timestamp}.zip`;

                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setIsSuccess(true);
            } else {
                alert(tool.failAlert || "Conversion failed.");
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
            <main className="max-w-4xl mx-auto px-4 py-6 md:py-12">
                <nav className="flex items-center justify-between mb-8">
                    <div className="hidden md:flex items-center gap-3 text-sm tracking-tight">
                        <span className="cursor-pointer font-medium text-slate-400 hover:text-red-500 transition-colors uppercase text-[11px] tracking-widest" onClick={() => navigate('/')}>Home</span>
                        <span className="text-slate-300 font-light text-lg">/</span>
                        <span className="font-medium text-red-600 text-base md:text-lg capitalize">{tool.title.replace(/-/g, ' ')}</span>
                    </div>
                    <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                    <div className="md:hidden font-medium text-base text-slate-900 tracking-tight capitalize">{tool.title.replace(/-/g, ' ')}</div>
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
                            <h3 className="text-xl font-bold text-slate-800">Ready!</h3>
                            <p className="text-sm text-slate-500 mt-1 mb-6">Files converted to {targetFormat.toUpperCase()} successfully.</p>
                            <button onClick={() => { setSelectedFiles([]); setIsSuccess(false); }} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all cursor-pointer">
                                Convert More
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 transition-transform hover:scale-110">
                                <img src={tool.img} alt="" className="w-10 h-10" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Drag and drop images here</h3>
                            <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
                                Supported: JPG, PNG, WEBP, GIF, TIFF<br />
                                <span className="opacity-70 font-medium text-red-400">Min. {tool.minFiles} {tool.minFiles === 1 ? 'file' : 'files'} required</span>
                            </p>
                            
                            {/* CLOUD BUTTONS SECTION */}
                            <div className="flex flex-col items-center gap-4">
                                <button onClick={() => fileInputRef.current.click()} className="px-10 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer">
                                    Select Files
                                </button>
                                <div className="flex items-start gap-4 p-4">
                                    <button onClick={openGoogleDrive} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer" title="Google Drive">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6" alt="Google Drive" />
                                    </button>
                                    <button onClick={openDropbox} className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer" title="Dropbox">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg" className="w-6 h-6" alt="Dropbox" />
                                    </button>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" multiple accept="image/*" />
                        </>
                    )}
                </section>

                {selectedFiles.length > 0 && !isSuccess && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <ImageIcon size={18} className="text-red-500" />
                                <h3 className="font-bold text-slate-800 text-sm">Target Format</h3>
                            </div>
                            <div className="relative group">
                                <select
                                    value={targetFormat}
                                    onChange={(e) => setTargetFormat(e.target.value)}
                                    className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-bold text-slate-700 cursor-pointer transition-all"
                                >
                                    {formats.map(fmt => (
                                        <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-red-500 transition-colors" size={18} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-bold flex items-center gap-2 text-sm text-slate-800">Selected ({selectedFiles.length})</h3>
                            <button onClick={() => setSelectedFiles([])} className="text-red-500 text-xs font-bold hover:underline cursor-pointer">Clear all</button>
                        </div>

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <div className="space-y-2 mb-6 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                                <SortableContext items={selectedFiles.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                    {selectedFiles.map((file, index) => (
                                        <SortableFileCard
                                            key={file.id}
                                            file={file}
                                            index={index}
                                            tool={tool}
                                            removeFile={removeFile}
                                            isLoading={isLoading}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        </DndContext>

                        <div className="bg-[#1E293B] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between shadow-xl">
                            <div className="text-white text-center md:text-left mb-4 md:mb-0">
                                <h4 className="font-bold text-base leading-tight">Convert to {targetFormat.toUpperCase()}?</h4>
                                <p className="text-slate-400 text-xs mt-0.5">{selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'} ready to be processed.</p>
                            </div>
                            <button onClick={handleSubmit} disabled={isButtonDisabled} className={`w-full md:w-auto px-10 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isButtonDisabled ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-red-500 hover:bg-red-600 cursor-pointer shadow-lg shadow-red-500/20'}`}>
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Download NOW</>}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <section className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto"><ShieldCheck size={24} /></div>
                        <h4 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider">Secure</h4>
                        <p className="text-xs text-slate-400">All uploads are encrypted and removed automatically.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto"><Zap size={24} /></div>
                        <h4 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider">Fast</h4>
                        <p className="text-xs text-slate-400">Professional-grade conversion in seconds.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto"><Globe size={24} /></div>
                        <h4 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider">Universal</h4>
                        <p className="text-xs text-slate-400">Compatible with all modern web browsers.</p>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default ImageFormatConverter;
