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
Return ONLY valid JSON. No backticks. No markdown. No explanations.

{
  "script": "string",
  "title": "string",
  "hashtags": "string"
}

Fill in the values based on this:

Niche: ${niche}
Tone: ${tone}
Format: ${format}
Length: ${lengthPrompt}
Format Instructions: ${formatPrompt}
`;

    /* ----- OPENAI REQUEST ----- */
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.85,
      max_tokens: 600,
    });

    /* -------- SAFE JSON PARSING -------- */
    let raw = response.choices[0].message.content;

    // REMOVE CODE FENCES
    raw = raw.replace(/```json/gi, "");
    raw = raw.replace(/```/g, "");
    raw = raw.trim();

    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error("SAFE JSON PARSE ERROR:", err);
      console.error("RAW OUTPUT:", raw);
      return res.status(500).json({
        error: "Invalid AI JSON response",
        raw,
      });
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
