<h1 align="center">Blackprint for Visual Studio Code</h1>
<p align="center">
Blackprint brings the power of visual programming directly to your VS Code environment. Create workflows or programs by connecting nodes directly from your editor.
</p>

<p align="center">
  <a href='https://github.com/Blackprint/Blackprint/blob/master/LICENSE'><img src='https://img.shields.io/badge/License-MIT-brightgreen.svg' height='20'></a>
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/0bc1ae92-2091-420a-9fe7-10293a24744f" controls><p align="center">View the preview video on <a href="https://github.com/user-attachments/assets/0bc1ae92-2091-420a-9fe7-10293a24744f">new tab</a></p></video>
</p>

## Features
- **Node-based Visual Editor**: Create visual programs by connecting nodes with drag-and-drop interface
- **Custom File Support**: Editor support for `.bpi` (Blackprint Instance) extension files
- **Real-time execution and modification**: See your visual programs come to life as you build them with remote engine support
- **Extensible Architecture**: Add custom nodes and modules to extend functionality of visual programming

## Prerequisites
Make sure you have Node.js (v20 or higher) installed and make sure the required Blackprint modules already installed to your current workspace:

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

```js
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
```js
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

```js
// blackprint.skeleton.json
{
  "nodes": { // Node namespace tree
    "Example": {
      "Button": {
        // Example/Button/Simple
        "Simple": {
          // "$port": { "name": "type" }
          "$input": { },
          "$output": {
            "Clicked": "BP.Trigger"
          }
        }
      },
      "Display": {
        // Example/Display/Logger
        "Logger": {
          // "$port": { "name": "type" }
          "$input": {
            "Text": "String"
          },
          "$output": { }
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

# Download all editor dependencies as local asset
npm run update-editor-asset-dependency

# Start development mode
npm start

# Open VSCode and run without debugging
# (Menu -> Run -> Run Without Debugging)
```

## License
MIT License