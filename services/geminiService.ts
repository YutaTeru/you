
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { NUM_QUESTIONS } from '../constants';
import type { QuizQuestion, ResultContent } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const quizQuestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "クイズの問題文。会話形式の場合はAとBの発言を含めること。空欄は ( ) で表現すること。"
      },
      choices: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "4つの選択肢 (正解1つ、不正解3つ)"
      },
      answer: {
        type: Type.STRING,
        description: "正解の選択肢の文字列"
      },
      explanation: {
        type: Type.STRING,
        description: "正解の単語の意味と、なぜそれが正解になるのかを日本語で簡潔に解説"
      },
      image_prompt: {
        type: Type.STRING,
        description: "質問内容を表現する、画像生成AI用の高品質な英語のプロンプト"
      },
    },
    required: ["question", "choices", "answer", "explanation", "image_prompt"],
  },
};

const resultSchema = {
    type: Type.OBJECT,
    properties: {
        rank: {
            type: Type.STRING,
            description: "スコアに基づいたランク名（例：英語ルーキー、ボキャブラリーマスター）"
        },
        message: {
            type: Type.STRING,
            description: "スコアに基づいた、学習を応援するポジティブなメッセージ"
        }
    },
    required: ["rank", "message"],
};

export async function generateQuizQuestions(): Promise<QuizQuestion[]> {
  try {
    const userQuestions = `
    問題1:
    A: Thanks for showing me the outline of your sales presentation. It's good, but it's a bit ( ) in some places.
    B: I guess I do repeat some information too much. I'll try to take some of it out.
    選択肢: 1 decisive, 2 subjective, 3 redundant, 4 distinct
    正解: 3 redundant

    問題2:
    Lisa went to the interview even though she thought there was a low ( ) of her getting the job. As she expected, she was not hired.
    選択肢: 1 restoration, 2 credibility, 3 contention, 4 probability
    正解: 4 probability

    問題3:
    It is sadly ( ) that, in developing countries, many of the farmers who grow nutritious crops for export do not have enough food to feed their own families.
    選択肢: 1 indefinite, 2 ironic, 3 restless, 4 superficial
    正解: 2 ironic
    `;

    const prompt = `日本の英語学習者向けに、以下の3つの英検風の問題をJSON形式のクイズに変換してください。

    ${userQuestions}

    各問題に対して、スキーマに定義されたキーを持つJSONオブジェクトを生成してください。
    最終的な出力は、これら3つの問題のJSONオブジェクトを含む配列にしてください。マークダウンは使用しないでください。`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: quizQuestionSchema,
      },
    });

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText) as QuizQuestion[];

    if (!Array.isArray(quizData) || quizData.length !== NUM_QUESTIONS) {
        throw new Error("Failed to parse quiz data from API response.");
    }
    
    return quizData.map(q => ({...q, choices: q.choices.sort(() => Math.random() - 0.5)}));

  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("クイズの生成に失敗しました。もう一度お試しください。");
  }
}

export async function generateQuizImage(prompt: string): Promise<string> {
  try {
    const fullPrompt = `${prompt}, photorealistic style, high detail, cinematic lighting, professional photography`;
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("Image generation failed, no image bytes returned.");
    }
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error('Error generating image:', error);
    // Return a placeholder image on failure
    return 'https://picsum.photos/800/450?grayscale';
  }
}

export async function generateResultMessage(score: number, total: number): Promise<ResultContent> {
    try {
        const prompt = `ユーザーが英語クイズを終えました。スコアは${total}問中${score}問正解でした。このスコアに基づいて、短くて楽しく、励みになるようなランク名と、少し長めのメッセージを提供してください。口調はポジティブで、学習を応援するものにしてください。`;
        
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: resultSchema,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ResultContent;

    } catch (error) {
        console.error("Error generating result message:", error);
        return {
            rank: "英語チャレンジャー",
            message: "お疲れ様でした！続けて学習すれば、必ずもっと良い結果が出ますよ！",
        };
    }
}