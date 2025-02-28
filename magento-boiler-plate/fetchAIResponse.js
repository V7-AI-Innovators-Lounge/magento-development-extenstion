const axios = require('axios');

const HF_API_KEY = "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";
const MODEL_NAME = "tiiuae/falcon-7b-instruct";  

async function fetchAIResponse(query) {
    try {
        console.log("Fetching AI response via Hugging Face API...");
        
        const response = await axios.post(
            `https://api-inference.huggingface.co/models/${MODEL_NAME}`,
            { inputs: query },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data && response.data.length > 0) {
            return response.data[0].generated_text;  // Extract response text
        } else {
            throw new Error("No response from AI model.");
        }
    } catch (error) {
        console.error("Error fetching AI response:", error.message);
        throw new Error(error.message);
    }
}

module.exports = { fetchAIResponse };
