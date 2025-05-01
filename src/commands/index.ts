import * as vscode from "vscode";
import { AstAnalysisTreeProvider } from "../providers/ast-analysis-tree-provider";
import { FileExplorerTreeProvider } from "../providers/file-explorer-tree-provider";
import { ViewScope } from "../types";

export function registerCommands(
  context: vscode.ExtensionContext,
  analysisTreeProvider: AstAnalysisTreeProvider,
  explorerTreeProvider: FileExplorerTreeProvider,
  astView: vscode.TreeView<any>,
  fileView: vscode.TreeView<any>
) {
  // Set initial scope context
  vscode.commands.executeCommand("setContext", "scope", "file");

  // Toggle scope command
  const toggleScopeDisposable = vscode.commands.registerCommand(
    "jxscout.toggleScope",
    () => {
      const newScope =
        analysisTreeProvider.getScope() === "project" ? "file" : "project";

      // Update the context key
      vscode.commands.executeCommand("setContext", "scope", newScope);

      analysisTreeProvider.setScope(newScope);
      explorerTreeProvider.setScope(newScope);
      updateViewTitles(newScope);
      analysisTreeProvider.refresh();
      explorerTreeProvider.refresh();
    }
  );

  // Toggle sort mode command
  const toggleSortModeDisposable = vscode.commands.registerCommand(
    "jxscout.toggleSortMode",
    () => {
      const newSortMode =
        analysisTreeProvider.getSortMode() === "alphabetical"
          ? "occurrence"
          : "alphabetical";
      analysisTreeProvider.setSortMode(newSortMode);
      astView.title = `AST Analysis (${analysisTreeProvider.getScope()}) - ${
        newSortMode === "alphabetical" ? "A-Z" : "By Occurrence"
      }`;
    }
  );

  // Navigate to match command
  const navigateToMatchDisposable = vscode.commands.registerCommand(
    "jxscout.navigateToMatch",
    (data: any) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const startPosition = new vscode.Position(
        data.start.line - 1,
        data.start.column
      );
      const endPosition = new vscode.Position(
        data.end.line - 1,
        data.end.column
      );

      const range = new vscode.Range(startPosition, endPosition);
      editor.selection = new vscode.Selection(startPosition, endPosition);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    }
  );

  // Copy values command
  const copyValuesDisposable = vscode.commands.registerCommand(
    "jxscout.copyValues",
    async () => {
      const selectedItems = astView.selection;
      if (!selectedItems || selectedItems.length === 0) {
        return;
      }

      const values = selectedItems
        .filter((item) => item.node.type === "match")
        .map((item) => item.node.data.value)
        .join("\n");

      if (values) {
        await vscode.env.clipboard.writeText(values);
        vscode.window.showInformationMessage(
          `Copied ${selectedItems.length} values to clipboard`
        );
      }
    }
  );

  context.subscriptions.push(
    toggleScopeDisposable,
    toggleSortModeDisposable,
    navigateToMatchDisposable,
    copyValuesDisposable
  );

  function updateViewTitles(scope: ViewScope) {
    astView.title = `AST Analysis (${scope})`;
    fileView.title = `File Explorer (${scope})`;
  }
}
