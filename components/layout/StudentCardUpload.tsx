"use client";

import { ImagePlus, CheckCircle2, X, AlertCircle, FileImage, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

interface StudentCardUploadProps {
  file: File | null;
  error?: string;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}

export function StudentCardUpload({ file, error, onFileChange, onRemove }: StudentCardUploadProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="student_card" className="text-sm font-semibold text-foreground ml-1 flex items-center gap-2">
        <Upload className="h-3.5 w-3.5 text-[#0a66c2]" />
        Identity Verification
      </Label>

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-100 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800/30 shadow-sm"
          >
            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileImage className="h-5 w-5 text-[#0a66c2]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                {file.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB · Ready for upload
              </p>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            htmlFor="student_card"
            className={`
              flex flex-col items-center justify-center gap-3 w-full py-8 px-4 rounded-xl
              border-2 border-dashed cursor-pointer transition-all duration-200 group
              ${error
                ? "border-red-300 bg-red-50/30"
                : "border-border/60 hover:border-[#0a66c2] hover:bg-blue-50/30"
              }
            `}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              error
                ? "bg-red-100 text-red-600"
                : "bg-muted group-hover:bg-white group-hover:shadow-md text-muted-foreground/60 group-hover:text-[#0a66c2]"
            }`}>
              <ImagePlus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className={`text-sm font-bold transition-all duration-200 ${
                error ? "text-red-600" : "text-foreground group-hover:text-[#0a66c2]"
              }`}>
                Upload student / alumni card
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Drag and drop or click to browse (Max 5MB)
              </p>
            </div>
            <input
              id="student_card"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileChange(f);
              }}
            />
          </motion.label>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-medium text-red-600 flex items-center gap-1.5 ml-1"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </motion.p>
      )}
    </div>
  );
}
