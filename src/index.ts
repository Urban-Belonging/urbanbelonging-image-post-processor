import "source-map-support/register";
import * as mime from "mime-types";
import { resizeImage } from "./lib/resize";
import { S3 } from "./lib/storage";
import { Photo, Thumbnail } from "./types";
import { PhotoUploadBroker } from "./lib/amqp";
import { BUCKET_URL, constructAssetUrl, getKeyFromAssetUrl } from "./lib/cdn";

const UPLOAD_BUCKET = process.env.SPACES_CDN_BUCKET_NAME as string;
const RESIZE_WIDTHS = [200, 400, 800, 1024];

export type ResizeWidth = typeof RESIZE_WIDTHS[number];

export async function resizePhoto(photo: Photo) {
  const key = getKeyFromAssetUrl(photo.imageUrl);
  if (!key) throw new Error(`Invalid key: ${key}`);

  const image = await S3.downloadFile(UPLOAD_BUCKET, key);

  const metadata = await S3.getFileMetadata(UPLOAD_BUCKET, key);
  if (!metadata.ContentType) throw new Error(`Unable to assert ContentType for image with key ${key}`);

  const toReturn: Thumbnail[] = [];

  for (const width of RESIZE_WIDTHS) {
    const resizedImage = await resizeImage(image, width);
    const resizedKey = `${photo.id}-${width}.${mime.extension(metadata.ContentType)}`;
    const uploadUrl = constructAssetUrl(resizedKey);

    await S3.uploadFile(UPLOAD_BUCKET, resizedKey, resizedImage, metadata.ContentType);

    toReturn.push({
      size: width,
      url: uploadUrl,
    });
  }

  return toReturn;
}

async function start() {
  const messageBroker = new PhotoUploadBroker();

  await messageBroker.init();

  console.log("Listening for messages from PhotoUploadBroker");
  console.log(`Config: UPLOAD_BUCKET ${UPLOAD_BUCKET} BUCKET_URL: ${BUCKET_URL}`);

  messageBroker.subscribeToUploadedPhotos(async (photo) => {
    try {
      console.log(`[${photo.id} - ${photo.imageUrl}] Starting resize job`);
      const thumbnails = await resizePhoto(photo);
      console.log(`[${photo.id} - ${photo.imageUrl}] Successfully resized in ${RESIZE_WIDTHS.join(",")}`);
      await messageBroker.sendResizedPhoto({
        id: photo.id,
        thumbnails,
      });
    } catch (err) {
      console.error(`[${photo.id} - ${photo.imageUrl}] Error`, err);
      throw err;
    }
  });
}

start();
