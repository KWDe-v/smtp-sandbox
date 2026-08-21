import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

export class StorageService {
  private getStorageBaseDir(): string {
    const baseDir = path.resolve(env.STORAGE_PATH);
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return baseDir;
  }

  async saveAttachment(messageId: number, filename: string, content: Buffer): Promise<string> {
    const now = new Date();
    const year = now.getUTCFullYear().toString();
    const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');

    // Sanitiza nome do arquivo
    const safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const relativeDir = path.join(year, month, `msg_${messageId}`);
    const absoluteDir = path.join(this.getStorageBaseDir(), relativeDir);

    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}_${safeFilename}`;
    const absolutePath = path.join(absoluteDir, uniqueFilename);
    const relativePath = path.join(relativeDir, uniqueFilename);

    await fs.promises.writeFile(absolutePath, content);
    return relativePath.replace(/\\/g, '/');
  }

  async getAttachmentBuffer(relativePath: string): Promise<Buffer | null> {
    const absolutePath = path.join(this.getStorageBaseDir(), relativePath);
    if (!fs.existsSync(absolutePath)) {
      return null;
    }
    return fs.promises.readFile(absolutePath);
  }

  async deleteAttachment(relativePath: string): Promise<void> {
    const absolutePath = path.join(this.getStorageBaseDir(), relativePath);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath).catch(() => {});
    }
  }
}

export const storageService = new StorageService();
