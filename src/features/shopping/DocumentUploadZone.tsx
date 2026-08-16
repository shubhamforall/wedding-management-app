import { useState, useRef, useId } from 'react';
import { UploadCloud, Sparkles, FileText, CheckCircle2, RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractTextFromDocument, type OcrProgressUpdate } from './utils/ocrExtractor';
import { parseShoppingDocumentText, type ExtractedShoppingData } from './utils/shoppingParser';

interface DocumentUploadZoneProps {
  availableCategories?: string[];
  availableFamilyMembers?: string[];
  onDataExtracted: (data: ExtractedShoppingData) => void;
  onItemSelect?: (item: { item: string; actual_cost: number; category: string; notes?: string }) => void;
}

export function DocumentUploadZone({
  availableCategories = [],
  availableFamilyMembers = [],
  onDataExtracted,
  onItemSelect,
}: DocumentUploadZoneProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OcrProgressUpdate | null>(null);
  const [scannedFile, setScannedFile] = useState<{ name: string; type: string; previewUrl?: string } | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedShoppingData | null>(null);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number | null>(null);

  const handleFileProcess = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress({ status: 'starting', progress: 0.05, message: 'Loading file...' });

      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      setScannedFile({
        name: file.name,
        type: file.type || file.name.split('.').pop() || 'document',
        previewUrl,
      });

      // Extract text via OCR or PDF parser
      const extractedText = await extractTextFromDocument(file, (update) => {
        setProgress(update);
      });

      if (!extractedText || extractedText.trim().length === 0) {
        toast.error('No readable text found in this document. You can enter details manually.');
        setIsProcessing(false);
        setProgress(null);
        return;
      }

      // Parse text into shopping data
      const parsedData = parseShoppingDocumentText(extractedText, {
        availableCategories,
        availableFamilyMembers,
      });

      setExtractedResult(parsedData);
      onDataExtracted(parsedData);
      setSelectedItemIdx(null);

      toast.success(
        parsedData.detectedItems.length > 1
          ? `Receipt scanned! Detected ${parsedData.detectedItems.length} items.`
          : 'Receipt scanned & form auto-filled!'
      );
    } catch (err) {
      console.error('OCR processing error:', err);
      toast.error(err instanceof Error ? err.message : 'Could not scan document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
    // Reset file input value so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearScan = () => {
    if (scannedFile?.previewUrl) {
      URL.revokeObjectURL(scannedFile.previewUrl);
    }
    setScannedFile(null);
    setExtractedResult(null);
    setProgress(null);
    setSelectedItemIdx(null);
  };

  return (
    <div className="mb-4 overflow-hidden rounded-[var(--radius-md)] border border-primary/20 bg-primary/5 p-3.5 transition-all">
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*,application/pdf,text/plain,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* State 1: Active Scan Result */}
      {extractedResult && scannedFile && !isProcessing ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-primary/30 bg-primary/10 text-primary">
                {scannedFile.previewUrl ? (
                  <img
                    src={scannedFile.previewUrl}
                    alt="Receipt preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="truncate text-xs font-semibold text-text">
                    Auto-filled from {scannedFile.name}
                  </p>
                </div>
                <p className="text-[11px] text-text-muted">
                  {extractedResult.metadata.vendor ? `${extractedResult.metadata.vendor} • ` : ''}
                  {extractedResult.metadata.totalAmount
                    ? `₹${extractedResult.metadata.totalAmount.toLocaleString('en-IN')}`
                    : 'Details extracted'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                title="Scan another bill"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Rescan</span>
              </button>
              <button
                type="button"
                onClick={clearScan}
                className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-bg-subtle hover:text-text"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* If multiple items were found in the bill */}
          {extractedResult.detectedItems.length > 1 && (
            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-bg-raised p-2.5">
              <p className="mb-1.5 text-[11px] font-medium text-text-muted">
                Multiple items detected on receipt ({extractedResult.detectedItems.length}). Click an item to fill:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {extractedResult.detectedItems.map((item, idx) => {
                  const isSelected = selectedItemIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedItemIdx(idx);
                        onItemSelect?.(item);
                        toast.success(`Selected "${item.item}"`);
                      }}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-fg'
                          : 'border-border bg-bg text-text hover:border-primary/50'
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{item.item}</span>
                      <span className="font-semibold opacity-90">
                        ₹{item.actual_cost.toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : isProcessing ? (
        /* State 2: Processing / OCR in Progress */
        <div className="py-3 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-text">
            {progress?.message || 'Scanning receipt & document...'}
          </p>
          <div className="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-border-subtle">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${Math.max(10, Math.round((progress?.progress || 0.1) * 100))}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            Extracting item name, prices, category, & store info
          </p>
        </div>
      ) : (
        /* State 3: Default Ready Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-sm)] border-2 border-dashed p-3 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-primary/30 hover:border-primary hover:bg-primary/10'
          }`}
        >
          <div className="flex items-center gap-2 text-primary">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 group-hover:scale-110 transition-transform">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold">
              Auto-Fill from Receipt, Bill, or Document
            </span>
          </div>

          <p className="mt-1 text-[11px] text-text-muted">
            Drag & drop or <span className="font-medium text-primary underline">browse file</span> (Bill image, PDF invoice, quotation)
          </p>

          <div className="mt-2 flex items-center gap-3 text-[10px] text-text-faint">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> JPG, PNG, WEBP
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> PDF, TXT
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <UploadCloud className="h-3 w-3" /> Camera / Photos
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
