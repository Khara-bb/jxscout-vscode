import * as vscode from "vscode";
import { AnalysisResult, Finding } from "./websocket-client";

export class AnalysisTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly children?: AnalysisTreeItem[],
    public readonly description?: string,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = tooltip;
    this.command = command;
  }
}

export class AnalysisTreeProvider
  implements vscode.TreeDataProvider<AnalysisTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AnalysisTreeItem | undefined | null | void
  > = new vscode.EventEmitter<AnalysisTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AnalysisTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private currentAnalysis: AnalysisResult | null = null;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  clearAnalysis(): void {
    this.currentAnalysis = null;
    this.refresh();
  }

  updateAnalysis(analysis: AnalysisResult): void {
    this.currentAnalysis = analysis;
    this.refresh();
  }

  getTreeItem(element: AnalysisTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AnalysisTreeItem): Thenable<AnalysisTreeItem[]> {
    if (!this.currentAnalysis) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - create analyzer type nodes
      return Promise.resolve(this.createAnalyzerNodes());
    }

    // Return children of the selected node
    return Promise.resolve(element.children || []);
  }

  private createAnalyzerNodes(): AnalysisTreeItem[] {
    if (!this.currentAnalysis) {
      return [];
    }

    const analyzerNodes: AnalysisTreeItem[] = [];
    const { results, filePath } = this.currentAnalysis;

    for (const [analyzerType, matches] of Object.entries(results)) {
      if (Array.isArray(matches)) {
        const matchItems = matches.map((match, index) => {
          const description = `Line ${match.start.line}:${match.start.column} - ${match.start.line}:${match.end.column}`;

          // Create a command to jump to the code location
          const command: vscode.Command = {
            title: "Jump to code",
            command: "vscode.open",
            arguments: [
              vscode.Uri.file(filePath),
              {
                selection: new vscode.Range(
                  match.start.line - 1, // Convert to 0-based line number
                  match.start.column,
                  match.end.line - 1, // Convert to 0-based line number
                  match.end.column
                ),
              },
            ],
          };

          return new AnalysisTreeItem(
            `${match.value}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            description,
            `${match.value}`,
            command
          );
        });

        // Capitalize the analyzer name
        const capitalizedAnalyzerType =
          analyzerType.charAt(0).toUpperCase() + analyzerType.slice(1);

        analyzerNodes.push(
          new AnalysisTreeItem(
            capitalizedAnalyzerType,
            vscode.TreeItemCollapsibleState.Expanded,
            matchItems
          )
        );
      }
    }

    return analyzerNodes;
  }
}
