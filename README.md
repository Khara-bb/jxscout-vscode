# jxscout-vscode

A VSCode extension for integrating with jxscout, a tool that automatically saves JS files and performs AST analysis.

## Features

- Real-time AST analysis of JavaScript files
- Tree view displaying analysis results organized by analyzer type
- Automatic updates when switching between files
- Configurable WebSocket server connection

## Configuration

The extension can be configured through VSCode settings:

| Setting              | Description                              | Default     |
| -------------------- | ---------------------------------------- | ----------- |
| `jxscout.serverHost` | Hostname of the jxscout WebSocket server | `localhost` |
| `jxscout.serverPort` | Port of the jxscout WebSocket server     | `3333`      |

You can access these settings by:

1. Opening the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Typing "Open jxscout Settings"
3. Or clicking on the jxscout status bar item

## Usage

1. Open a JavaScript file in VSCode
2. The extension will automatically connect to the jxscout server and request analysis
3. Analysis results will be displayed in the jxscout Analysis panel
4. Use the refresh button to manually update the analysis

## Requirements

- A running jxscout >=0.6.0 server

## Extension Settings

This extension contributes the following settings:

- `jxscout.serverHost`: Hostname of the jxscout WebSocket server
- `jxscout.serverPort`: Port of the jxscout WebSocket server

## Development

### Prerequisites

- Node.js and npm installed
- VS Code
- Recommended VS Code extensions:
  - amodio.tsl-problem-matcher
  - ms-vscode.extension-test-runner
  - dbaeumer.vscode-eslint

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Press `F5` to open a new window with your extension loaded
4. Run your command from the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)
5. Set breakpoints in your code inside `src/extension.ts` to debug your extension
6. Find output from your extension in the debug console

### Making Changes

- You can relaunch the extension from the debug toolbar after changing code
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes

### Building the Extension

To build the extension for distribution:

```bash
npm run compile
```

This will create a production build in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
