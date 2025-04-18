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

- VSCode 1.99.0 or higher
- A running jxscout WebSocket server

## Extension Settings

This extension contributes the following settings:

- `jxscout.serverHost`: Hostname of the jxscout WebSocket server
- `jxscout.serverPort`: Port of the jxscout WebSocket server

## Release Notes

### 0.0.1

Initial release of jxscout-vscode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
