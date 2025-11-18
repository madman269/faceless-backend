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
  res.json({ message: "Faceless Factory API running (No-FFmpeg Mode) 🚀" });
});

/* -----------------------------------------
   GENERATE SCRIPT ROUTE
----------------------------------------- */
app.post("/generate-script", async (req, res) => {
  const { niche, tone, format, length } = req.body;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const lengths = {
      short: "6–10 seconds, 1–3 lines.",
      medium: "12–18 seconds, 3–6 lines.",
      long: "20–28 seconds, 6–10 lines.",
    };

    const formatPrompt = formats[format] || "";
    const lengthPrompt = lengths[length] || "15–20 seconds.";

    const finalPrompt = `
Return ONLY valid JSON. No backticks. No markdown. No explanations.

{
  "script": "string",
  "title": "string",
  "hashtags": "string"
}

Niche: ${niche}
Tone: ${tone}
Format: ${format}
Length: ${lengthPrompt}
Format Instructions: ${formatPrompt}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.85,
      max_tokens: 600,
    });

    let raw = response.choices[0].message.content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let json;
    try {
      json = JSON.parse(raw);
    } catch (err) {
      console.error("RAW JSON ERROR:", raw);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw,
      });
    }

    res.json({
      script: json.script || "",
      title: json.title || "",
      hashtags: json.hashtags || "",
    });

  } catch (error) {
    console.error("Script Error:", error);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

/* -----------------------------------------
   GENERATE VIDEO (OPENAI BUILT-IN VIDEO)
----------------------------------------- */
app.post("/generate-video", async (req, res) => {
  try {
    const { script } = req.body;

    if (!script || !script.trim()) {
      return res.status(400).json({ error: "Script is required" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await client.videos.generate({
      model: "gpt-4.1-video",
      prompt: script,
      size: "1080x1920",
      duration: "short",
      format: "mp4",
    });

    const buffer = Buffer.from(result.video, "base64");

    res.setHeader("Content-Type", "video/mp4");
    res.send(buffer);

  } catch (err) {
    console.error("Video Error:", err);
    res.status(500).json({ error: "Video generation failed" });
  }
});

/* -----------------------------------------
   START SERVER
----------------------------------------- */
app.listen(5000, () =>
  console.log("Backend running on port 5000 🚀 (No-FFmpeg Mode)")
);
