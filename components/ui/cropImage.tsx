// components/ui/cropImage.ts
export const getCroppedImg = (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    mime: 'image/png' | 'image/jpeg' = 'image/jpeg',
    quality = 0.92
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        // dacă folosești URL extern (nu data:uri), serverul trebuie să permită CORS
        image.crossOrigin = 'anonymous';
        image.src = imageSrc;

        image.onload = () => {
            // Canvas pătrat/rect exact cât crop-ul (aspect 1 => pătrat)
            const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(pixelCrop.width * dpr));
            canvas.height = Math.max(1, Math.round(pixelCrop.height * dpr));

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not found'));
                return;
            }

            // scale pentru claritate pe ecrane retina
            ctx.scale(dpr, dpr);

            // ✨ NU mai folosim mască circulară — desenăm exact dreptunghiul croppat
            // sx, sy, sWidth, sHeight din sursă -> dx, dy, dWidth, dHeight pe canvas
            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            // Exportă ca dataURL (poți schimba în 'image/png' dacă vrei transparent)
            const dataUrl = canvas.toDataURL(mime, quality);
            resolve(dataUrl);
        };

        image.onerror = () => reject(new Error('Failed to load image'));
    });
};
