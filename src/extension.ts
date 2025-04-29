import * as vscode from "vscode";
import { JxscoutTreeProvider } from "./jxscout-tree-provider";

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  statusBarItem.text = "$(list-tree) Project Scope";
  statusBarItem.tooltip = "Click to toggle between project and file scope";
  statusBarItem.command = "jxscout.toggleScope";
  statusBarItem.show();

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

  context.subscriptions.push(disposable);
}

export function deactivate() {}
