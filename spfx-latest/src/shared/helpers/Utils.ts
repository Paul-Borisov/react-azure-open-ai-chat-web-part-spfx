export class Utils {
  /*public static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }*/

  public static async compressImageToDataURL(imageUrl: string): Promise<string> {
    const imagePromise = new Promise<string>((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();
      image.onload = () => {
        try {
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } catch (e) {
          resolve(imageUrl);
          throw e;
        }
      };
      image.src = imageUrl;
    });
    return imagePromise;
  }

  /*public static compressImage(image: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const newImage = new Image();
    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.drawImage(image, 0, 0);
      image.src = canvas.toDataURL('image/jpeg');
    };
    newImage.src = image.src;
  }*/
}
