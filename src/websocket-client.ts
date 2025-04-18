import * as vscode from "vscode";
import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

export interface Position {
  column: number;
  line: number;
}

export interface Finding {
  start: Position;
  end: Position;
  value: string;
}

export interface AnalysisResult {
  filePath: string;
  results: Record<string, Finding[]>;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageCallbacks: Map<string, (result: AnalysisResult) => void> =
    new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectDelay = 5000; // 5 seconds
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  updateServerUrl(newServerUrl: string): void {
    this.serverUrl = newServerUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.on("open", () => {
          console.log("Connected to jxscout WebSocket server");
          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        });

        this.ws.on("close", () => {
          console.log("WebSocket connection closed");
          this.scheduleReconnect();
        });

        this.ws.on("error", (error: Error) => {
          console.error("WebSocket error:", error);
          reject(error);
        });
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log("Attempting to reconnect...");
      this.connect().catch((error: Error) => {
        console.error("Reconnection failed:", error);
        this.scheduleReconnect();
      });
    }, this.reconnectDelay);
  }

  private handleMessage(message: any) {
    const { type, id, payload } = message;

    switch (type) {
      case "analysis":
        const callback = this.messageCallbacks.get(id);
        if (callback) {
          callback(payload);
          this.messageCallbacks.delete(id);
        }
        break;
      case "error":
        console.error("Server error:", payload.message);
        if (payload.message.includes("asset not found")) {
          return; // ignore asset not found errors
        }
        vscode.window.showErrorMessage(
          `jxscout analysis error: ${payload.message}`
        );
        break;
      default:
        console.warn("Unknown message type:", type);
    }
  }

  async getAnalysis(filePath: string): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket is not connected"));
        return;
      }

      const messageId = uuidv4();
      const message = {
        type: "getAnalysis",
        id: messageId,
        payload: {
          filePath: filePath,
        },
      };

      this.messageCallbacks.set(messageId, resolve);
      this.ws.send(JSON.stringify(message));
    });
  }

  async forceReanalysis(filePath: string): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket is not connected"));
        return;
      }

      const messageId = uuidv4();
      const message = {
        type: "forceReanalysis",
        id: messageId,
        payload: {
          filePath: filePath,
        },
      };

      this.messageCallbacks.set(messageId, resolve);
      this.ws.send(JSON.stringify(message));
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}
