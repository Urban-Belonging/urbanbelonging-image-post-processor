export interface Photo {
  id: string;
  imageUrl: string;
}

export interface Thumbnail {
  size: number;
  url: string;
}

export interface ResizedPhotoResponse {
  id: string;
  thumbnails: Thumbnail[];
}
