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
      hook: "Write a viral TikTok hook.",
      story: "Write a cinematic short story narration.",
      motivational: "Write a hype motivational speech.",
      hype: "Write an aggressive high-energy script.",
      soft: "Write a soft-spoken comforting narration.",
      facts: "Write a list of fast facts.",
      listicle: "Write 5 items (#1–#5).",
      top3: "Write a Top 3 countdown.",
      anime: "Write in anime narrator style.",
    };

    const lengths = {
      short: "6–10 seconds",
      medium: "12–18 seconds",
      long: "20–28 seconds",
    };

    const prompt = `
Return ONLY JSON:
{ "script": "", "title": "", "hashtags": "" }

Niche: ${niche}
Tone: ${tone}
Format: ${format}
Length: ${lengths[length]}
Instructions: ${formats[format]}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    let raw = response.choices[0].message.content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    res.json(JSON.parse(raw));

  } catch (err) {
    console.error("Script Error:", err);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

/* -----------------------------------------
   GENERATE VIDEO (NO FFMPEG)
----------------------------------------- */
app.post("/generate-video", async (req, res) => {
  try {
    const { script } = req.body;

    if (!script || !script.trim()) {
      return res.status(400).json({ error: "Script is required" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const result = await client.videos.generate({
      model: "gpt-4o-mini-wav",
      prompt: script,
      size: "1080x1920",
      duration: "short",
      format: "mp4",
    });

    // Convert base64 video → buffer
    const buffer = Buffer.from(result.video, "base64");

    // Send MP4 file
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
app.listen(5000, () => console.log("Backend running on port 5000 🚀"));
