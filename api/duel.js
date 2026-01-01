import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function (req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 最新のモデル指定方法に変更
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash"
    });

    const prompt = `あなたは美食鑑定AIです。料理名「${req.body.foodName}」と美食ポイント「${req.body.comment}」を解析してください。
    【出力形式】以下のJSON形式のみで回答。
    {
      "rarity": "UR, SR, R, Nのいずれか。熱量が高いならUR",
      "attack": 0-9999,
      "defense": 0-9999,
      "taste": 0-9999,
      "praiseText": "140文字〜180文字の情熱的な紹介。ハッシュタグ付き"
    }`;

    try {
        const image = {
            inlineData: {
                data: req.body.imageBase64.split(',')[1],
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, image]);
        const responseText = result.response.text().replace(/```json|```/g, "").trim();
        res.status(200).json(JSON.parse(responseText));
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: error.message });
    }
}
