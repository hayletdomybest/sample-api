import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { RedisModule } from '@liaoliaots/nestjs-redis';
import { RedisModuleOptions } from '@liaoliaots/nestjs-redis/dist/redis/interfaces/redis-module-options.interface';

import { AppController } from './controller/app.controller';
import { GetDataGuard } from './middleware/get-data.guard';
import { AppService } from './service/app.service';
import { LimitRateService } from './service/limit-rate.service';
import { AppWsGateway } from './websocket/app.ws-gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: './env/.env',
    }),
    RedisModule.forRootAsync(
      {
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const prefix = configService.get('REDIS_PREFIX');
          const host = configService.get('REDIS_HOST');
          const port = Number(configService.get('REDIS_PORT'));
          return <RedisModuleOptions>{
            config: {
              keyPrefix: prefix,
              host: host,
              port: port,
            },
          };
        },
        inject: [ConfigService],
      },
      true,
    ),
  ],
  controllers: [AppController],
  providers: [AppService, GetDataGuard, AppWsGateway, LimitRateService],
  exports: [AppWsGateway],
})
export class AppModule {}
