import * as sharp from "sharp";

export async function resizeImage(inputImage: Buffer, width: number): Promise<Buffer> {
  return (
    sharp(inputImage)
      // Calling rotate ensures the EXIF orientation is preserved
      .rotate()
      .resize(width, undefined, {
        fit: "contain",
      })
      .toBuffer()
  );
}

export async function getImageMetadata(inputImage: Buffer): Promise<sharp.Metadata> {
  return sharp(inputImage).metadata();
}
