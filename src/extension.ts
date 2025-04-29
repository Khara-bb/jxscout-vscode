import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(check) jxscout";
  statusBarItem.tooltip = "jxscout Analysis";
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
}

export function deactivate() {}
