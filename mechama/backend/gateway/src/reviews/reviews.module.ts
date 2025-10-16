import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'REVIEWS_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('REVIEWS_SERVICE_HOST', 'localhost'),
            port: configService.get('REVIEWS_SERVICE_PORT', 3007),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}