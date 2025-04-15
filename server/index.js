import express from "express"
import cors from "cors"
import { Groq } from "groq-sdk"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.post("/api/summarize", async (req, res) => {
  try {
    const { text } = req.body

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No text provided" })
    }

    // Initialize the Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Generate a summary using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert summarizer. Your task is to create a concise, well-structured summary of the provided text. Focus on the main ideas, key points, and important details. Organize the summary with clear sections if appropriate. The summary should be comprehensive yet concise.",
        },
        {
          role: "user",
          content: `Please summarize the following text: \n\n${text}`,
        },
      ],
      model: "llama3-70b-8192",
      temperature: 0.3,
      max_tokens: 1024,
    })

    const summary = completion.choices[0].message.content

    return res.status(200).json({ summary })
  } catch (error) {
    console.error("Error generating summary:", error)
    return res.status(500).json({ error: "Failed to generate summary" })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
