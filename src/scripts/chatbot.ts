const chatForm = document.getElementById('chat-form') as HTMLFormElement | null
const chatResponse = document.getElementById(
  'chat-response',
) as HTMLDivElement | null
const sendButton = document.querySelector(
  '.chat-submit',
) as HTMLButtonElement | null
const textarea = document.querySelector(
  '#message',
) as HTMLTextAreaElement | null

if (!chatForm || !chatResponse || !sendButton || !textarea) {
  console.error('Missing required chat elements')
}

function typeText(
  element: HTMLElement,
  text: string,
  onComplete?: () => void,
): void {
  element.textContent = ''
  let index = 0
  const speed = 1
  const intervalId = setInterval(() => {
    element.textContent += text.charAt(index)
    index++
    if (index >= text.length) {
      clearInterval(intervalId)
      onComplete && onComplete()
    }
  }, speed)
}

async function handleSubmit() {
  if (!sendButton || !textarea || !chatResponse) return

  const message = textarea.value.trim()
  if (!message) return

  sendButton.disabled = true
  chatResponse.textContent = '...'

  try {
    const res = await fetch('/.netlify/functions/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    const data = await res.json()
    typeText(chatResponse, data.reply, () => {
      sendButton.disabled = false
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    chatResponse.textContent = 'Error: ' + msg
    sendButton.disabled = false
  }

  textarea.value = ''
}

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault()
  await handleSubmit()
})

textarea?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
})
