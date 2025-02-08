import { io, Socket } from 'socket.io-client';

class SocketClient {
  private static instance: Socket | null = null;
  private static isConnecting = false;
  private static connectionPromise: Promise<Socket> | null = null;

  static async connect(): Promise<Socket> {
    if (this.instance?.connected) {
      return this.instance;
    }

    if (this.isConnecting) {
      return this.connectionPromise!;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      const socket = io('http://localhost:3002', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        this.instance = socket;
        this.isConnecting = false;
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (!this.instance) {
          this.isConnecting = false;
          reject(error);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    return this.connectionPromise;
  }

  static disconnect() {
    if (this.instance?.connected) {
      this.instance.disconnect();
      this.instance = null;
    }
    this.isConnecting = false;
    this.connectionPromise = null;
  }
}

export default SocketClient; 