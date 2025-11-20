import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateInitialEmails = async (userName: string = "المستخدم"): Promise<any[]> => {
  if (!apiKey) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 realistic fake emails in Arabic for a user named "${userName}". 
      Include a mix of professional, promotional, and social emails relevant to a new account.
      Return a JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              senderName: { type: Type.STRING },
              senderEmail: { type: Type.STRING },
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
              dateOffset: { type: Type.INTEGER, description: "Hours ago, between 1 and 48" }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate initial emails:", error);
    return [];
  }
};

export const draftEmailContent = async (prompt: string, context?: string): Promise<string> => {
  if (!apiKey) return "عذراً، مفتاح API غير متوفر.";

  try {
    let fullPrompt = `أنت مساعد ذكي في تطبيق بريد إلكتروني يدعى Jomail.
    اكتب محتوى رسالة بريد إلكتروني باللغة العربية بناءً على الطلب التالي: "${prompt}".
    اجعل النبرة احترافية وواضحة. لا تضع موضوع الرسالة، فقط نص الرسالة.`;

    if (context) {
      fullPrompt += `\n\nسياق الرسالة السابقة (للرد): ${context}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Failed to draft email:", error);
    return "حدث خطأ أثناء إنشاء النص. يرجى المحاولة مرة أخرى.";
  }
};

export const summarizeEmail = async (emailBody: string): Promise<string> => {
  if (!apiKey) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `لخص محتوى هذا البريد الإلكتروني في جملة واحدة أو جملتين باللغة العربية:\n\n${emailBody}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Summarization failed", error);
    return "";
  }
};

// --- JO TASK AI FUNCTIONS ---

export const generateTaskDescription = async (taskTitle: string, department: string): Promise<string> => {
  if (!apiKey) return "";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `أنت مساعد مدير مشاريع محترف. قم بكتابة وصف تفصيلي ومهني لمهمة بعنوان: "${taskTitle}" لقسم "${department}".
      اجعل الوصف على شكل نقاط واضحة (Bullet points) تحدد المطلوب بدقة. باللغة العربية.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Task generation failed", error);
    return "";
  }
};

export const refineTaskFeedback = async (rawFeedback: string): Promise<string> => {
  if (!apiKey) return rawFeedback;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `أعد صياغة ملاحظات المدير هذه لتكون أكثر احترافية، بناءة، وتشجيعية للموظف، مع الحفاظ على جوهر النقد المطلوب:
      "${rawFeedback}"
      باللغة العربية.`,
    });
    return response.text || rawFeedback;
  } catch (error) {
    return rawFeedback;
  }
};
