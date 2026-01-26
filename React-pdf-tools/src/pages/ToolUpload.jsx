import React, { useState, useRef, useEffect } from 'react';
import { useParams } from "react-router-dom";
import tools from "../data/tools.json";
import { Upload, Download, X } from 'lucide-react';


const ToolUpload = () => {
  const { toolName } = useParams();
  const tool = tools.find(t => t.route === toolName);
  if (!tool) return <h2>Tool not found</h2>;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    window.onbeforeunload = isLoading ? () => true : null;
  }, [isLoading]);


  // Handle file selection via input or drag-and-drop
  const handleFiles = (files) => {
    const allowType = tool.accept
      .split(',')
      .map(type => type.trim())
    const pdfs = Array.from(files).filter(file => file.type === tool.mineType || allowType.includes(file.type));

    if (pdfs.length === 0) {
      alert(tool.noFileAlert);
      return;
    }

    setSelectedFiles(prev => [...prev, ...pdfs]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

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

    if (selectedFiles.length < tool.minFiles || isLoading) {
      alert(tool.noFileAlert);
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

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
        setIsLoading(false);
        const timestamp = Date.now();
        a.download = selectedFiles.length === 1
          ? `${tool.downloadFileName}${timestamp}${tool.downloadFileType1}`
          : `${tool.downloadFileName}${timestamp}${tool.downloadFileType2}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if (!response.ok) {
        setIsLoading(false);
        const errText = await response.text();
        console.error("Server error:", errText);
        alert(tool.failAlert);
        return;
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Upload error:", error);
      alert("An error occurred while communicating with the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#7494EC] flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl p-8 flex flex-col transition-all duration-300">

        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-500 tracking-wider">{tool.h1}</h1>
          <p className="text-sm text-slate-400">{tool.p}</p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors 
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-[#A8B3E3] bg-gradient-to-b from-white to-[#F1F6FF]'}`}
        >
          <img src="\icons/cloud.png" alt="cloud" />
          <span className="text-slate-500 text-sm mb-2 pt-3">Drag & Drop your files here</span>
          <span className="text-slate-400 text-xs mb-4 font-medium">OR</span>

          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-[#025bee] text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Upload size={18} />
            Choose Files To Upload
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            multiple
            accept={tool.accept}
          />

          <div className="mt-4 text-sm text-slate-600">
            {selectedFiles.length > 0 ? `${selectedFiles.length} Files Selected` : 'No Files Chosen'}
          </div>
        </div>

        {/* File List Section */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-slate-500 text-sm mb-3">Uploaded Files</h3>
            <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className=" max-h-[62px] bg-[#eff5ff] text-[#025bee] flex items-center justify-between p-3 rounded-lg group animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center gap-3 truncate">
                    {/* <FileText size={20} className="shrink-0" /> */}
                    <img src={tool.icon} alt="file" className='shrink-0' />
                    <span className="text-sm font-medium truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold shrink-0">
                      {(file.size / 1024).toFixed(1) >= 1024 ? `${((file.size / 1024).toFixed(1) / 1024).toFixed(1)}MB` : `${(file.size / 1024).toFixed(1)}KB`}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            disabled={isLoading || selectedFiles.length < tool.minFiles}
            onClick={handleSubmit}
            className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 text-white font-bold text-lg transition-all 
              ${selectedFiles.length >= tool.minFiles && !isLoading
                ? 'bg-green-600 hover:bg-green-700 shadow-lg'
                : 'bg-gray-300 cursor-not-allowed'}`}
          >
            {isLoading ?
              <>
                {isLoading && <span className="animate-spin ">⏳</span>}
                <span className="text-black">"Processing..."</span>
              </>
              : (
                <>
                  <Download size={18} />
                  Download
                </>
              )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolUpload;