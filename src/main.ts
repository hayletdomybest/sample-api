import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

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
  });
