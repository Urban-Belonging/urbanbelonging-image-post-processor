import * as amqp from "amqplib";
import type { Photo, ResizedPhotoResponse } from "../types";

const PHOTO_UPLOADED_QUEUE_NAME = "photo-uploaded";
const PHOTO_RESIZED_QUEUE_NAME = "photo-resized";

export class PhotoUploadBroker {
  private connection: amqp.Connection;
  private sendChannel: amqp.Channel;
  private subscriptionChannel: amqp.Channel;
  private handler: (photo: Photo) => Promise<void>;

  public async init() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
    this.connection.on("error", this.connectionErrorHandler);
    this.connection.on("close", this.connectionClosedHandler);
    this.connection.on("blocked", this.blockedConnectionHandler);
    this.connection.on("unblocked", this.unblockedConnectionHandler);
    this.subscriptionChannel = await this.connection.createChannel();
    this.sendChannel = await this.connection.createChannel();
  }

  public async sendResizedPhoto(message: ResizedPhotoResponse) {
    await this.assertQueue(this.sendChannel, PHOTO_RESIZED_QUEUE_NAME);
    this.sendChannel.sendToQueue(PHOTO_RESIZED_QUEUE_NAME, Buffer.from(JSON.stringify(message)));
  }

  public async subscribeToUploadedPhotos(handler: (photo: Photo) => Promise<void>) {
    await this.assertQueue(this.subscriptionChannel, PHOTO_UPLOADED_QUEUE_NAME);
    this.handler = handler;
    this.subscriptionChannel.consume(PHOTO_UPLOADED_QUEUE_NAME, async (message) => {
      let didAck = false;
      try {
        if (!message) throw new Error();

        const messagePayload = message.content.toString("utf8");
        const parsedMessage = JSON.parse(messagePayload) as Photo;

        // Acknowledge the message immediately, otherwise the API will be held up from completing the upload request until resizing is finished
        this.subscriptionChannel.ack(message);

        await this.handler(parsedMessage);
        didAck = true;
      } catch (err) {
        console.error(`[ImageUploadBroker] Error processing message`, err);
      } finally {
        if (!didAck && message) this.subscriptionChannel.ack(message);
      }
    });
  }

  private async assertQueue(channel: amqp.Channel, queue: string) {
    this.assertConnection();
    await channel.assertQueue(queue, { durable: true });
  }

  private assertConnection() {
    if (!this.connection) throw new Error("No active connection");
  }

  private connectionErrorHandler(error: any) {
    console.log(`[ImageUploadBroker] A connection error occurred`, error);
  }

  private blockedConnectionHandler(reason: any) {
    console.log(`[ImageUploadBroker] Connection blocked, reason:`, reason);
  }

  private unblockedConnectionHandler() {
    console.log(`[ImageUploadBroker] Connection unblocked`);
  }

  private connectionClosedHandler() {
    console.log(`[ImageUploadBroker] Connection closed`);
  }
}
