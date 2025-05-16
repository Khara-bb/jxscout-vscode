import * as vscode from "vscode";
import { AstAnalysisTreeProvider } from "../providers/ast-analysis-tree-provider";
import { FileExplorerTreeProvider } from "../providers/file-explorer-tree-provider";
import { WebSocketClient } from "../services/websocket-client";

export function createViews(
  context: vscode.ExtensionContext,
  workspaceRoot: string | undefined,
  wsClient: WebSocketClient
) {
  const analysisTreeProvider = new AstAnalysisTreeProvider();
  const explorerTreeProvider = new FileExplorerTreeProvider(workspaceRoot);

  // Register the views
  const astView = vscode.window.createTreeView("jxscoutAstView", {
    treeDataProvider: analysisTreeProvider,
    showCollapseAll: true,
    canSelectMany: true,
  });

  // Initial titles
  astView.title = "Descriptors (File)";

  // Check for active editor during initialization after WebSocket is ready
  wsClient.onReady().then(() => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      updateASTAnalysis(activeEditor, analysisTreeProvider, wsClient);
    }
  });

  // Register active editor change handler
  const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(
    async (editor) => {
      await updateASTAnalysis(editor, analysisTreeProvider, wsClient);
    }
  );

  context.subscriptions.push(astView, editorChangeDisposable);

  return {
    astView,
    analysisTreeProvider,
    explorerTreeProvider,
  };
}

async function updateASTAnalysis(
  editor: vscode.TextEditor | undefined,
  analysisTreeProvider: AstAnalysisTreeProvider,
  wsClient: WebSocketClient
) {
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
      analysisTreeProvider.setState("asset-not-found");
    } else {
      vscode.window.showErrorMessage(
        `Failed to get descriptors: ${error.message}`
      );
      analysisTreeProvider.setState("empty");
    }
  }
}
