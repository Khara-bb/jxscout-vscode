import * as vscode from "vscode";
import { ASTAnalyzerTreeNode } from "./websocket-client";

type ViewScope = "project" | "file";

export class AstAnalysisTreeItem extends vscode.TreeItem {
  public readonly children?: ASTAnalyzerTreeNode[];
  public readonly data?: any;

  constructor({
    label,
    collapsibleState,
    iconName,
    children,
    data,
    description,
    tooltip,
  }: {
    label: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
    contextValue: string;
    iconName?: string;
    children?: ASTAnalyzerTreeNode[];
    data?: any;
    description?: string;
    tooltip?: string;
  }) {
    super(label, collapsibleState);
    this.description = description || "";
    this.tooltip = tooltip;
    this.children = children;
    this.data = data;
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}

type State = "loading" | "asset-not-found" | "success" | "empty";

export class AstAnalysisTreeProvider
  implements vscode.TreeDataProvider<AstAnalysisTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AstAnalysisTreeItem | undefined | null | void
  > = new vscode.EventEmitter<AstAnalysisTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AstAnalysisTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _scope: ViewScope = "file";
  private _analysisData?: ASTAnalyzerTreeNode;
  private _state: State = "loading";

  getScope(): ViewScope {
    return this._scope;
  }

  setScope(scope: ViewScope) {
    this._scope = scope;
    this.refresh();
  }

  setState(state: State) {
    this._state = state;
    if (state !== "success") {
      this._analysisData = undefined;
    }
    this.refresh();
  }

  setAnalysisData(data: ASTAnalyzerTreeNode | undefined) {
    this._analysisData = data;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AstAnalysisTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AstAnalysisTreeItem): Thenable<AstAnalysisTreeItem[]> {
    if (this._state === "empty") {
      return Promise.resolve([]);
    }

    if (this._state === "loading") {
      return Promise.resolve([
        new AstAnalysisTreeItem({
          label: "Loading analysis...",
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          contextValue: "loading",
          iconName: "loading~spin",
        }),
      ]);
    }

    if (this._state === "asset-not-found") {
      return Promise.resolve([
        new AstAnalysisTreeItem({
          label: "This file is not tracked by jxscout",
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          contextValue: "empty",
          iconName: "info",
        }),
      ]);
    }

    if (!this._analysisData?.children?.length) {
      return Promise.resolve([
        new AstAnalysisTreeItem({
          label: "No AST Analysis matches found",
          collapsibleState: vscode.TreeItemCollapsibleState.None,
          contextValue: "empty",
          iconName: "info",
        }),
      ]);
    }

    if (!element) {
      return Promise.resolve(
        this._analysisData.children.map(
          (child) =>
            new AstAnalysisTreeItem({
              label: child.label || "Root",
              collapsibleState: child.children?.length
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None,
              contextValue: child.type || "navigation",
              iconName: child.iconName,
              children: child.children,
              data: child.data,
            })
        )
      );
    }

    if (element.children) {
      return Promise.resolve(
        element.children.map(
          (child) =>
            new AstAnalysisTreeItem({
              label: child.label || "Node",
              collapsibleState: child.children?.length
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None,
              contextValue: child.type || "navigation",
              iconName: child.iconName,
              children: child.children,
              data: child.data,
            })
        )
      );
    }

    return Promise.resolve([]);
  }
}
