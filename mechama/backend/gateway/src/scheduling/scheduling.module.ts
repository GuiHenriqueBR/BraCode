import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'SCHEDULING_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('SCHEDULING_SERVICE_HOST', 'localhost'),
            port: configService.get('SCHEDULING_SERVICE_PORT', 3006),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [SchedulingController],
  providers: [SchedulingService],
})
export class SchedulingModule {}