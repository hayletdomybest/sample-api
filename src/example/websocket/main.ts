import { DemoClient } from './client/client';

console.log('client connect');

async function main(): Promise<void> {
  const client = await DemoClient.connect();
  client.subscribe((d) => console.log(d));

  setTimeout(() => {
    console.log('client unsubscribe data');
    client.unsubscribe();
  }, 5000);

  setTimeout(() => {
    console.log('client disconnect');
    client.disconnect();
  }, 10000);
}

void main().finally(() => {});
