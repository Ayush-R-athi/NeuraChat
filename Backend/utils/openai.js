import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getOpenAIAPIResponse = async (message, model = "llama-3.3-70b-versatile") => {
    const response = await groq.chat.completions.create({
        model,
        messages: [{ role: "user", content: message }],
    });
    return response.choices[0].message.content;
};

export default getOpenAIAPIResponse;
