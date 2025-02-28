const vscode = require('vscode');
const axios = require('axios');

const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-large';  // AI Model for generating tests
const API_KEY = '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'; // Replace with your actual API Key

async function generateMagentoUnitTest(classType, className) {
    try {
        const response = await axios.post(
            API_URL,
            { inputs: `Generate Magento PHPUnit test case for ${classType}: ${className}` },
            { headers: { Authorization: `Bearer ${API_KEY}` } }
        );

        if (response.data && response.data.length > 0) {
            return response.data[0].generated_text;
        } else {
            return "AI couldn't generate the unit test. Try refining your request.";
        }
    } catch (error) {
        return `Error generating test case: ${error.message}`;
    }
}

async function askMagentoUnitTest() {
    const classType = await vscode.window.showQuickPick(['Model', 'Helper', 'Controller', 'Repository'], { placeHolder: 'Select Magento Class Type' });

    if (!classType) {
        vscode.window.showErrorMessage('Class type is required.');
        return;
    }

    const className = await vscode.window.showInputBox({ prompt: `Enter ${classType} Class Name (e.g., CustomModel)` });

    if (!className) {
        vscode.window.showErrorMessage('Class name is required.');
        return;
    }

    vscode.window.showInformationMessage(`Generating unit test for ${classType}: ${className}...`);

    const unitTestCode = await generateMagentoUnitTest(classType, className);
    showAIUnitTestSidebar(unitTestCode, className);
}

function showAIUnitTestSidebar(response, className) {
    const panel = vscode.window.createWebviewPanel(
        'magentoUnitTestAI',
        `Magento PHPUnit: ${className}`,
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(response);
}

function getWebviewContent(response) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Magento Unit Test Generator</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 15px; }
                h2 { color: #007acc; }
                pre { padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <h2>AI-Generated Magento Unit Test</h2>
            <pre>${response}</pre>
        </body>
        </html>
    `;
}

module.exports = { askMagentoUnitTest };
