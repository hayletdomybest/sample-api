import { io, Socket } from 'socket.io-client';

import { PORT } from '../main';

export class DemoClient {
  constructor(private readonly socket: Socket) {}

  static async connect(): Promise<DemoClient> {
    const socket = io(`http://localhost:${PORT}/streaming`);

    await new Promise((r, j) => {
      const id = setTimeout(() => {
        j(new Error('connect timeout'));
      }, 30000);

      socket.on('connect', () => {
        clearTimeout(id);
        r('ok');
      });
    });
    return new DemoClient(socket);
  }

  subscribe(listener: (...args: any[]) => any): void {
    this.socket.emit('ohlc', {
      action: 'subscribe',
    });
    this.socket.on('ohlc', listener);
  }

  unsubscribe(): void {
    this.socket.emit('ohlc', {
      action: 'unsubscribe',
    });
  }
}
