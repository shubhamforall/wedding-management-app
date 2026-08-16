import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker fallback
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface OcrProgressUpdate {
  status: string;
  progress: number; // 0 to 1
  message: string;
}

export type OcrProgressCallback = (update: OcrProgressUpdate) => void;

/**
 * Extract text from an image file using Tesseract.js in the browser.
 */
export async function extractTextFromImage(
  fileOrUrl: File | Blob | string,
  onProgress?: OcrProgressCallback
): Promise<string> {
  onProgress?.({
    status: 'initializing',
    progress: 0.1,
    message: 'Initializing OCR Engine...',
  });

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.({
          status: 'recognizing',
          progress: 0.2 + (m.progress || 0) * 0.7,
          message: `Scanning receipt text (${Math.round((m.progress || 0) * 100)}%)...`,
        });
      }
    },
  });

  try {
    onProgress?.({
      status: 'recognizing',
      progress: 0.3,
      message: 'Analyzing bill details...',
    });

    const ret = await worker.recognize(fileOrUrl);
    
    onProgress?.({
      status: 'complete',
      progress: 1,
      message: 'Text extraction complete!',
    });

    return ret.data.text || '';
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract text from a PDF file. If the PDF contains native digital text, extracts it directly.
 * If the PDF is scanned/rasterized, renders pages onto canvas and runs OCR.
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: OcrProgressCallback
): Promise<string> {
  onProgress?.({
    status: 'loading_pdf',
    progress: 0.1,
    message: 'Reading PDF document...',
  });

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  const numPages = Math.min(pdf.numPages, 5); // Scan up to 5 pages

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.({
      status: 'reading_page',
      progress: 0.1 + (pageNum / numPages) * 0.4,
      message: `Reading page ${pageNum} of ${numPages}...`,
    });

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');

    if (pageText.trim().length > 30) {
      fullText += pageText + '\n';
    } else {
      // Scanned page without selectable text: Render page to canvas and OCR
      onProgress?.({
        status: 'ocr_page',
        progress: 0.5 + (pageNum / numPages) * 0.4,
        message: `Running OCR on scanned page ${pageNum}...`,
      });

      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const pageDataUrl = canvas.toDataURL('image/png');
        const ocrText = await extractTextFromImage(pageDataUrl);
        fullText += ocrText + '\n';
      }
    }
  }

  onProgress?.({
    status: 'complete',
    progress: 1,
    message: 'PDF processing complete!',
  });

  return fullText;
}

/**
 * Universal document text extractor supporting Images (JPG/PNG/WEBP/HEIC), PDFs, and Text files.
 */
export async function extractTextFromDocument(
  file: File,
  onProgress?: OcrProgressCallback
): Promise<string> {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return extractTextFromPdf(file, onProgress);
  }

  if (
    type.startsWith('image/') ||
    /\.(jpe?g|png|webp|gif|bmp|heic|heif|svg)$/i.test(name)
  ) {
    return extractTextFromImage(file, onProgress);
  }

  // Plain text / CSV / JSON
  if (type.includes('text') || /\.(txt|csv|tsv|md|json)$/i.test(name)) {
    onProgress?.({
      status: 'reading_text',
      progress: 0.5,
      message: 'Reading text document...',
    });
    const text = await file.text();
    onProgress?.({
      status: 'complete',
      progress: 1,
      message: 'Text file read complete!',
    });
    return text;
  }

  // Fallback try image OCR
  return extractTextFromImage(file, onProgress);
}
