import * as vscode from "vscode";
import { JxscoutTreeProvider } from "./jxscout-tree-provider";
import { WebSocketClient } from "./websocket-client";

export function activate(context: vscode.ExtensionContext) {
  // Initialize WebSocket client
  const config = vscode.workspace.getConfiguration("jxscout");
  const host = config.get<string>("serverHost") || "localhost";
  const port = config.get<number>("serverPort") || 3333;
  const wsClient = new WebSocketClient(`ws://${host}:${port}/ws`);

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.text = "$(list-tree) Project Scope";
  statusBarItem.tooltip = "Click to toggle between project and file scope";
  statusBarItem.command = "jxscout.toggleScope";
  statusBarItem.show();

  const connectionStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right
  );
  connectionStatusBarItem.text = "jxscout $(sync~spin)";
  connectionStatusBarItem.tooltip = "Connecting to jxscout server...";
  connectionStatusBarItem.show();

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

  const analysisTreeProvider = new JxscoutTreeProvider("analysis");
  const explorerTreeProvider = new JxscoutTreeProvider("explorer");

  // Register the views
  const astView = vscode.window.createTreeView("jxscoutAstView", {
    treeDataProvider: analysisTreeProvider,
    showCollapseAll: true,
  });

  const fileView = vscode.window.createTreeView("jxscoutFileView", {
    treeDataProvider: explorerTreeProvider,
    showCollapseAll: true,
  });

  // Update view titles based on scope
  function updateViewTitles(scope: string) {
    astView.title = `AST Analysis (${scope})`;
    fileView.title = `File Explorer (${scope})`;
  }

  // Initial titles
  updateViewTitles("Project");

  async function updateASTAnalysis(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      analysisTreeProvider.setAnalysisData(undefined);
      return;
    }

    const document = editor.document;
    if (!document) {
      analysisTreeProvider.setAnalysisData(undefined);
      return;
    }

    try {
      const analysis = await wsClient.getAnalysis(document.uri.fsPath);
      analysisTreeProvider.setAnalysisData(analysis.results);
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to get AST analysis: ${error.message}`
      );
      analysisTreeProvider.setAnalysisData(undefined);
    }
  }

  // Register active editor change handler
  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(
    async (editor) => {
      await updateASTAnalysis(editor);
    }
  );

  // Initial analysis for currently active editor
  // updateASTAnalysis();

  let disposable = vscode.commands.registerCommand(
    "jxscout.toggleScope",
    () => {
      const newScope =
        analysisTreeProvider.getScope() === "project" ? "file" : "project";
      analysisTreeProvider.setScope(newScope);
      explorerTreeProvider.setScope(newScope);
      statusBarItem.text = `$(list-tree) ${
        newScope === "project" ? "Project" : "File"
      } Scope`;
      updateViewTitles(newScope.charAt(0).toUpperCase() + newScope.slice(1));
      analysisTreeProvider.refresh();
      explorerTreeProvider.refresh();
    }
  );

  context.subscriptions.push(
    disposable,
    editorChangeDisposable,
    astView,
    fileView,
    statusBarItem,
    connectionStatusBarItem
  );

  // Clean up WebSocket connection on deactivation
  context.subscriptions.push({
    dispose: () => {
      wsClient.disconnect();
    },
  });
}

export function deactivate() {}
