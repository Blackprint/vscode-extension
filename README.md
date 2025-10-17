# Blackprint VSCode Extension

Blackprint VSCode Extension brings the power of visual programming directly to your VS Code environment. Create complex workflows and programs by connecting nodes in an intuitive drag-and-drop interface, perfect for visual scripting, data processing, and creative coding.

![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

https://github.com/user-attachments/assets/0bc1ae92-2091-420a-9fe7-10293a24744f

## Features

- **Node-based Visual Editor**: Create visual programs by connecting nodes in an intuitive drag-and-drop interface
- **Custom File Support**: Display Blackprint Editor for `.bpi` (Blackprint Instance) files
- **Real-time execution and modification**: See your visual programs come to life as you build them with remote engine support
- **Extensible Architecture**: Add custom nodes and modules to extend functionality

## 🛠️ Installation & Setup

### Prerequisites

Make sure you have Node.js (v20 or higher) installed. Then install the required Blackprint modules:

```sh
# Install core Blackprint modules and cli-tools
npm i @blackprint/engine @blackprint/cli-tools

# [Optional] Install external node modules
npm i @blackprint/nodes

# [Optional] If you want to use remote engine for debugging or connect to nodes
npm i socket.io @blackprint/remote-control
```

### Configure Your Project

Let the extension know which modules to automatically load by adding this to your `package.json`:

```json
// package.json
{
  "name": "your-project",
  "version": "1.0.0",
  "blackprint": {
    "dependencies": [
      "@blackprint/nodes"
      // Add any other Blackprint modules here
    ]
  }
}
```

## Usage Guide

### Opening Blackprint Files
1. **Open existing `.bpi` files**: Simply double-click any `.bpi` file to launch the visual editor
2. **Files automatically open** in the Blackprint Visual Editor view

### Creating New Blackprint Files
- **Via Explorer**: Right-click in the Explorer and select "Blackprint: New Blackprint instance file"
- **Via Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and search for "Blackprint: New Blackprint instance file"
- Type your file name and press Enter

### Opening `.bpi` Files as Text
- Right-click the file in the Explorer and select "Blackprint: Open file as Text"
- Useful for debugging or manual editing

## Configuration
The extension provides several configuration options in VS Code settings:

### Runtime Configuration
```json
{
  // What do you want to use for executing .bpi files?
  "blackprint.runtime": "Node.js", // or "Bun"

  // List of URL that allowed to be accessed from your VSCode editor for this extension
  "blackprint.whitelistedUrls": [
    "https://example.com",
    "https://api.example.com"
  ]
}
```

## Additional Features

### Skeleton Nodes

Skeleton nodes allow the Editor to understand available nodes and provide placeholder node.

```json
// blackprint.skeleton.json
{
  "nodes": {
    "Example": {
      "Button": {
        "Simple": {
          "$input": {},
          "$output": {
            "Clicked": "BP.Trigger"
          }
        }
      },
      "Display": {
        "Logger": {
          "$input": {
            "Text": "String"
          },
          "$output": {}
        }
      }
    }
  }
}
```

### Building the Extension
For contributing to the extension:

```bash
# Clone the repository
git clone --depth 1 https://github.com/Blackprint/vscode-extension
cd vscode-extension

# Install dependencies
npm install

# Start development mode
npm start

# Open VSCode and run without debugging
# (Menu -> Run -> Run Without Debugging)
```

## License
MIT License