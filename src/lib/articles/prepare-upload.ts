const MAX_REQUEST_BYTES = 3 * 1024 * 1024;

/** Resize a publication copy in the browser; the selected original is unchanged. */
export async function prepareArticleUpload(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片');
  if (file.size > 20 * 1024 * 1024) throw new Error('原图超过 20 MB，请先缩小图片后重试');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('无法读取图片，请选择完整的 JPG、PNG 或 WebP 文件'); }
  try {
    if (file.size <= MAX_REQUEST_BYTES && Math.max(bitmap.width, bitmap.height) <= 2000) return file;
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法优化图片，请先缩小图片后重试');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.84));
    if (!blob || blob.size > MAX_REQUEST_BYTES) throw new Error('图片优化后仍超过 3 MB，请缩小尺寸后重试');
    const extension = blob.type === 'image/webp' ? 'webp' : 'png';
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type });
  } finally { bitmap.close(); }
}
