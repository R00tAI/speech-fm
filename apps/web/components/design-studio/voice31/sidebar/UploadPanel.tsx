"use client";

import { CloudArrowUp, Eye, Trash, Image as ImageIcon, FilePdf, Spinner } from "@phosphor-icons/react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useVoice31Store } from "../Voice31Store";
import type { UploadedFile } from "../Voice31Store";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  architecture_blueprint: "ARCH",
  photo_landscape: "LAND",
  photo_portrait: "PORT",
  photo_object: "OBJ",
  technical_diagram: "DIAG",
  chart_data: "DATA",
  ui_mockup: "UI",
  art_illustration: "ART",
  document_page: "DOC",
};

interface UploadPanelProps {
  hex: string;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ hex }) => {
  const uploads = useVoice31Store((s) => s.uploads);
  const uploadingFile = useVoice31Store((s) => s.uploadingFile);
  const addUpload = useVoice31Store((s) => s.addUpload);
  const removeUpload = useVoice31Store((s) => s.removeUpload);
  const setUploadingFile = useVoice31Store((s) => s.setUploadingFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadingFile(true);
      setUploadError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/voice31/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          const msg = res.status === 401
            ? "Sign in required to upload"
            : err.error || `Upload failed (${res.status})`;
          setUploadError(msg);
          console.error("[UploadPanel] Upload failed:", msg);
          return;
        }

        const uploaded: UploadedFile = await res.json();
        addUpload(uploaded);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadError(msg);
        console.error("[UploadPanel] Upload error:", err);
      } finally {
        setUploadingFile(false);
      }
    },
    [addUpload, setUploadingFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CloudArrowUp size={14} weight="bold" style={{ color: hex }} />
        <span
          className="text-[10px] uppercase tracking-[0.2em] font-mono"
          style={{ color: `${hex}90` }}
        >
          Uploads
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded cursor-pointer transition-all py-6 px-4"
        style={{
          border: `1px dashed ${dragOver ? hex : `${hex}30`}`,
          background: dragOver ? `${hex}08` : "transparent",
        }}
      >
        {uploadingFile ? (
          <>
            <Spinner
              size={20}
              className="animate-spin"
              style={{ color: hex }}
            />
            <span
              className="text-[9px] uppercase tracking-[0.15em] font-mono"
              style={{ color: `${hex}60` }}
            >
              Analyzing...
            </span>
          </>
        ) : (
          <>
            <CloudArrowUp size={20} style={{ color: `${hex}40` }} />
            <span
              className="text-[9px] uppercase tracking-[0.15em] font-mono text-center"
              style={{ color: `${hex}40` }}
            >
              Drop image or PDF
              <br />
              or click to browse
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Error display */}
      {uploadError && (
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono"
          style={{ color: "#ff4444", border: "1px solid #ff444430", background: "#ff444410" }}
        >
          <span className="flex-1">{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="text-[9px] opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <UploadItem
              key={upload.id}
              upload={upload}
              hex={hex}
              onRemove={() => removeUpload(upload.id)}
            />
          ))}
        </div>
      )}

      {uploads.length === 0 && !uploadingFile && (
        <div
          className="text-center py-4 text-[9px] font-mono"
          style={{ color: `${hex}25` }}
        >
          No uploads yet
        </div>
      )}
    </div>
  );
};

// Individual upload item
const UploadItem: React.FC<{
  upload: UploadedFile;
  hex: string;
  onRemove: () => void;
}> = ({ upload, hex, onRemove }) => {
  const badge = upload.contentType
    ? CONTENT_TYPE_LABELS[upload.contentType] || upload.contentType.slice(0, 4).toUpperCase()
    : "???";

  return (
    <div
      className="rounded p-2 group"
      style={{ border: `1px solid ${hex}15`, background: `${hex}05` }}
    >
      <div className="flex items-start gap-2">
        {/* Thumbnail / icon */}
        <div
          className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: `${hex}10` }}
        >
          {upload.fileType === "image" ? (
            <img
              src={upload.blobUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <FilePdf size={16} style={{ color: `${hex}50` }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className="text-[9px] font-mono truncate"
            style={{ color: `${hex}80` }}
          >
            {upload.filename}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="text-[7px] px-1 rounded font-mono uppercase"
              style={{
                color: "#000",
                background: hex,
              }}
            >
              {badge}
            </span>
            {upload.processed && (
              <span
                className="text-[7px] px-1 rounded font-mono uppercase"
                style={{
                  color: hex,
                  border: `1px solid ${hex}30`,
                }}
              >
                {upload.processed.pipeline}
              </span>
            )}
          </div>
          {upload.analysis && (
            <div
              className="text-[8px] font-mono mt-1 line-clamp-2"
              style={{ color: `${hex}40` }}
            >
              {upload.analysis}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onRemove}
            className="p-0.5 rounded hover:bg-red-900/30"
            title="Remove"
          >
            <Trash size={10} style={{ color: "#ff4444" }} />
          </button>
        </div>
      </div>

      {/* Keywords */}
      {upload.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {upload.keywords.slice(0, 5).map((kw, i) => (
            <span
              key={i}
              className="text-[7px] px-1 rounded font-mono"
              style={{ color: `${hex}50`, border: `1px solid ${hex}15` }}
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
