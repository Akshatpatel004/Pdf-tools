import React, { useEffect, useRef, useState } from "react";
import { Designer } from "@pdfme/ui";
import { text, image } from "@pdfme/schemas";
import SignatureCanvas from "react-signature-canvas";
import { X, Signature, Type, CalendarDays, Heading1, CheckSquare, Image as ImageIcon, Upload } from 'lucide-react';

const SignPdf = ({ pdfData, onBack }) => {
  const designerContainer = useRef(null);
  const designer = useRef(null);
  const sigCanvas = useRef(null);
  const fileInputRef = useRef(null);

  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [sigMode, setSigMode] = useState("draw"); // draw, type, upload
  const [typedSignature, setTypedSignature] = useState("");
  const [sigColor, setSigColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("transparent"); // Default transparent
  const [fontFamily, setFontFamily] = useState("Pacifico");

  useEffect(() => {
    if (designerContainer.current && !designer.current) {
      designer.current = new Designer({
        domContainer: designerContainer.current,
        template: { basePdf: pdfData, schemas: [{}] },
        plugins: { text, image },
      });
    }
  }, [pdfData]);

  const updateDesigner = (newSchema) => {
    const template = designer.current.getTemplate();
    template.schemas[0].push(newSchema);
    designer.current.updateTemplate(template);
    setShowSignaturePad(false);
  };

  const handleApplySignature = (dataUrl) => {
    updateDesigner({
      name: `sig_${Date.now()}`, type: "image",
      position: { x: 50, y: 50 }, width: 100, height: 40, content: dataUrl,
    });
  };

  const processTypedSignature = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 150;
    const ctx = canvas.getContext("2d");

    // Background applied only if not transparent
    if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = sigColor;
    ctx.font = `48px ${fontFamily}`;
    ctx.fillText(typedSignature, 20, 90);
    handleApplySignature(canvas.toDataURL("image/png"));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => handleApplySignature(event.target.result);
    reader.readAsDataURL(file);
  };

  const toggleCheckbox = (schema) => {
    const isChecked = schema.content === "✓";
    return { ...schema, content: isChecked ? "☐" : "✓" };
  };

  // Tool Handlers
  const addTextField = () => updateDesigner({ name: "text", type: "text", position: { x: 50, y: 50 }, width: 100, height: 20, content: "Enter Text", fontSize: 16 });
  const addDateField = () => updateDesigner({ name: "date", type: "text", position: { x: 50, y: 50 }, width: 80, height: 20, content: new Date().toLocaleDateString(), fontSize: 16 });
  const addInitials = () => updateDesigner({ name: "initials", type: "text", position: { x: 50, y: 50 }, width: 40, height: 20, content: "AB", fontSize: 20 });
// Updated Checkbox Handler
const addCheckbox = () => updateDesigner({ 
  name: "checkbox", 
  type: "text", 
  position: { x: 50, y: 50 }, 
  width: 24, 
  height: 24, 
  content: "☐", // Standard empty box
  fontSize: 24,
  textAlign: "center" 
});

// Logic to toggle state
const handleCheckboxClick = (schema) => {
  const newContent = schema.content === "☐" ? "☑" : "☐"; // Toggles between empty box and checked box
  // Update your designer schema here with the newContent
};

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-xl font-black text-red-600">FlexXpdf</h1>
        <button onClick={onBack} className="text-slate-500">Cancel</button>
      </header>

      <div className="bg-white border-b p-3 flex gap-2 justify-center">
        <button onClick={() => setShowSignaturePad(true)} className="px-4 py-2 border rounded-lg hover:bg-red-50">Signature</button>
        {/* <button onClick={addTextField} className="px-4 py-2 border rounded-lg">Text</button> */}
        <button onClick={addDateField} className="px-4 py-2 border rounded-lg">Date</button>
        {/* <button onClick={addInitials} className="px-4 py-2 border rounded-lg">Initials</button> */}
        <button onClick={addCheckbox} className="px-4 py-2 border rounded-lg">Checkbox</button>
      </div>

      {/* Signature Modal */}
      {showSignaturePad && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-[400px]">
            {/* ADDED HEADER WITH CLOSE ICON */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Create Signature</h3>
              <button
                onClick={() => setShowSignaturePad(false)}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="flex gap-2 mb-4 border-b pb-2">
              <button onClick={() => setSigMode("draw")} className={`flex-1 p-2 ${sigMode === 'draw' ? 'text-red-600 font-bold' : ''}`}>Draw</button>
              <button onClick={() => setSigMode("type")} className={`flex-1 p-2 ${sigMode === 'type' ? 'text-red-600 font-bold' : ''}`}>Type</button>
              <button onClick={() => setSigMode("upload")} className={`flex-1 p-2 ${sigMode === 'upload' ? 'text-red-600 font-bold' : ''}`}>Upload</button>
            </div>

            {sigMode === "draw" && <SignatureCanvas ref={sigCanvas} canvasProps={{ width: 400, height: 150, className: "border rounded" }} />}
            {sigMode === "type" && (
              <div className="space-y-3">
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Name..."
                  onChange={(e) => setTypedSignature(e.target.value)}
                />

                {/* Handwriting Style Selection */}
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) => setFontFamily(e.target.value)}
                  value={fontFamily}
                >
                  <option value="Pacifico">Pacifico</option>
                  <option value="Dancing Script">Dancing Script</option>
                  <option value="Satisfy">Satisfy</option>
                  <option value="cursive">Cursive</option>
                </select>

                <div className="flex gap-2.5 mt-2">
                  <label className="ml-2">Text color</label>
                  <input type="color" title="Text Color" onChange={(e) => setSigColor(e.target.value)} />
                  <label className="ml-2">Background color</label>
                  <input type="color" title="Bg Color" onChange={(e) => setBgColor(e.target.value)} />
                </div>
              </div>
            )}
            {sigMode === "upload" && <input type="file" accept="image/*" onChange={handleFileUpload} />}

            <button onClick={() => sigMode === "draw" ? handleApplySignature(sigCanvas.current.toDataURL("image/png")) : sigMode === "type" ? processTypedSignature() : null} className="w-full mt-4 bg-red-600 text-white p-2 rounded-lg font-bold">Apply</button>
          </div>
        </div>
      )}
      <div ref={designerContainer} className="flex-1 bg-white" />
    </div>
  );
};
export default SignPdf;