"use client";

import { useState, useCallback, useEffect } from "react";
import type { DiseaseAnalysisResult } from "@/types/disease";

export function useDiseaseDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>("");
  const [result, setResult] = useState<DiseaseAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectFile = useCallback((selectedFile: File) => {
    setError(null);
    setResult(null);

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(selectedFile.type.toLowerCase())) {
      setError("Please select a valid image file (JPEG, PNG, or WEBP).");
      return false;
    }

    // Validate size (max 15MB)
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("Image file is too large. Please upload an image under 15MB.");
      return false;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return true;
  }, []);

  const clearSelection = useCallback(() => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
    setProgressStage("");
  }, [previewUrl]);

  const analyze = useCallback(async () => {
    if (!file) {
      setError("Please select or capture a crop image first.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgressStage("Uploading crop image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgressStage("Classifying leaf pathology with DeiT model...");

      // Call our Next.js API route proxy which handles timeouts, fallback, and CORS
      const res = await fetch("/api/disease/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errMessage = "Analysis failed. Please try again.";
        try {
          const errData = await res.json();
          errMessage = errData.error || errData.message || errMessage;
        } catch {
          // ignore parsing error
        }
        throw new Error(errMessage);
      }

      setProgressStage("Retrieving agronomic treatment advisory...");
      const data = await res.json();

      if (!data.prediction && !data.top_prediction) {
        throw new Error("Invalid response received from detection model.");
      }

      const normalizedResult: DiseaseAnalysisResult = {
        prediction: data.prediction || {
          top_prediction: data.top_prediction,
          confidence: data.confidence,
          confidence_pct: data.confidence_pct,
          is_healthy: data.is_healthy,
          is_low_confidence: data.is_low_confidence,
          threshold: data.threshold,
          note: data.note,
          top_k: data.top_k,
        },
        advisory: data.advisory || null,
      };

      setResult(normalizedResult);
    } catch (err: any) {
      console.error("Disease analysis error:", err);
      setError(
        err?.message ||
          "Could not connect to Disease Detection service. Please ensure the model server is running.",
      );
    } finally {
      setIsAnalyzing(false);
      setProgressStage("");
    }
  }, [file]);

  return {
    file,
    previewUrl,
    isAnalyzing,
    progressStage,
    result,
    error,
    selectFile,
    clearSelection,
    analyze,
  };
}
