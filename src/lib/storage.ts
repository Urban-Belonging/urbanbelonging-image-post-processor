import * as aws from "aws-sdk";

const endpoint = new aws.Endpoint(process.env.SPACES_CDN_ENDPOINT as string);
const credentials = new aws.Credentials({
  accessKeyId: process.env.SPACES_CDN_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.SPACES_CDN_SECRET_ACCESS_KEY as string,
});
const s3 = new aws.S3({
  endpoint,
  credentials,
});

export const S3 = {
  downloadFile(bucket: string, key: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      s3.getObject(
        {
          Bucket: bucket,
          Key: key,
        },
        (err, data) => {
          if (err) return reject(err);
          if (!data.Body) return reject(new Error(`Could not download image with key "${key}"`));
          resolve(data.Body as Buffer);
        },
      );
    });
  },

  getFileMetadata(bucket: string, key: string): Promise<AWS.S3.HeadObjectOutput> {
    return new Promise((resolve, reject) => {
      s3.headObject(
        {
          Bucket: bucket,
          Key: key,
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        },
      );
    });
  },

  uploadFile(bucket: string, key: string, data: Buffer, contentType: string): Promise<AWS.S3.PutObjectOutput> {
    return new Promise((resolve, reject) => {
      s3.putObject(
        {
          Body: data,
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
          ACL: "public-read",
        },
        (err, response) => {
          if (err) return reject(err);
          resolve(response);
        },
      );
    });
  },
};
