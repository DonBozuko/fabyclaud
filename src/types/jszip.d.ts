declare module "jszip" {
  interface JSZipObject {
    name: string;
    dir: boolean;
    date: Date;
    comment: string;
    unixPermissions: number | null;
    dosPermissions: number | null;
    options: Record<string, unknown>;
    async(type: "string"): Promise<string>;
    async(type: "text"): Promise<string>;
    async(type: "base64"): Promise<string>;
    async(type: "uint8array"): Promise<Uint8Array>;
    async(type: "arraybuffer"): Promise<ArrayBuffer>;
    async(type: "blob"): Promise<Blob>;
    async(type: string): Promise<any>;
  }

  interface JSZipFileOptions {
    base64?: boolean;
    binary?: boolean;
    date?: Date;
    compression?: string;
    comment?: string;
    optimizedBinaryString?: boolean;
    createFolders?: boolean;
    unixPermissions?: number | string;
    dosPermissions?: number;
    dir?: boolean;
  }

  interface JSZipGeneratorOptions {
    type?:
      | "base64"
      | "string"
      | "text"
      | "binarystring"
      | "array"
      | "uint8array"
      | "arraybuffer"
      | "blob"
      | "nodebuffer";
    compression?: "STORE" | "DEFLATE";
    compressionOptions?: {
      level?: number;
    };
    comment?: string;
    mimeType?: string;
  }

  export default class JSZip {
    constructor();
    files: { [key: string]: JSZipObject };
    file(name: string): JSZipObject | null;
    file(
      name: string,
      data:
        string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream | Promise<any>,
      options?: JSZipFileOptions,
    ): this;
    file(regex: RegExp): JSZipObject[];
    folder(name: string): JSZip | null;
    folder(regex: RegExp): JSZipObject[];
    forEach(callback: (relativePath: string, file: JSZipObject) => void): void;
    filter(predicate: (relativePath: string, file: JSZipObject) => boolean): JSZipObject[];
    remove(name: string): this;
    generateAsync(options?: JSZipGeneratorOptions): Promise<any>;
    loadAsync(data: any, options?: any): Promise<JSZip>;
    static loadAsync(data: any, options?: any): Promise<JSZip>;
  }
}
