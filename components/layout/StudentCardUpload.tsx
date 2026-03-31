
import { ImagePlus, CheckCircle2, X, AlertCircle, FileImage } from "lucide-react";
import { Label } from "@/components/ui/label";

interface StudentCardUploadProps {
  file: File | null;
  error?: string;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}

export function StudentCardUpload({ file, error, onFileChange, onRemove }: StudentCardUploadProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="student_card" className="text-sm font-medium text-foreground">
        Student / Alumni Card
      </Label>

      {file ? (
        /* ── File selected state ── */
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
            <FileImage className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {file.name}
            </p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-150 flex-shrink-0"
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* ── Empty/dropzone state ── */
        <label
          htmlFor="student_card"
          className={`
            flex flex-col items-center justify-center gap-2 w-full py-6 px-4 rounded-xl
            border-2 border-dashed cursor-pointer transition-all duration-150 group
            ${error
              ? "border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/10"
              : "border-border/60 hover:border-blue-400/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/10"
            }
          `}
        >
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-150 ${
            error
              ? "bg-rose-100 dark:bg-rose-900/30 text-rose-500"
              : "bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-950/40 text-muted-foreground/50 group-hover:text-blue-500"
          }`}>
            <ImagePlus className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className={`text-sm font-medium transition-colors duration-150 ${
              error ? "text-rose-600 dark:text-rose-400" : "text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400"
            }`}>
              Upload your student / alumni card
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG or PNG · max 5MB</p>
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
        </label>
      )}

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
