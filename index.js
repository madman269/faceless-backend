import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

/* -----------------------------------------
   TEST ROUTE
----------------------------------------- */
app.get("/", (req, res) => {
  res.json({ message: "Faceless Factory API is running 🚀" });
});

/* -----------------------------------------
   MAIN COMBINED CONTENT GENERATOR
   (Script + Title + Hashtags)
----------------------------------------- */
app.post("/generate-script", async (req, res) => {
  const { niche, tone, format, length } = req.body;

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    /* ----- FORMAT OPTIONS ----- */
    const formats = {
      hook: "Write a viral TikTok hook. 1–2 punchy lines.",
      story: "Write a cinematic short story narration with a beginning and climax.",
      motivational: "Write a hype motivational speech with emotional pacing.",
      hype: "Write an aggressive high-energy script.",
      soft: "Write a soft-spoken comforting narration.",
      facts: "Write a list of rapid-fire facts.",
      listicle: "Write a 5-item list (#1–#5).",
      top3: "Write a Top 3 countdown.",
      anime: "Write in anime narrator style. Dramatic, spiritual, epic.",
    };

    /* ----- LENGTH OPTIONS ----- */
    const lengths = {
      short: "6–10 seconds, 1–3 lines.",
      medium: "12–18 seconds, 3–6 lines.",
      long: "20–28 seconds, 6–10 lines.",
    };

    const formatPrompt = formats[format] || "";
    const lengthPrompt = lengths[length] || "15–20 seconds.";

    /* ----- SUPER PROMPT (JSON ONLY) ----- */
    const finalPrompt = `
You are a viral short-form content generator for TikTok, YouTube Shorts, and Reels.

Generate the following in **JSON format ONLY**:

1. "script" → The main script.
   - No emojis
   - Each sentence on its own line
   - Very punchy and engaging
   - Based on the niche, tone, format, and length

2. "title" → A viral 30–50 character title.
   - No emojis
   - Super clickable

3. "hashtags" → 6–10 hashtags separated by spaces.
   - No emojis
   - Relevant to the script & niche

CONTENT DETAILS:
Niche: ${niche}
Tone: ${tone}
Format: ${format}
Length: ${lengthPrompt}
Format Instructions: ${formatPrompt}

Return ONLY valid JSON. No explanations.
`;

    /* ----- OPENAI REQUEST ----- */
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.85,
      max_tokens: 500,
    });

    /* ----- PARSE JSON SAFELY ----- */
    let json;
    try {
      json = JSON.parse(response.choices[0].message.content);
    } catch (err) {
      console.error("JSON Parse Error:", err);
      return res.status(500).json({ error: "Invalid AI JSON response" });
    }

    res.json({
      script: json.script || "",
      title: json.title || "",
      hashtags: json.hashtags || "",
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

/* -----------------------------------------
   START SERVER
----------------------------------------- */
app.listen(5000, () => console.log("Backend running on port 5000"));
