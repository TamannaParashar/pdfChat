import { Groq } from "groq-sdk"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

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
}
