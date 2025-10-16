import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  async uploadFile(file: Express.Multer.File) {
    // Implementar upload para AWS S3
    // Por enquanto, retornar URL mock
    return {
      url: `https://mechama-uploads.s3.amazonaws.com/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}