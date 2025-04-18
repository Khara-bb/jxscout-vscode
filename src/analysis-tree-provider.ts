import * as vscode from "vscode";
import { AnalysisResult, Finding } from "./websocket-client";

export class AnalysisTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly children?: AnalysisTreeItem[],
    public readonly description?: string,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    public readonly range?: vscode.Range
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = tooltip;
    this.command = command;
    this.contextValue = "jxscout-item";
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
  private activeDecoration: vscode.TextEditorDecorationType | null = null;
  private activeEditor: vscode.TextEditor | null = null;
  private activeRange: vscode.Range | null = null;

  constructor() {
    // Create the decoration type
    this.activeDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor(
        "editor.findMatchHighlightBackground"
      ),
      isWholeLine: false,
    });

    // Listen for editor changes to clear highlighting when switching files
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor !== this.activeEditor) {
        this.clearHighlight();
      }
    });

    // Listen for editor clicks to clear highlighting
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor === this.activeEditor) {
        this.clearHighlight();
      }
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  clearAnalysis(): void {
    this.currentAnalysis = null;
    this.clearHighlight();
    this.refresh();
  }

  updateAnalysis(analysis: AnalysisResult): void {
    this.currentAnalysis = analysis;
    this.clearHighlight();
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
      const nodes = this.createAnalyzerNodes();

      // If there are no findings at all, show the "No interesting stuff found" message
      if (nodes.length === 0) {
        const noFindingsItem = new AnalysisTreeItem(
          "Nothing interesting was found",
          vscode.TreeItemCollapsibleState.None,
          undefined
        );
        return Promise.resolve([noFindingsItem]);
      }

      return Promise.resolve(nodes);
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
      if (Array.isArray(matches) && matches.length > 0) {
        // Only create nodes for categories with findings
        const matchItems = matches.map((match, index) => {
          // Create the range for this match
          const range = new vscode.Range(
            match.start.line - 1, // Convert to 0-based line number
            match.start.column,
            match.end.line - 1, // Convert to 0-based line number
            match.end.column
          );

          // Create a command to jump to the code location
          const command: vscode.Command = {
            title: "Jump to code",
            command: "jxscout-vscode.highlightAndJump",
            arguments: [filePath, range],
          };

          const item = new AnalysisTreeItem(
            `${match.value}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            undefined,
            `${match.value}`,
            command,
            range
          );

          // Ensure the item is enabled and has the correct icon
          item.iconPath = new vscode.ThemeIcon("symbol-keyword");
          return item;
        });

        // Capitalize the analyzer name
        const capitalizedAnalyzerType =
          analyzerType.charAt(0).toUpperCase() + analyzerType.slice(1);

        const analyzerNode = new AnalysisTreeItem(
          capitalizedAnalyzerType,
          vscode.TreeItemCollapsibleState.Expanded,
          matchItems
        );

        // Set icon for analyzer node
        analyzerNode.iconPath = new vscode.ThemeIcon("symbol-class");

        analyzerNodes.push(analyzerNode);
      }
    }

    return analyzerNodes;
  }

  private clearHighlight(): void {
    if (this.activeEditor && this.activeDecoration) {
      this.activeEditor.setDecorations(this.activeDecoration, []);
      this.activeRange = null;
    }
  }

  public highlightRange(editor: vscode.TextEditor, range: vscode.Range): void {
    if (!this.activeDecoration) {
      return;
    }

    this.clearHighlight();
    this.activeEditor = editor;
    this.activeRange = range;
    editor.setDecorations(this.activeDecoration, [range]);
  }

  public dispose(): void {
    this.clearHighlight();
    if (this.activeDecoration) {
      this.activeDecoration.dispose();
      this.activeDecoration = null;
    }
  }
}
