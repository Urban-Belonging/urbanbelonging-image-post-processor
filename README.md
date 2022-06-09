# urbanbelonging-image-post-processor

Microservice that post processes images uploaded by the [urbanbelonging-api](https://github.com/iKettles/urbanbelonging-api) via a RabbitMQ message broker. This service handles the resizing of thumbnails, uploads them to an S3 compatible storage, then sends a message on the broker with the uploaded URLs.

# Configuration

Most of the configuration can be done via environment variables. You can configure thumbnail sizes in [index.ts](https://github.com/iKettles/urbanbelonging-image-post-processor/blob/main/src/index.ts#L10). If you're not using DigitalOcean Spaces, you may need to make a few adjustments to how the AWS S3 client library is invoked.

| Name                         | Description                                                                                                 |
|------------------------------|-------------------------------------------------------------------------------------------------------------|
| RABBITMQ_URL                 | The AMQP URL of the RabbitMQ instance                                                                       |
| SPACES_CDN_ENDPOINT          | The endpoint of the S3 compatible service, passed directly to the S3 client library                         |
| SPACES_CDN_ACCESS_KEY_ID     | The access key ID of the S3 compatible storage used for photos                                              |
| SPACES_CDN_SECRET_ACCESS_KEY | The secret access key of the S3 compatible storage used for photos                                          |
| SPACES_CDN_URL               | The URL of the CDN that serves images to the internet (usually an HTTPS bucket URL/CloudFront distribution) |
| SPACES_CDN_BUCKET_NAME       | The name of the S3 compatible bucket used for uploading photos                                              |                          |
