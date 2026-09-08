import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export async function prepareImage(input: Buffer) {
  if (!input.length || input.length > MAX_IMAGE_BYTES) throw new Error('图片不能超过 3 MB');
  const source = sharp(input, { limitInputPixels: 20_000_000, failOn: 'warning', animated: false });
  const metadata = await source.metadata();
  if (!metadata.format || !['jpeg','png','webp'].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error('只支持静态 JPG、PNG、WebP 图片');
  const { data, info } = await source.rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
