const vscode = require('vscode');
const axios = require('axios');

const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-large'; // Model for code generation
const API_KEY = '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';

async function generateMagentoCode(prompt) {
    try {
        const response = await axios.post(
            API_URL,
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${API_KEY}` } }
        );

        if (response.data && response.data.length > 0) {
            return response.data[0].generated_text;
        } else {
            return "AI couldn't generate the code. Try refining your request.";
        }
    } catch (error) {
        return `Error generating code: ${error.message}`;
    }
}

async function askMagentoCodeAI() {
    const prompt = await vscode.window.showInputBox({ prompt: 'Enter request for Magento code (e.g., Ask a program)' });

    if (!prompt) {
        vscode.window.showErrorMessage('Please enter a valid request.');
        return;
    }

    vscode.window.showInformationMessage('Generating Magento code with AI...');

    const code = await generateMagentoCode(prompt);
    showAICodeSidebar(code);
}

function showAICodeSidebar(response) {
    const panel = vscode.window.createWebviewPanel(
        'magentoCodeAI',
        'Magento AI Code Generator',
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
            <title>Magento AI Code Generator</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 15px; }
                h2 { color: #007acc; }
                pre { padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <h2>AI-Generated Magento Code</h2>
            <pre>${response}</pre>
        </body>
        </html>
    `;
}

module.exports = { askMagentoCodeAI };
