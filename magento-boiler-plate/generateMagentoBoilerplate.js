const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

function generateMagentoBoilerplate(choice) {
    vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
        if (!vendor) {
            vscode.window.showErrorMessage("Vendor name is required.");
            return;
        }

        vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
            if (!module) {
                vscode.window.showErrorMessage("Module name is required.");
                return;
            }

            const wsFolders = vscode.workspace.workspaceFolders;
            if (!wsFolders) {
                vscode.window.showErrorMessage("Open a workspace folder to generate the module.");
                return;
            }

            const workspaceDir = wsFolders[0].uri.fsPath;
            const moduleDir = path.join(workspaceDir, vendor, module);

            if (!fs.existsSync(moduleDir)) fs.mkdirSync(moduleDir, { recursive: true });

            switch (choice) {
                case 'Generate Observer':
                    createObserver(moduleDir, vendor, module);
                    break;
                case 'Generate Controller':
                    createController(moduleDir, vendor, module);
                    break;
                case 'Generate API Endpoint':
                    createAPI(moduleDir, vendor, module);
                    break;
                case 'Generate Repository':
                    createRepository(moduleDir, vendor, module);
                    break;
                case 'Debug an Issue':
                    vscode.window.showInputBox({ prompt: 'Describe your issue' }).then(issue => {
                        if (!issue) {
                            vscode.window.showErrorMessage("Issue description is required.");
                            return;
                        }
                        fetchAIResponse(`I have a Magento issue: ${issue}`).then(response => {
                            vscode.window.showInformationMessage("Magento Copilot: " + response);
                        });
                    });
                    break;
            }
        });
    });
}

module.exports = { generateMagentoBoilerplate };
