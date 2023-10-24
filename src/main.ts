import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { DemoClient } from './client/client';

export const PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
}

void bootstrap()
  .catch((e) => {
    console.error('Sample api bootstrap error: %o', e);
  })
  .finally(async () => {
    console.log('Sample api bootstrap finish.');
    const client = await DemoClient.connect();
    client.subscribe((d) => console.log(d));

    setTimeout(() => {
      console.log('client unsubscribe data');
      client.unsubscribe();
    }, 30000);
  });
