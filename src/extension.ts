// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WebSocketClient } from "./websocket-client";
import { AnalysisTreeProvider } from "./analysis-tree-provider";
import * as path from "path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Initialize WebSocket client
  const wsClient = new WebSocketClient("ws://localhost:8080/ws"); // Update with your server URL
  const treeProvider = new AnalysisTreeProvider();

  // Register the tree view
  const treeView = vscode.window.createTreeView("jxscoutAnalysis", {
    treeDataProvider: treeProvider,
  });

  // Connect to WebSocket server
  wsClient.connect().catch((error: Error) => {
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
  context.subscriptions.push(treeView, refreshCommand, editorChangeDisposable, {
    dispose: () => {
      wsClient.disconnect();
    },
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
