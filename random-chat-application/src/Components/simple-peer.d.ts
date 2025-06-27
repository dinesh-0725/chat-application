declare module 'simple-peer' {
    interface Options {
      initiator?: boolean;
      trickle?: boolean;
      stream?: MediaStream;
    }
    export default class Peer {
      constructor(opts?: Options);
      on(event: string, listener: (...args: any[]) => void): this;
      signal(data: any): void;
      destroy(): void;
    }
  }
  