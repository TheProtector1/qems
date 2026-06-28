const IMAGE_MAX_BYTES = 900_000;
const PDF_MAX_BYTES = 2 * 1024 * 1024;
const DOC_IMAGE_MAX_DIMENSION = 1600;

export type ProcessedDocument = {
  fileData: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export async function processDocumentFile(file: File): Promise<ProcessedDocument> {
  if (file.type === "application/pdf") {
    return processPdf(file);
  }
  if (file.type.startsWith("image/")) {
    return processDocumentImage(file);
  }
  throw new Error("Only JPG, PNG, WebP, or PDF files are supported.");
}

async function processPdf(file: File): Promise<ProcessedDocument> {
  if (file.size > PDF_MAX_BYTES) {
    throw new Error("PDF must be smaller than 2 MB.");
  }
  const fileData = await readFileAsDataUrl(file);
  return {
    fileData,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  };
}

async function processDocumentImage(file: File): Promise<ProcessedDocument> {
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be smaller than 8 MB.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, DOC_IMAGE_MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");

  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.82;
  let output = canvas.toDataURL("image/jpeg", quality);

  while (output.length > IMAGE_MAX_BYTES && quality > 0.45) {
    quality -= 0.06;
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (output.length > IMAGE_MAX_BYTES) {
    throw new Error("Image is too large after compression. Try a smaller file or PDF.");
  }

  const base64Length = output.length - (output.indexOf(",") + 1);
  const fileSize = Math.round((base64Length * 3) / 4);

  return {
    fileData: output,
    fileName: file.name.replace(/\.\w+$/, ".jpg"),
    mimeType: "image/jpeg",
    fileSize,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = src;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}
