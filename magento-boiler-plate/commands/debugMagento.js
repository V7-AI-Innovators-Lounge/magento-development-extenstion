const vscode = require('vscode');
const axios = require('axios');

// Use updated Hugging Face API URL and model (google/flan-t5-large for better response generation)
const API_URL = 'https://api-inference.huggingface.co/models/google/flan-t5-large';
const API_KEY = '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'; // 🔹 Replace with your actual Hugging Face API Key

async function debugMagentoError(errorMessage) {
    try {
        const response = await axios.post(
            API_URL,
            { inputs: errorMessage },
            { headers: { Authorization: `Bearer ${API_KEY}` } }
        );

        if (response.data && response.data.length > 0) {
            return response.data[0].generated_text || "AI couldn't find a solution. Please refine your error message.";
        } else {
            return "AI couldn't find a solution. Please refine your error message.";
        }
    } catch (error) {
        return `Error fetching AI response: ${error.message}`;
    }
}

async function askMagentoAI() {
    const errorMessage = await vscode.window.showInputBox({ prompt: 'Enter Magento Error Message' });

    if (!errorMessage) {
        vscode.window.showErrorMessage('Please enter an error message.');
        return;
    }

    vscode.window.showInformationMessage('Analyzing error with AI...');

    const solution = await debugMagentoError(errorMessage);

    showAIDebugSidebar(solution);
}

function showAIDebugSidebar(response) {
    const panel = vscode.window.createWebviewPanel(
        'magentoDebugAI',
        'Magento AI Debugger',
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
            <title>Magento AI Debugger</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 15px; }
                h2 { color: #007acc; }
                pre { padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <h2>AI Debugging Solution</h2>
            <pre>${response}</pre>
        </body>
        </html>
    `;
}

module.exports = { askMagentoAI };
