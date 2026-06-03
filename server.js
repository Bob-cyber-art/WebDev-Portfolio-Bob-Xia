const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const SITE_DIR = path.join(__dirname, "index.html");
const API_KEY = process.env.AI_API_KEY;
const API_URL = process.env.AI_API_URL || "https://api.deepseek.com/chat/completions";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml; charset=utf-8",
    ".ico": "image/x-icon"
};

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(payload));
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";

        request.on("data", (chunk) => {
            body += chunk;

            if (body.length > 10000) {
                reject(new Error("Request body is too large."));
                request.destroy();
            }
        });

        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

async function handleChat(request, response) {
    if (!API_KEY) {
        sendJson(response, 500, {
            error: "AI_API_KEY is not configured on the server."
        });
        return;
    }

    try {
        const body = await readBody(request);
        const parsed = JSON.parse(body || "{}");
        const messages = Array.isArray(parsed.messages) ? parsed.messages : [];

        const safeMessages = messages
            .filter((message) => message && typeof message.content === "string")
            .slice(-8)
            .map((message) => ({
                role: message.role === "assistant" ? "assistant" : "user",
                content: message.content.slice(0, 1200)
            }));

        if (safeMessages.length === 0) {
            sendJson(response, 400, { error: "Please send a message first." });
            return;
        }

        const aiResponse = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are Bob Xia's friendly portfolio assistant. Answer clearly and briefly. Help visitors learn about Bob's web development portfolio, projects, hobbies, and contact options. If you do not know something, say so."
                    },
                    ...safeMessages
                ],
                temperature: 0.7
            })
        });

        const data = await aiResponse.json().catch(() => ({}));

        if (!aiResponse.ok) {
            sendJson(response, aiResponse.status, {
                error: data.error?.message || "The AI service returned an error."
            });
            return;
        }

        const reply = data.choices?.[0]?.message?.content?.trim();
        sendJson(response, 200, {
            reply: reply || "I could not generate a response. Please try again."
        });
    } catch (error) {
        sendJson(response, 500, {
            error: error.message || "The chat request failed."
        });
    }
}

function serveStatic(request, response) {
    const urlPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = path.normalize(path.join(SITE_DIR, cleanPath));

    if (!filePath.startsWith(SITE_DIR)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            response.end("Not found");
            return;
        }

        response.writeHead(200, {
            "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
        });
        response.end(content);
    });
}

const server = http.createServer((request, response) => {
    if (request.url === "/api/chat" && request.method === "POST") {
        handleChat(request, response);
        return;
    }

    if (request.method === "GET") {
        serveStatic(request, response);
        return;
    }

    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed");
});

server.listen(PORT, () => {
    console.log(`Portfolio server running at http://localhost:${PORT}`);
});
