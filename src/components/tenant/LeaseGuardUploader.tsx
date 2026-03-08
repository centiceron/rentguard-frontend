"use client";
import axios from "axios";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function LeaseGuardUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setProgress(15);
    setResult(null);

    const formData = new FormData();
    formData.append("document", file);

    try {
      // Simulate progress while waiting for the AI backend
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 85 ? 85 : prev + 10));
      }, 800);

      console.log("Sending PDF to RentGuard AI API...");
      const response = await axios.post("/api/lease/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        setResult(response.data);
        setIsAnalyzing(false);
      }, 500);
    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
      setProgress(0);
      alert("Failed to analyze the document. Check the backend console.");
    }
  };

  return (
    <Card className='w-full max-w-2xl mx-auto border-slate-200 shadow-sm'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-slate-800'>
          <ShieldAlert className='h-6 w-6 text-indigo-600' />
          Lease Guard AI
        </CardTitle>
        <CardDescription>
          Upload your draft agreement. Our RAG engine will audit it against the
          Model Tenancy Act 2021.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* State 1: Upload Zone */}
        {!file && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className='h-10 w-10 text-slate-400 mx-auto mb-4' />
            <p className='text-sm font-medium text-slate-700'>
              Drag & drop your PDF lease here, or click to browse
            </p>
            <p className='text-xs text-slate-500 mt-1'>
              Maximum file size 10MB
            </p>
          </div>
        )}

        {/* State 2: File Selected & Analyzing */}
        {file && !result && (
          <div className='space-y-4'>
            <div className='flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50'>
              <FileText className='h-8 w-8 text-indigo-500' />
              <div className='flex-1 overflow-hidden'>
                <p className='text-sm font-medium truncate'>{file.name}</p>
                <p className='text-xs text-slate-500'>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isAnalyzing && (
                <Button
                  onClick={handleAnalyze}
                  className='bg-indigo-600 hover:bg-indigo-700'
                >
                  Analyze Lease
                </Button>
              )}
            </div>

            {isAnalyzing && (
              <div className='space-y-2'>
                <div className='flex justify-between text-xs font-medium text-slate-600'>
                  <span>Extracting legal clauses...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className='h-2' />
              </div>
            )}
          </div>
        )}

        {/* State 3: Analysis Results */}
        {result && (
          <div className='space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            <div className='flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg'>
              <div>
                <h4 className='text-sm font-bold text-red-900'>
                  High Risk Detected
                </h4>
                <p className='text-xs text-red-700 mt-1'>
                  We found clauses violating current tenancy laws.
                </p>
              </div>
              <div className='text-right'>
                <span className='text-3xl font-black text-red-600'>
                  {result.riskScore}
                </span>
                <span className='text-xs text-red-600 font-bold'>/100</span>
              </div>
            </div>

            <div className='space-y-3'>
              <h5 className='text-sm font-semibold text-slate-800 border-b pb-2'>
                Red Flags (Requires Action)
              </h5>
              {result.redFlags.map((flag: any, index: number) => (
                <div
                  key={index}
                  className='flex gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm'
                >
                  <AlertTriangle className='h-5 w-5 text-red-500 shrink-0 mt-0.5' />
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <Badge
                        variant='destructive'
                        className='text-[10px] uppercase'
                      >
                        Clause {flag.clause}
                      </Badge>
                      <span className='text-xs font-medium text-slate-500'>
                        {flag.violation}
                      </span>
                    </div>
                    <p className='text-sm text-slate-700'>{flag.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant='outline'
              className='w-full mt-4'
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
            >
              Upload Another Draft
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
