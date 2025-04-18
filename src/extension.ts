// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WebSocketClient } from "./websocket-client";
import { AnalysisTreeProvider } from "./analysis-tree-provider";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Get configuration
  const config = vscode.workspace.getConfiguration("jxscout");
  const serverHost = config.get<string>("serverHost") || "localhost";
  const serverPort = config.get<number>("serverPort") || 3333;
  const serverUrl = `ws://${serverHost}:${serverPort}/ast-analyzer/ws`;

  // Initialize WebSocket client
  const wsClient = new WebSocketClient(serverUrl);
  const treeProvider = new AnalysisTreeProvider();

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(sync) jxscout: Connecting...";
  statusBarItem.tooltip = "jxscout Analysis";
  statusBarItem.command = "jxscout-vscode.openSettings";
  statusBarItem.show();

  // Register the tree view
  const treeView = vscode.window.createTreeView("jxscoutAnalysis", {
    treeDataProvider: treeProvider,
  });

  // Connect to WebSocket server
  wsClient
    .connect()
    .then(() => {
      statusBarItem.text = "$(check) jxscout: Connected";
      statusBarItem.tooltip = `Connected to ${serverUrl}`;
    })
    .catch((error: Error) => {
      statusBarItem.text = "$(error) jxscout: Disconnected";
      statusBarItem.tooltip = `Connection failed: ${error.message}`;
      vscode.window.showErrorMessage(
        `Failed to connect to jxscout server: ${error.message}`
      );
    });

  // Register refresh command
  const refreshCommand = vscode.commands.registerCommand(
    "jxscout-vscode.refreshAnalysis",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await updateAnalysis(editor.document.uri);
      }
    }
  );

  // Register settings command
  const settingsCommand = vscode.commands.registerCommand(
    "jxscout-vscode.openSettings",
    () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "jxscout"
      );
    }
  );

  // Handle configuration changes
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("jxscout")) {
        const newConfig = vscode.workspace.getConfiguration("jxscout");
        const newServerHost =
          newConfig.get<string>("serverHost") || "localhost";
        const newServerPort = newConfig.get<number>("serverPort") || 8080;
        const newServerUrl = `ws://${newServerHost}:${newServerPort}/ws`;

        // Update status bar
        statusBarItem.text = "$(sync) jxscout: Reconnecting...";
        statusBarItem.tooltip = `Reconnecting to ${newServerUrl}`;

        // Disconnect from old server
        wsClient.disconnect();

        // Update client with new URL
        wsClient.updateServerUrl(newServerUrl);

        // Reconnect to new server
        wsClient
          .connect()
          .then(() => {
            statusBarItem.text = "$(check) jxscout: Connected";
            statusBarItem.tooltip = `Connected to ${newServerUrl}`;
          })
          .catch((error: Error) => {
            statusBarItem.text = "$(error) jxscout: Disconnected";
            statusBarItem.tooltip = `Connection failed: ${error.message}`;
            vscode.window.showErrorMessage(
              `Failed to connect to jxscout server: ${error.message}`
            );
          });
      }
    }
  );

  // Handle active editor changes
  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(
    async (editor) => {
      if (editor) {
        await updateAnalysis(editor.document.uri);
      }
    }
  );

  // Function to update analysis for a file
  async function updateAnalysis(uri: vscode.Uri) {
    try {
      const filePath = uri.fsPath;
      const analysis = await wsClient.getAnalysis(filePath);
      treeProvider.updateAnalysis(analysis);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      vscode.window.showErrorMessage(`Failed to get analysis: ${errorMessage}`);
    }
  }

  // Add disposables
  context.subscriptions.push(
    treeView,
    refreshCommand,
    settingsCommand,
    configChangeDisposable,
    editorChangeDisposable,
    statusBarItem,
    {
      dispose: () => {
        wsClient.disconnect();
      },
    }
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
