import { WebSocket } from 'ws';

import { GatewayRequestPayload, GatewayResponsePayload } from '../../../model/app.service.model';

export class DemoClient {
  constructor(private readonly socket: WebSocket) {}

  static async connect(): Promise<DemoClient> {
    const socket = new WebSocket(`ws://localhost:3001/streaming`);

    await new Promise((r, j) => {
      const timeoutId = setTimeout(() => {
        j(new Error('ws connect timeout'));
      }, 30000);

      socket.on('open', () => {
        r('ok');
        clearTimeout(timeoutId);
      });

      socket.on('error', (err) => {
        j(err);
        clearTimeout(timeoutId);
      });
    });
    return new DemoClient(socket);
  }

  disconnect(): void {
    this.socket.close();
  }

  subscribe(listener: (...args: any[]) => any): void {
    this.socket.send(
      JSON.stringify(<GatewayRequestPayload>{
        eventName: 'ohlc',
        action: 'subscribe',
      }),
    );

    this.socket.on('message', (row) => {
      const payload: GatewayResponsePayload = JSON.parse(row.toString());
      if (payload.eventName !== 'ohlc') return;
      listener(payload.data);
    });
  }

  unsubscribe(): void {
    this.socket.send(
      JSON.stringify(<GatewayRequestPayload>{
        eventName: 'ohlc',
        action: 'unsubscribe',
      }),
    );
  }
}
