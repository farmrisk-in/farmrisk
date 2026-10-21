"use client";

import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  X,
  Sparkles,
  LoaderCircle,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiseaseUploaderProps {
  file: File | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
  progressStage?: string;
  error: string | null;
  onSelectFile: (file: File) => void;
  onClear: () => void;
  onAnalyze: () => void;
}

export function DiseaseUploader({
  file,
  previewUrl,
  isAnalyzing,
  progressStage,
  error,
  onSelectFile,
  onClear,
  onAnalyze,
}: DiseaseUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { t } = useLanguage();
  const tools = t.tools;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onSelectFile(droppedFile);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSelectFile(e.target.files[0]);
    }
    // Reset input value so re-selecting same file triggers change
    e.target.value = "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* HIDDEN INPUTS */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* DRAG & DROP OR PREVIEW CONTAINER */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 select-none ${
            isDragOver
              ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15"
              : "border-border bg-card/50 hover:bg-muted/40 hover:border-emerald-500/40 shadow-xs"
          }`}
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
            <UploadCloud className="size-7" />
          </div>

          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {tools?.diseaseUploadTitle || "Upload Crop or Leaf Image"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tools?.diseaseUploadDesc ||
                "Drag & drop an affected leaf photo here, or click to browse. Supports JPEG, PNG, WEBP (up to 15MB)."}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div
            className="flex items-center gap-2 pt-2 flex-wrap justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold h-8 rounded-lg border-border hover:bg-muted cursor-pointer flex items-center gap-1.5"
            >
              <ImageIcon className="size-3.5 text-muted-foreground" />
              <span>{tools?.browseFiles || "Browse Files"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              className="text-xs font-semibold h-8 rounded-lg border-border hover:bg-muted cursor-pointer flex items-center gap-1.5"
            >
              <Camera className="size-3.5 text-muted-foreground" />
              <span>{tools?.takePhoto || "Take Photo"}</span>
            </Button>
          </div>
        </div>
      ) : (
        /* IMAGE PREVIEW CARD */
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center gap-4 transition-all">
          {/* IMAGE THUMBNAIL */}
          <div className="relative size-28 sm:size-32 rounded-lg overflow-hidden border border-border shrink-0 bg-muted/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected crop"
              className="w-full h-full object-cover"
            />
          </div>

          {/* FILE DETAILS */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-center sm:text-left w-full">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20">
                <FileCheck2 className="size-3" />
                {tools?.imageReady || "Image Ready"}
              </span>
              {file && (
                <span className="text-[11px] text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-foreground truncate max-w-sm">
              {file?.name || "Uploaded crop photograph"}
            </h4>

            <p className="text-xs text-muted-foreground">
              {tools?.readyForInference ||
                "Ready for DeiT neural vision classification and ICAR knowledge base retrieval."}
            </p>

            {/* PREVIEW CONTROLS */}
            <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="text-xs font-medium h-7 px-2.5 rounded-md border-border cursor-pointer"
              >
                {tools?.changePhoto || "Change Photo"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={isAnalyzing}
                className="text-xs font-medium h-7 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md cursor-pointer flex items-center gap-1"
              >
                <X className="size-3" />
                {tools?.removePhoto || "Remove"}
              </Button>
            </div>
          </div>

          {/* ANALYZE BUTTON */}
          <div className="shrink-0 w-full sm:w-auto flex flex-col items-center sm:items-end gap-1">
            <Button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-10 px-5 rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isAnalyzing ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  <span>{tools?.analyzingCrop || "Analyzing..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>{tools?.analyzeCrop || "Analyze Crop"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ANALYSIS PROGRESS INDICATOR */}
      {isAnalyzing && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-pulse">
          <LoaderCircle className="size-4 animate-spin shrink-0 text-emerald-600" />
          <span>{progressStage || tools?.analyzingCrop || "Processing vision diagnostics..."}</span>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">{tools?.analysisFailed || "Analysis Failed"}</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
