'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileUp, Sparkles, Loader2, CheckCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <h2 className="font-serif text-lg font-bold tracking-wide text-amber-400 flex items-center gap-2">
            <UploadCloud className="w-5 h-5" />
            Add Books & Comics to Trophy Room
          </h2>
          {!progress?.isIngesting && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-100 p-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {progress?.isIngesting ? (
            /* Ingestion in Progress */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
              <div>
                <h3 className="font-serif text-base font-bold text-stone-100 mb-1">
                  Ingesting File {progress.currentFileIndex} of {progress.totalFiles}
                </h3>
                <p className="text-xs font-mono text-amber-400/90 truncate max-w-sm mx-auto">
                  {progress.currentFileName}
                </p>
                <p className="text-xs font-sans text-stone-400 mt-2">
                  {progress.statusMessage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
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
              className={`border-2 border-dashed rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-amber-500 bg-amber-950/20 scale-[1.01]'
                  : 'border-stone-700/80 bg-stone-950/40 hover:border-amber-500/60 hover:bg-stone-950/80'
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

              <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-600/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                <FileUp className="w-8 h-8" />
              </div>

              <h3 className="font-serif text-base font-bold text-stone-100 mb-1">
                Drop CBZ, EPUB, or PDF files here
              </h3>
              <p className="text-xs font-sans text-stone-400 max-w-xs mb-4">
                Or click to browse from your device. Direct stream ingestion into Cloudflare R2 vault.
              </p>

              {/* Format pills */}
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-400">
                <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700">CBZ / CBR</span>
                <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700">EPUB</span>
                <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700">PDF</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!progress?.isIngesting && (
          <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex justify-between items-center text-xs text-stone-500">
            <span className="font-mono">Zero Egress Cloud Vault</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md transition-colors font-mono text-xs uppercase"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
