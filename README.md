# WebDev-Portfolio-Bob-Xia
interesting things already connect to the web

## Run with AI chat

The AI chatbot uses a small local Node server so the API key stays outside the browser code.

PowerShell:

```powershell
$env:AI_API_KEY="your_api_key_here"
npm start
```

Then open:

```text
http://localhost:3000
```

Optional settings:

```powershell
$env:AI_API_URL="https://api.deepseek.com/chat/completions"
$env:AI_MODEL="deepseek-chat"
```
