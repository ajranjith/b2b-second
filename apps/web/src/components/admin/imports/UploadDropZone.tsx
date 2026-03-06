"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  accept?: string;
  disabled?: boolean;
}

export function UploadDropZone({
  onFileSelect,
  selectedFile,
  onClearFile,
  accept = ".xlsx,.xls",
  disabled = false,
}: UploadDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [disabled, onFileSelect]
  );

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  if (selectedFile) {
    return (
      <div className="relative rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{selectedFile.name}</p>
            <p className="text-sm text-slate-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={onClearFile}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200",
        isDragOver
          ? "border-indigo-400 bg-indigo-50/70 scale-[1.01]"
          : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/30",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
            isDragOver
              ? "bg-indigo-100 scale-110"
              : "bg-slate-100 group-hover:bg-indigo-100"
          )}
        >
          <Upload
            className={cn(
              "h-7 w-7 transition-colors",
              isDragOver ? "text-indigo-600 animate-pulse" : "text-slate-400"
            )}
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">
            {isDragOver ? "Drop your file here" : "Drag & drop your file here"}
          </p>
          <p className="text-xs text-slate-500">
            or <span className="text-indigo-600 font-medium">browse</span> to select
          </p>
        </div>

        <p className="text-xs text-slate-400">Supports: XLSX, XLS</p>
      </div>
    </div>
  );
}

export default UploadDropZone;
