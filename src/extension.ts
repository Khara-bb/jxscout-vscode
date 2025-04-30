import * as vscode from "vscode";
import { AstAnalysisTreeProvider } from "./ast-analysis-tree-provider";
import { FileExplorerTreeProvider } from "./file-explorer-tree-provider";
import { WebSocketClient, WebsocketError } from "./websocket-client";

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

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const analysisTreeProvider = new AstAnalysisTreeProvider();
  const explorerTreeProvider = new FileExplorerTreeProvider(workspaceRoot);

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
  updateViewTitles("File");

  async function updateASTAnalysis(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      analysisTreeProvider.setState("empty");
      return;
    }

    const document = editor.document;
    if (!document) {
      analysisTreeProvider.setState("empty");
      return;
    }

    analysisTreeProvider.setState("loading");

    try {
      const analysis = await wsClient.getAnalysis(document.uri.fsPath);
      analysisTreeProvider.setAnalysisData(analysis.results);
      analysisTreeProvider.setState("success");
    } catch (error: any) {
      if (error?.message?.includes("asset not found")) {
        // it's expected that some assets are not tracked by jxscout,
        // so show empty state
        analysisTreeProvider.setState("asset-not-found");
      } else {
        vscode.window.showErrorMessage(
          `Failed to get AST analysis: ${error.message}`
        );
        analysisTreeProvider.setState("empty");
      }
    }
  }

  // Register active editor change handler
  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(
    async (editor) => {
      await updateASTAnalysis(editor);
    }
  );

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

  let navigateToMatchDisposable = vscode.commands.registerCommand(
    "jxscout.navigateToMatch",
    (data: any) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const startPosition = new vscode.Position(
        data.start.line - 1,
        data.start.column - 1
      );
      const endPosition = new vscode.Position(
        data.end.line - 1,
        data.end.column - 1
      );

      const range = new vscode.Range(startPosition, endPosition);
      editor.selection = new vscode.Selection(startPosition, endPosition);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

      // Add a decoration to highlight the range
      const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor("editor.selectionBackground"),
        isWholeLine: false,
      });

      editor.setDecorations(decorationType, [range]);
    }
  );

  context.subscriptions.push(
    disposable,
    navigateToMatchDisposable,
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
