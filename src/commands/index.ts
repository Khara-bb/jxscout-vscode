import * as vscode from "vscode";
import { AstAnalysisTreeProvider } from "../providers/ast-analysis-tree-provider";
import { FileExplorerTreeProvider } from "../providers/file-explorer-tree-provider";
import { ViewScope } from "../types";

export function registerCommands(
  context: vscode.ExtensionContext,
  analysisTreeProvider: AstAnalysisTreeProvider,
  explorerTreeProvider: FileExplorerTreeProvider | null,
  astView: vscode.TreeView<any>,
  fileView: vscode.TreeView<any> | null
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
      if (explorerTreeProvider) {
        explorerTreeProvider.setScope(newScope);
      }
      updateViewTitles(newScope);
      analysisTreeProvider.refresh();
      if (explorerTreeProvider) {
        explorerTreeProvider.refresh();
      }
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
      astView.title = `AST Analysis x(${analysisTreeProvider.getScope()}) - ${
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
        .map((item) => item.node.data.value);

      const uniqueValues = new Set(values);

      if (uniqueValues.size > 0) {
        await vscode.env.clipboard.writeText([...uniqueValues].join("\n"));
        vscode.window.showInformationMessage(
          `Copied ${uniqueValues.size} values to clipboard`
        );
      }
    }
  );

  // Copy paths for bruteforcing
  const copyPathsDisposable = vscode.commands.registerCommand(
    "jxscout.copyPaths",
    async () => {
      const selectedItems = astView.selection;
      if (!selectedItems || selectedItems.length === 0) {
        return;
      }

      const values = selectedItems
        .filter((item) => item.node.type === "match")
        .filter((item) => item.node.data.extra && item.node.data.extra.pathname)
        .map((item) => item.node.data.extra.pathname);

      const uniqueValues = new Set(values);

      if (uniqueValues.size > 0) {
        await vscode.env.clipboard.writeText([...uniqueValues].join("\n"));
        vscode.window.showInformationMessage(
          `Copied ${uniqueValues.size} values to clipboard`
        );
      } else {
        vscode.window.showInformationMessage("No paths found");
      }
    }
  );

  // Copy hostnames command
  const copyHostnamesDisposable = vscode.commands.registerCommand(
    "jxscout.copyHostnames",
    async () => {
      const selectedItems = astView.selection;
      if (!selectedItems || selectedItems.length === 0) {
        return;
      }

      const values = selectedItems
        .filter((item) => item.node.type === "match")
        .filter((item) => item.node.data.extra && item.node.data.extra.hostname)
        .map((item) => item.node.data.extra.hostname);

      const uniqueValues = new Set(values);

      if (uniqueValues.size > 0) {
        await vscode.env.clipboard.writeText([...uniqueValues].join("\n"));
        vscode.window.showInformationMessage(
          `Copied ${uniqueValues.size} values to clipboard`
        );
      } else {
        vscode.window.showInformationMessage("No hostnames found");
      }
    }
  );

  // Copy paths for bruteforcing
  const copyQueryParamsDisposable = vscode.commands.registerCommand(
    "jxscout.copyQueryParams",
    async () => {
      const selectedItems = astView.selection;
      if (!selectedItems || selectedItems.length === 0) {
        return;
      }

      const allQueryParams = new Set<string>();

      const values = selectedItems
        .filter((item) => item.node.type === "match")
        .filter(
          (item) => item.node.data.extra && item.node.data.extra["query-params"]
        )
        .map(
          (item) => new URLSearchParams(item.node.data.extra["query-params"])
        )
        .map((params) => {
          for (const [key] of params.entries()) {
            allQueryParams.add(key);
          }
        });

      if (allQueryParams.size > 0) {
        await vscode.env.clipboard.writeText([...allQueryParams].join("\n"));
        vscode.window.showInformationMessage(
          `Copied ${allQueryParams.size} values to clipboard`
        );
      } else {
        vscode.window.showInformationMessage("No query params found");
      }
    }
  );

  context.subscriptions.push(
    toggleScopeDisposable,
    toggleSortModeDisposable,
    navigateToMatchDisposable,
    copyValuesDisposable,
    copyPathsDisposable,
    copyQueryParamsDisposable,
    copyHostnamesDisposable
  );

  function updateViewTitles(scope: ViewScope) {
    astView.title = `AST Analysis (${scope})`;
    if (fileView) {
      fileView.title = `File Explorer (${scope})`;
    }
  }
}
