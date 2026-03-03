import React from 'react'

const footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-900 border-t border-primary/5 py-8 md:py-10 mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2 text-red-500 opacity-80">
                    <span className="material-symbols-outlined font-bold">picture_as_pdf</span>
                    <span className="font-bold text-sm uppercase tracking-widest">FlexXpdf</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm order-3 md:order-2">
                    © 2026 FlexXpdf Inc.
                </p>
                <div className="flex gap-6 text-slate-500 dark:text-slate-400 text-xs md:text-sm order-2 md:order-3">
                    <a className="hover:text-red-500 transition-colors" href="#">Privacy</a>
                    <a className="hover:text-red-500 transition-colors" href="#">Terms</a>
                    <a className="hover:text-red-500 transition-colors" href="#">Support</a>
                </div>
            </div>
        </footer>
    )
}

export default footer
