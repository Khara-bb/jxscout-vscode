import * as vscode from "vscode";

export class JxscoutViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _viewType: string
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${
                  this._viewType === "jxscoutProjectView"
                    ? "Project Analysis"
                    : "File Analysis"
                }</title>
            </head>
            <body>
                <div class="view-container">
                    <div class="tabs">
                        <button class="tab active" data-tab="explorer">File Explorer</button>
                        <button class="tab" data-tab="analysis">AST Analysis</button>
                    </div>
                    <div class="content">
                        <div class="tab-content active" id="explorer">
                            <p>${
                              this._viewType === "jxscoutProjectView"
                                ? "Project File Explorer Placeholder"
                                : "Current File Explorer Placeholder"
                            }</p>
                        </div>
                        <div class="tab-content" id="analysis">
                            <p>${
                              this._viewType === "jxscoutProjectView"
                                ? "Project AST Analysis Placeholder"
                                : "Current File AST Analysis Placeholder"
                            }</p>
                        </div>
                    </div>
                </div>
                <style>
                    .view-container {
                        padding: 10px;
                    }
                    .tabs {
                        display: flex;
                        margin-bottom: 10px;
                    }
                    .tab {
                        padding: 8px 16px;
                        border: none;
                        background: none;
                        cursor: pointer;
                        border-bottom: 2px solid transparent;
                    }
                    .tab.active {
                        border-bottom: 2px solid var(--vscode-button-background);
                    }
                    .tab-content {
                        display: none;
                    }
                    .tab-content.active {
                        display: block;
                    }
                </style>
                <script>
                    const tabs = document.querySelectorAll('.tab');
                    const contents = document.querySelectorAll('.tab-content');
                    
                    tabs.forEach(tab => {
                        tab.addEventListener('click', () => {
                            tabs.forEach(t => t.classList.remove('active'));
                            contents.forEach(c => c.classList.remove('active'));
                            
                            tab.classList.add('active');
                            document.getElementById(tab.dataset.tab).classList.add('active');
                        });
                    });
                </script>
            </body>
            </html>`;
  }
}
