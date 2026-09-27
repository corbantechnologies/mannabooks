"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Spinner } from "./Spinner";

export interface AttachmentData {
  url: string;
  name: string;
  size?: number;
}

interface ReceiptAttachmentUploaderProps {
  shopSlug: string;
  category?: "payment-vouchers" | "vendor-bills" | "receipts" | "attachments";
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  onUploadSuccess: (data: AttachmentData) => void;
  onRemove?: () => void;
  readOnly?: boolean;
  compact?: boolean;
  label?: string;
  helperText?: string;
}

export default function ReceiptAttachmentUploader({
  shopSlug,
  category = "attachments",
  attachmentUrl,
  attachmentName,
  attachmentSize,
  onUploadSuccess,
  onRemove,
  readOnly = false,
  compact = false,
  label = "Supplier Receipt / Invoice Document",
  helperText = "Attach official eTIMS CU receipt, vendor invoice PDF, or photo proof (Max 10MB)",
}: ReceiptAttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAttachment = Boolean(attachmentUrl);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdf = attachmentName?.toLowerCase().endsWith(".pdf") || attachmentUrl?.toLowerCase().includes(".pdf");

  const handleUploadFile = async (file: File) => {
    // 1. Validation
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type.toLowerCase()) && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Invalid file format. Please upload a PDF, PNG, JPG, or WEBP file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed is 10MB.`);
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading attachment to media storage...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("shopSlug", shopSlug);
      formData.append("category", category);

      const res = await fetch("/api/upload/minio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload file to media storage");
      }

      toast.success("Document attached successfully!", { id: toastId });
      onUploadSuccess({
        url: data.url,
        name: data.fileName || file.name,
        size: data.fileSize || file.size,
      });
    } catch (err: any) {
      console.error("[Attachment Upload Error]", err);
      toast.error(err?.message || "Upload failed. Please check network connection.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  return (
    <div className="space-y-1.5 font-sans">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 block">
            {label}
          </label>
          {hasAttachment && (
            <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              ✓ Attached to MinIO
            </span>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={readOnly || isUploading}
      />

      {/* ATTACHED STATE */}
      {hasAttachment ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-2.5 shadow-2xs hover:border-zinc-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-base">
                {isPdf ? "📄" : "🖼️"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 truncate font-mono" title={attachmentName || "Attached File"}>
                  {attachmentName || "Attached Receipt"}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {formatFileSize(attachmentSize)} {isPdf ? "• PDF Document" : "• Image Document"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                title="Preview attachment"
              >
                👁 View
              </button>

              {/* Direct Download Link */}
              <a
                href={attachmentUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 rounded transition-colors no-underline"
                title="Download file"
              >
                ⬇ Download
              </a>

              {/* Replace / Remove Buttons */}
              {!readOnly && (
                <>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 rounded transition-colors"
                    title="Replace file"
                  >
                    🔄 Replace
                  </button>
                  {onRemove && (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={onRemove}
                      className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                      title="Remove attachment"
                    >
                      ✕ Remove
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* EMPTY / DROPZONE STATE */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!readOnly && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-lg transition-all text-center cursor-pointer ${
            isDragging
              ? "border-emerald-600 bg-emerald-50/60"
              : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/60 hover:bg-zinc-50"
          } ${compact ? "p-3" : "p-4"} ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <Spinner size={16} color="black" />
              <p className="text-xs font-semibold text-zinc-800">Uploading to media storage...</p>
              <p className="text-[10px] text-zinc-400 font-mono">media.mannabooks.co.ke</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-xl">📎</span>
              <p className="text-xs font-semibold text-zinc-800">
                <span className="text-emerald-700 hover:underline">Click to upload</span> or drag &amp; drop
              </p>
              <p className="text-[10px] text-zinc-500 font-sans">
                {helperText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewOpen && attachmentUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{isPdf ? "📄" : "🖼️"}</span>
                <span className="font-bold text-xs text-zinc-900 truncate font-mono">
                  {attachmentName || "Attachment Preview"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({formatFileSize(attachmentSize)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded transition-colors no-underline"
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="text-zinc-500 hover:text-black font-bold p-1 text-sm rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4 bg-zinc-100 flex items-center justify-center min-h-[400px]">
              {isPdf ? (
                <iframe
                  src={attachmentUrl}
                  className="w-full h-[70vh] rounded border border-zinc-300 bg-white"
                  title="PDF Attachment Preview"
                />
              ) : (
                <img
                  src={attachmentUrl}
                  alt={attachmentName || "Receipt Attachment"}
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
