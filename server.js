require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/translate', async (req, res) => {
    const { word } = req.body;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 1.1,
            messages: [
                { 
                    role: "system", 
                    content: `You are an English → Turkish dictionary.
If input is not English, return {"error":"Please enter an English word only."}
Otherwise return ONLY this JSON:
{
  "turkish": "Turkish meaning(s)",
  "sentence": "Natural English example sentence (always different)"
}`
                },
                { role: "user", content: word }
            ]
        });
        const result = JSON.parse(completion.choices[0].message.content.trim());
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Translate error" });
    }
});

app.post('/api/quiz', async (req, res) => {
    const { subject } = req.body;

    const topic = subject === 'vocabulary' 
        ? "intermediate to upper-intermediate English vocabulary" 
        : "English verb tenses and correct usage";

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 1.3,
            messages: [
                { 
                    role: "system", 
                    content: `Generate exactly 10 questions in this EXACT JSON format (nothing else):
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A. text", "B. text", "C. text", "D. text"],
      "answer": "one of them. choose answer randomly!"
    }
  ]
}
MANDATORY RULE: Correct answers MUST be perfectly balanced → exactly 2-3 of each letter.
You MUST use this distribution pattern or similar: A,B,B,D,B,C,A,C,A,D
Never put 2 or more of the same letter. Do not ignore this rule!`
                },
                { 
                    role: "user", 
                    content: `Generate 10 questions about ${topic}. Strictly follow the balance rule.`
                }
            ]
        });

        const result = JSON.parse(completion.choices[0].message.content.trim());
        res.json(result.questions);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Quiz error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
