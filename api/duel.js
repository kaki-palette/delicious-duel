import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function (req, res) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { response_mime_type: "application/json" }
    });

    const prompt = `料理名:${req.body.foodName}, コメント:${req.body.comment} を元に、rarity(UR,SR,R,N), attack, defense, taste(各0-9999), praiseText(140字以上の情熱的な紹介)をJSONで返して。`;

    try {
        const image = { inlineData: { data: req.body.imageBase64.split(',')[1], mimeType: "image/jpeg" } };
        const result = await model.generateContent([prompt, image]);
        res.json(JSON.parse(result.response.text()));
    } catch (e) {
        res.status(500).json({ error: "分析失敗" });
    }
}
