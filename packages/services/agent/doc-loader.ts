import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { createWorker, type Worker } from "tesseract.js";
import * as XLSX from "xlsx";
import { convert } from "html-to-text";
import fs from "fs";
import path from "path";

const MIN_CHARS_PER_PAGE = 30;
const MIN_TOTAL_CHARS = 100;

// Tesseract language(s), e.g. "eng" or "eng+hin" (downloaded on first use)
const OCR_LANGS = process.env.OCR_LANGS ?? "eng";
// Higher scale = sharper page image = better OCR, but slower and more memory
const PDF_RENDER_SCALE = 2;

// Tesseract.js supports PNG, JPG, BMP, PBM and WebP (not GIF or TIFF)
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);

// ---------- Tesseract worker (lazy singleton) ----------

let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker(OCR_LANGS);
  }
  return workerPromise;
}

/** Call this when your app is done, or the Node process may not exit. */
export async function terminateOcr(): Promise<void> {
  if (!workerPromise) return;
  const worker = await workerPromise;
  workerPromise = null;
  await worker.terminate();
}

// ---------- OCR helpers ----------

function hasTooLittleText(docs: Document[]): boolean {
  if (docs.length === 0) return true;
  const total = docs.reduce((n, d) => n + d.pageContent.trim().length, 0);
  return total < MIN_TOTAL_CHARS || total / docs.length < MIN_CHARS_PER_PAGE;
}

async function recognize(
  image: Buffer | string,
): Promise<{ text: string; confidence: number }> {
  const worker = await getWorker();
  const { data } = await worker.recognize(image);
  return { text: data.text.trim(), confidence: data.confidence };
}

async function ocrImage(source: string): Promise<Document[]> {
  const { text, confidence } = await recognize(source);
  if (!text) return [];

  return [
    new Document({
      pageContent: text,
      metadata: {
        source,
        ocr: true,
        ocrEngine: "tesseract.js",
        ocrConfidence: confidence,
      },
    }),
  ];
}

/** Render each PDF page to a PNG with mupdf, then OCR it. One Document per page. */
async function ocrPdf(source: string): Promise<Document[]> {
  const mupdf = await import("mupdf");
  const docs: Document[] = [];
  const pdfDoc = mupdf.Document.openDocument(
    fs.readFileSync(source),
    "application/pdf",
  );

  const pageCount = pdfDoc.countPages();

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.loadPage(i);
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(PDF_RENDER_SCALE, PDF_RENDER_SCALE),
      mupdf.ColorSpace.DeviceRGB,
      false, // no alpha channel
      true, // render annotations / form fields
    );
    const png = Buffer.from(pixmap.asPNG());

    // free WASM memory before the (slow) OCR step
    pixmap.destroy();
    page.destroy();

    const { text, confidence } = await recognize(png);
    if (!text) continue;

    docs.push(
      new Document({
        pageContent: text,
        metadata: {
          source,
          page: i + 1,
          ocr: true,
          ocrEngine: "tesseract.js",
          ocrConfidence: confidence,
        },
      }),
    );
  }

  pdfDoc.destroy();
  return docs;
}

// ---------- Main loader ----------

async function loadAnyDocument(source: string): Promise<Document[]> {
  if (/^https?:\/\//.test(source)) {
    return new CheerioWebBaseLoader(source).load();
  }

  const ext = path.extname(source).toLowerCase();

  if (IMAGE_EXTS.has(ext)) {
    return ocrImage(source);
  }

  switch (ext) {
    case ".pdf": {
      let docs: Document[] = [];
      try {
        docs = await new PDFLoader(source).load();
      } catch (err) {
        console.warn(
          `PDF extraction failed for ${source}, falling back to OCR`,
          err,
        );
      }

      if (hasTooLittleText(docs)) {
        try {
          const ocrDocs = await ocrPdf(source);
          return ocrDocs.length > 0 ? ocrDocs : docs;
        } catch (err) {
          console.error(`OCR failed for ${source}`, err);
          return docs;
        }
      }
      return docs;
    }

    case ".csv":
      return new CSVLoader(source).load();

    case ".docx":
      return new DocxLoader(source).load();

    case ".txt":
    case ".md": {
      const text = fs.readFileSync(source, "utf-8");
      return [new Document({ pageContent: text, metadata: { source } })];
    }

    case ".xlsx":
    case ".xls": {
      const workbook = XLSX.readFile(source);
      return workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName]!;
        return new Document({
          pageContent: XLSX.utils.sheet_to_csv(sheet),
          metadata: { source, sheetName },
        });
      });
    }

    case ".html":
    case ".htm": {
      const raw = fs.readFileSync(source, "utf-8");
      const text = convert(raw, { wordwrap: false });
      return [new Document({ pageContent: text, metadata: { source } })];
    }

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

export default loadAnyDocument;
