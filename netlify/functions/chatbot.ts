// netlify/functions/chatbot.ts
import type { Handler } from '@netlify/functions'
import profile from './profile.json'

export const handler: Handler = async (event: { body: any }) => {
  try {
    // 1) Parse incoming request body
    const { message } = JSON.parse(event.body ?? '{}') as {
      message?: string
    }
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    // 2) Provide an instruction for fallback
    const fallbackSignal = 'NO_PROFILE_INFO'

    // 3) Create a prompt with the profile data and instruct how to respond if out of scope
    const prompt = `
      You are an AI assistant with exclusive access to the following professional profile in JSON format:

      ${JSON.stringify(profile, null, 2)}

      Your goal is to answer the user's question based solely on the information in this profile, emphasizing the individual’s accomplishments, expertise, and uniqueness in a highly recommendable way. If the user's question cannot be answered using the provided information, respond exactly with "${fallbackSignal}" (without quotes).

      User asked: "${message}"
      AI:
      `

    // 4) Make the request to Gemini's API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    const data = await response.json()

    // 5) Extract the reply text
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I couldn't retrieve a valid response. Please try again."

    // 6) Check if the model used the fallback phrase
    if (replyText.trim() === fallbackSignal) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          reply: "Sorry, I don't have that information in my database.",
        }),
      }
    }

    // 7) Otherwise, return the normal reply
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ reply: replyText }),
    }
  } catch (error) {
    // 8) Fallback if an error occurs
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        reply: 'Oops! Something went wrong. Please try again later.',
      }),
    }
  }
}
