/**
 * WebSocket client for Tobii server communication
 */

import type { ConnectionConfig, WebSocketMessage, ConnectionStatus } from './types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<ConnectionConfig>;
  private status: ConnectionStatus;
  private messageHandlers: Map<string, (data: any) => void>;
  private reconnectTimeout: number | null = null;
  private currentReconnectAttempt: number = 0;

  constructor(config: ConnectionConfig = {}) {
    this.config = {
      url: config.url || 'ws://localhost:8080',
      autoConnect: config.autoConnect ?? true,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
    };

    this.status = {
      connected: false,
      tracking: false,
    };

    this.messageHandlers = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.status.connected = true;
          this.status.connectedAt = Date.now();
          this.currentReconnectAttempt = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          this.status.lastError = 'WebSocket error';
          console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
          this.status.connected = false;
          this.status.tracking = false;
          this.handleDisconnect();
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.status.connected = false;
    this.status.tracking = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Send message to server
   */
  async send(message: WebSocketMessage): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    this.ws!.send(JSON.stringify(message));
  }

  /**
   * Send message and wait for response
   */
  async sendAndWait(message: WebSocketMessage, timeout: number = 5000): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      // Generate unique ID for this request
      const requestId = `req_${Date.now()}_${Math.random()}`;
      const messageWithId = { ...message, requestId };

      // Set up response handler
      const timeoutId = setTimeout(() => {
        this.messageHandlers.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout);

      this.messageHandlers.set(requestId, (data) => {
        clearTimeout(timeoutId);
        this.messageHandlers.delete(requestId);
        resolve(data);
      });

      // Send message
      this.ws!.send(JSON.stringify(messageWithId));
    });
  }

  /**
   * Register message handler
   */
  on(messageType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Unregister message handler
   */
  off(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Check for request ID (response to sendAndWait)
      if (data.requestId && this.messageHandlers.has(data.requestId)) {
        const handler = this.messageHandlers.get(data.requestId);
        handler!(data);
        return;
      }

      // Handle by message type
      if (data.type && this.messageHandlers.has(data.type)) {
        const handler = this.messageHandlers.get(data.type);
        handler!(data);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handle disconnection and attempt reconnect
   */
  private handleDisconnect(): void {
    if (this.currentReconnectAttempt < this.config.reconnectAttempts) {
      this.currentReconnectAttempt++;
      const delay = this.config.reconnectDelay * this.currentReconnectAttempt;

      console.log(
        `Attempting to reconnect (${this.currentReconnectAttempt}/${this.config.reconnectAttempts}) in ${delay}ms`
      );

      this.reconnectTimeout = window.setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.status.lastError = 'Max reconnection attempts reached';
    }
  }
}
