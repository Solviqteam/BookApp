import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "openrouter/owl-alpha";

export async function POST(request) {
  try {
    const { type, book, history } = await request.json();

    if (type === "insights") {
      const prompt = "You are a book insight engine. The user wants to understand the book: " + book + ". Return ONLY a valid JSON object with NO markdown fences, NO extra text. Use this exact structure: {\"title\": \"Full book title and author\", \"overview\": \"2-3 sentence description\", \"mindset\": \"Core mental shift 2-3 sentences\", \"ideas\": [{\"title\": \"Idea 1\", \"body\": \"2-3 sentences\"}, {\"title\": \"Idea 2\", \"body\": \"2-3 sentences\"}, {\"title\": \"Idea 3\", \"body\": \"2-3 sentences\"}, {\"title\": \"Idea 4\", \"body\": \"2-3 sentences\"}, {\"title\": \"Idea 5\", \"body\": \"2-3 sentences\"}], \"actions\": [\"Action 1\", \"Action 2\", \"Action 3\"], \"followup_chips\": [\"Question 1?\", \"Question 2?\", \"Question 3?\"]}. If not recognizable return {\"error\": \"Book not found\"}.";
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      });
      const text = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      return Response.json(parsed);
    }

    if (type === "chat") {
      const msgs = history.map(m => ({ role: m.role, content: m.content }));
      msgs.unshift({ role: "system", content: "You are an expert on the book " + book + ". Answer clearly and concisely under 150 words. Pay attention to what the user shares about their life and goals." });
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: msgs,
      });
      return Response.json({ reply: completion.choices[0].message.content.trim() });
    }

    if (type === "insights_from_chat") {
      const convo = history.map(m => m.role + ": " + m.content).join("\n");
      const prompt = "Based on this conversation about the book \"" + book + "\", generate 2-4 short personal insight notes for the user. These should be specific to what the user shared about their life and goals. Each note should be one sentence, personal and actionable. Return ONLY valid JSON: {\"notes\": [\"insight 1\", \"insight 2\", \"insight 3\"]}. Conversation: " + convo;
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      });
      const text = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      return Response.json(parsed);
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}