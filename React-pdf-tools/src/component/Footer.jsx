import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-[#F8FAFC] border-t border-slate-200 pt-16 pb-8 mt-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">
                    
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-[#E53E3E] p-1.5 rounded-lg">
                                <span className="material-symbols-outlined text-white text-xl block">picture_as_pdf</span>
                            </div>
                            <span className="font-black text-xl tracking-tight text-[#1E293B]">
                                FlexX<span className="text-[#E53E3E]">pdf</span>
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-medium">
                            The ultimate toolkit for your PDF documents. Secure, fast, and easy to use on any device.
                        </p>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                        {/* Solutions */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Solutions</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">Merge PDF</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">Split PDF</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">Compress PDF</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">Edit PDF</a></li>
                            </ul>
                        </div>

                        {/* Convert */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Convert</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">PDF to Word</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">PDF to Excel</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">PDF to PPT</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">PDF to JPG</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Company</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">Pricing</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">Help Center</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">About Us</a></li>
                                <li><a href="#" className="text-slate-500 hover:text-[#E53E3E] text-sm transition-colors font-medium">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-xs font-medium">
                        © 2026 FlexXpdf. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors">Privacy Policy</a>
                        <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors">Terms of Service</a>
                        <a href="#" className="text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors">Cookies Settings</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;