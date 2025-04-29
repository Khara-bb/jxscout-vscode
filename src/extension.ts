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

  vscode.window.registerTreeDataProvider(
    "jxscoutAstView",
    analysisTreeProvider
  );
  vscode.window.registerTreeDataProvider(
    "jxscoutFileView",
    explorerTreeProvider
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
      analysisTreeProvider.refresh();
      explorerTreeProvider.refresh();
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
