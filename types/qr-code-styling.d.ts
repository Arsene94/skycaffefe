declare module 'qr-code-styling' {
    export default class QRCodeStyling {
        constructor(options?: any);
        append(element: HTMLElement): void;
        update(options?: any): void;
        download(options?: { name?: string; extension?: 'png' | 'jpg' | 'svg' }): void;
        getRawData(extension?: 'png' | 'jpg' | 'svg'): Promise<Blob>;
    }
}
