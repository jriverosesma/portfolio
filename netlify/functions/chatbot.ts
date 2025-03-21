// netlify/functions/chatbot.ts
import type { Handler } from '@netlify/functions'
import profile from './profile.json'

// If you have a known shape for profile.json, you could create an interface:
// interface Profile {
//   name: string
//   headline: string
//   experience: Array<{
//     // define shape of experience
//   }>
//   skills: string[]
//   education: string
//   summary: string
// }
// Then do:
// import profileData from './profile.json' assert { type: 'json' } as Profile

export const handler: Handler = async (event: { body: any }) => {
  try {
    // 1) Parse incoming request body
    const { message } = JSON.parse(event.body ?? '{}') as {
      message?: string
    }
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY

    // 2) Provide an instruction for fallback
    const fallbackSignal = 'NO_PROFILE_INFO'

    // 3) Create a prompt with LinkedIn data and instruct how to respond if out of scope
    const prompt = `
You are an AI assistant that answers questions based on this LinkedIn profile:

Name: ${profile.name}
Headline: ${profile.headline}
Experience: ${JSON.stringify(profile.experience, null, 2)}
Skills: ${profile.skills.join(', ')}
Education: ${profile.education}

If the user's question cannot be answered using the above info,
respond exactly with "${fallbackSignal}" (without quotes).

User asked: "${message}"
AI:`

    // 4) Make the request to Gemini 2.0 Flash
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
      "I couldn't retrieve a valid response."

    // 6) Check if the model used the fallback phrase
    if (replyText.trim() === fallbackSignal) {
      // Custom fallback message for out-of-scope questions
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          reply: "Sorry, I don't have that information in my profile.",
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
      statusCode: 200, // You could use 500 if you prefer
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        reply: 'Oops! Something went wrong. Please try again later.',
      }),
    }
  }
}
