import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

/* -----------------------------------------
   FFmpeg (Render uses system ffmpeg)
----------------------------------------- */
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

/* -----------------------------------------
   FILE PATHS
----------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_DIR = path.join(__dirname, "videos");
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR);

const BG_DIR = path.join(__dirname, "assets", "backgrounds");

/* -----------------------------------------
   TEST ROUTE
----------------------------------------- */
app.get("/", (req, res) => {
  res.json({ message: "Faceless Factory API running (FFmpeg Mode) 🎥🔥" });
});

/* -----------------------------------------
   SCRIPT GENERATION
----------------------------------------- */
app.post("/generate-script", async (req, res) => {
  const { niche, tone, format, length } = req.body;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const formats = {
      hook: "Write a viral TikTok hook. 1–2 punchy lines.",
      story: "Write a cinematic short story narration.",
      motivational: "Write a hype motivational speech.",
      hype: "Write an aggressive high-energy script.",
      soft: "Write a soft-spoken comforting narration.",
      facts: "Write a list of rapid-fire facts.",
      listicle: "Write a 5-item list (#1–#5).",
      top3: "Write a Top 3 countdown.",
      anime: "Write in anime narrator style.",
    };

    const lengths = {
      short: "6–10 seconds",
      medium: "12–18 seconds",
      long: "20–28 seconds",
    };

    const finalPrompt = `
Return ONLY JSON:
{
 "script": "",
 "title": "",
 "hashtags": ""
}

Niche: ${niche}
Tone: ${tone}
Format Instructions: ${formats[format]}
Length: ${lengths[length]}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.85,
    });

    let raw = response.choices[0].message.content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(raw);

    res.json(json);
  } catch (err) {
    console.error("Script Error:", err);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

/* -----------------------------------------
   VIDEO GENERATION (FFmpeg Render)
----------------------------------------- */
app.post("/generate-video", async (req, res) => {
  try {
    const { script } = req.body;

    if (!script || !script.trim()) {
      return res.status(400).json({ error: "Script is required" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1) Generate Voice
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: script,
    });

    const audioPath = path.join(VIDEOS_DIR, `speech_${Date.now()}.mp3`);
    fs.writeFileSync(audioPath, Buffer.from(await speech.arrayBuffer()));

    // 2) Background
    const bgPath = path.join(BG_DIR, "gradient.png");

    // 3) Output file
    const videoPath = path.join(VIDEOS_DIR, `video_${Date.now()}.mp4`);

    // 4) FFmpeg Render
    ffmpeg()
      .addInput(bgPath)
      .loop(10)
      .addInput(audioPath)
      .outputOptions([
        "-map 0:v",
        "-map 1:a",
        "-shortest"
      ])
      .save(videoPath)
      .on("end", () => {
        console.log("Video rendered:", videoPath);
        res.sendFile(videoPath);
      })
      .on("error", (err) => {
        console.error("FFmpeg ERROR:", err);
        res.status(500).json({ error: "FFmpeg processing failed" });
      });

  } catch (err) {
    console.error("Video Error:", err);
    res.status(500).json({ error: "Video generation failed" });
  }
});

/* -----------------------------------------
   START SERVER
----------------------------------------- */
app.listen(5000, () =>
  console.log("Backend running on port 5000 🚀 (FFmpeg Mode)")
);
