declare module 'nfc-pcsc' {
    import { EventEmitter } from 'events';
    
    export class NFC extends EventEmitter {
      constructor();
      
      on(event: 'reader', listener: (reader: Reader | Error) => void): this;
      on(event: 'error', listener: (error: Error) => void): this;
      
      readers: Map<string, Reader>;
    }
    
    export class Reader extends EventEmitter {
      reader: {
        name: string;
        [key: string]: any;
      };
      
      on(event: 'card', listener: (card: Card) => void): this;
      on(event: 'card.off', listener: (card: Card) => void): this;
      on(event: 'error', listener: (error: Error) => void): this;
      on(event: 'end', listener: () => void): this;
      
      connect(mode?: number): Promise<void>;
      disconnect(): Promise<void>;
      read(blockNumber: number, length: number, blockSize?: number, packetSize?: number): Promise<Buffer>;
      write(blockNumber: number, data: Buffer | string, blockSize?: number, packetSize?: number): Promise<void>;
    }
    
    export interface Card {
      atr: Buffer;
      uid: string;
      standard: string;
      type: string;
      [key: string]: any;
    }
  }