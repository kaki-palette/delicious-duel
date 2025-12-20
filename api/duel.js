// api/duel.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS設定（外部からのアクセス許可）[cite: 38]
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, comment, foodName } = req.body;

    // Gemini APIの初期化
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 画像認識に強く高速な Flash モデルを使用 [cite: 3]
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // プロンプトエンジニアリング: 料理の熱量と見た目をスコアリング [cite: 5, 18, 19]
    const prompt = `
      あなたは美食の審査員です。ユーザーがアップロードした料理画像と、その料理に対する熱意あるコメントを分析し、
      トレーディングカードゲームのステータスを生成してください。

      # 入力情報
      - 料理名: ${foodName}
      - ユーザーの熱意コメント: ${comment}

      # 分析ルール
      1. 画像の「見た目（彩り・盛り付け）」と、コメントの「熱量（ポジティブ度）」を総合的に評価してください。
      2. レアリティ(rarity)は、評価が高い順に 'UR', 'SR', 'R', 'N' のいずれかを選んでください。
         - 画像が非常に美味しそうで、コメントも情熱的であれば高確率でUR/SRにしてください。[cite: 6, 22]
      3. ステータス(attack, defense, taste)は0〜9999の数値で出力してください。おいしさ(taste)は特に重要視してください。
      4. 鑑定文(praiseText)は、140文字以内で、非常にテンションが高く、情熱的な文章にしてください。[cite: 26]

      # 出力フォーマット (JSONのみ)
      {
        "rarity": "SR",
        "attack": 5000,
        "defense": 4000,
        "taste": 8000,
        "praiseText": "まさに奇跡の具現化！..."
      }
    `;

    // 画像データの準備
    const imagePart = {
      inlineData: {
        data: imageBase64.split(',')[1], // Base64ヘッダー除去
        mimeType: "image/jpeg",
      },
    };

    // AIに生成リクエスト
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text();

    // JSON部分だけ抽出（Markdown記法が含まれる場合への対策）
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    res.status(200).json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI判定に失敗しました' });
  }
}
