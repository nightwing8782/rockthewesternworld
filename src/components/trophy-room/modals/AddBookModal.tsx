'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileUp, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { IngestionProgressState } from '@/types/trophy';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngest: (files: FileList | File[]) => Promise<void>;
  progress: IngestionProgressState | null;
}

export default function AddBookModal({
  isOpen,
  onClose,
  onIngest,
  progress,
}: AddBookModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onIngest(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onIngest(e.target.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#111827] rounded-3xl shadow-[8px_8px_0_#111827] max-w-lg w-full overflow-hidden text-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[#111827] bg-[#2ED573]">
          <h2 className="text-xl font-black uppercase tracking-wide text-[#111827] flex items-center gap-2">
            <Upload className="w-6 h-6 stroke-[2.5]" />
            Import Comics & Books
          </h2>
          {!progress?.isIngesting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white border-2 border-[#111827] text-[#111827] hover:bg-[#FF4757] hover:text-white shadow-[2px_2px_0_#111827] transition-colors"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 bg-paper-texture">
          {progress?.isIngesting ? (
            /* Ingestion in Progress */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FFDE59] border-3 border-[#111827] flex items-center justify-center shadow-[4px_4px_0_#111827] transform -rotate-3">
                <Loader2 className="w-9 h-9 animate-spin text-[#111827]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#111827] mb-1 uppercase">
                  Ingesting File {progress.currentFileIndex} of {progress.totalFiles}
                </h3>
                <p className="text-xs font-mono font-bold text-slate-800 truncate max-w-sm mx-auto bg-amber-100 px-3 py-1 rounded-lg border border-[#111827]">
                  {progress.currentFileName}
                </p>
                <p className="text-xs font-bold text-slate-600 mt-2">
                  {progress.statusMessage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white rounded-full h-3.5 overflow-hidden border-2 border-[#111827] shadow-[2px_2px_0_#111827]">
                <div
                  className="bg-[#2ED573] h-full transition-all duration-300"
                  style={{
                    width: `${Math.round((progress.currentFileIndex / progress.totalFiles) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            /* Dropzone Form */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-4 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                dragActive
                  ? 'border-[#FF4757] bg-rose-50 scale-[1.01]'
                  : 'border-[#111827] bg-white hover:bg-amber-50/50 shadow-[4px_4px_0_#111827]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".cbz,.cbr,.zip,.epub,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-[#FFDE59] border-3 border-[#111827] flex items-center justify-center text-[#111827] mb-4 shadow-[3px_3px_0_#111827] transform -rotate-3">
                <FileUp className="w-8 h-8 stroke-[2.5]" />
              </div>

              <h3 className="text-lg font-black text-[#111827] mb-1 uppercase tracking-wide">
                Drop CBZ, EPUB, or PDF files here
              </h3>
              <p className="text-xs font-bold text-slate-600 max-w-xs mb-4">
                Or click to browse from device. Direct stream ingestion into Cloudflare R2 vault with OPFS cache.
              </p>

              {/* Format pills */}
              <div className="flex items-center gap-2">
                <span className="comic-stamp text-[10px] px-2 py-0.5 rounded bg-[#FFDE59] text-[#111827]">
                  CBZ / CBR
                </span>
                <span className="comic-stamp text-[10px] px-2 py-0.5 rounded bg-[#00D2D3] text-[#111827]">
                  EPUB
                </span>
                <span className="comic-stamp text-[10px] px-2 py-0.5 rounded bg-[#FF4757] text-white">
                  PDF
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!progress?.isIngesting && (
          <div className="px-6 py-3 border-t-3 border-[#111827] bg-white flex justify-between items-center text-xs font-bold text-slate-600">
            <span className="font-mono">Zero Egress Cloud Vault</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#111827] rounded-xl border-2 border-[#111827] shadow-[2px_2px_0_#111827] transition-colors uppercase font-black text-xs"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
