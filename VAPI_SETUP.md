# Vapi.ai Setup

To connect SupportGenie to a real phone number using Vapi.ai:

1. Sign up at [Vapi.ai](https://vapi.ai/).
2. Create an Assistant.
3. In the Assistant settings, configure the **Server URL** to point to your Render backend webhook endpoint:
   `https://<your-render-url>/voice/webhook`
4. Set the **Model** to be external or configure the custom webhook to handle all conversation logic.
5. Provide a phone number in Vapi.
6. When a user calls the Vapi phone number, Vapi will transcribe the speech and send a POST request to your `/voice/webhook`.
7. Your FastAPI backend will classify intent, perform RAG, run tools, and respond with the exact text Vapi should speak back to the user.
