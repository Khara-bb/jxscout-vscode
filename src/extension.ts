import * as vscode from "vscode";
import { WebSocketClient } from "./services/websocket-client";
import { createViews } from "./views";
import { registerCommands } from "./commands";
import { PremiumView } from "./views/premium-view";

export function activate(context: vscode.ExtensionContext) {
  // Initialize WebSocket client
  const config = vscode.workspace.getConfiguration("jxscout");
  const host = config.get<string>("serverHost") || "localhost";
  const port = config.get<number>("serverPort") || 3333;
  const wsClient = new WebSocketClient(`ws://${host}:${port}/ws`);

  const connectionStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  connectionStatusBarItem.text = "jxscout $(sync~spin)";
  connectionStatusBarItem.tooltip = "Connecting to jxscout server...";
  connectionStatusBarItem.show();

  // Connect to WebSocket server
  wsClient
    .connect()
    .then(() => {
      connectionStatusBarItem.text = "jxscout $(check)";
      connectionStatusBarItem.tooltip = "Connected to jxscout server";
    })
    .catch((error) => {
      connectionStatusBarItem.text = "jxscout $(error)";
      connectionStatusBarItem.tooltip = `Failed to connect: ${error.message}`;
      vscode.window.showErrorMessage(
        `Failed to connect to jxscout server: ${error.message}`
      );
    });

  // Create views and get providers
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const { astView, analysisTreeProvider } = createViews(
    context,
    workspaceRoot,
    wsClient
  );

  // Register commands
  registerCommands(
    context,
    analysisTreeProvider,
    null, // No longer need explorerTreeProvider
    astView,
    null // No longer need fileView
  );

  // Register premium views
  const premiumViewProvider = PremiumView.getInstance();
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("jxscoutPremiumView", {
      resolveWebviewView: (webviewView, context, token) => {
        premiumViewProvider.resolveWebviewView(webviewView, context, token);
      },
    }),
    vscode.window.registerWebviewViewProvider("jxscoutFileView", {
      resolveWebviewView: (webviewView, context, token) => {
        premiumViewProvider.resolveWebviewView(webviewView, context, token);
      },
    })
  );

  // Add status bar items to subscriptions
  context.subscriptions.push(connectionStatusBarItem);

  // Clean up WebSocket connection and providers on deactivation
  context.subscriptions.push({
    dispose: () => {
      wsClient.disconnect();
    },
  });
}

export function deactivate() {}
