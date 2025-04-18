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
    showCollapseAll: true,
    canSelectMany: true, // Enable multi-selection
  });

  // Set the tree view reference in the provider
  treeProvider.setTreeView(treeView);

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

  // Register highlight and jump command
  const highlightAndJumpCommand = vscode.commands.registerCommand(
    "jxscout-vscode.highlightAndJump",
    async (filePath: string, range: vscode.Range) => {
      try {
        // Use the new method that preserves focus
        treeProvider.highlightAndJumpWithoutFocus(filePath, range);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open file: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  // Register copy selected items command
  const copySelectedCommand = vscode.commands.registerCommand(
    "jxscout-vscode.copySelectedItems",
    () => {
      treeProvider.copySelectedItems();
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
        // Clear the analysis tree view before updating with new file
        treeProvider.clearAnalysis();
        await updateAnalysis(editor.document.uri);
      }
    }
  );

  // Handle tree view selection changes
  const selectionChangeDisposable = treeView.onDidChangeSelection((e) => {
    // Handle selection changes
    const selectedItems = e.selection;
    const previouslySelectedItems = treeProvider.getSelectedItems();

    // Clear previous selections that are no longer selected
    for (const item of previouslySelectedItems) {
      if (!selectedItems.includes(item)) {
        treeProvider.handleSelection(item, false);
      }
    }

    // Add new selections
    for (const item of selectedItems) {
      if (!previouslySelectedItems.includes(item)) {
        treeProvider.handleSelection(item, true);
      }
    }
  });

  // Handle keyboard navigation
  const keyboardDisposable = vscode.commands.registerCommand(
    "jxscout-vscode.handleKeyNavigation",
    (key: string) => {
      treeProvider.handleKeyNavigation(key);
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
    highlightAndJumpCommand,
    copySelectedCommand,
    keyboardDisposable,
    configChangeDisposable,
    editorChangeDisposable,
    selectionChangeDisposable,
    statusBarItem,
    treeProvider,
    {
      dispose: () => {
        wsClient.disconnect();
      },
    }
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
