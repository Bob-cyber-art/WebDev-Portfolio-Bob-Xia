const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const detailButtons = document.querySelectorAll("[data-toggle]");
const modalOpenButtons = document.querySelectorAll("[data-modal-open]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
const contactForm = document.querySelector("#contact-form");
const formMessage = document.querySelector("#form-message");
const backToTop = document.querySelector(".back-to-top");
const chatbotForm = document.querySelector("#chatbot-form");
const chatbotInput = document.querySelector("#chatbot-input");
const chatbotMessages = document.querySelector("#chatbot-messages");
const chatbotStatus = document.querySelector("#chatbot-status");
const chatHistory = [];

if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

detailButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-toggle");
        const detail = document.getElementById(targetId);

        if (!detail) {
            return;
        }

        const isVisible = detail.classList.toggle("is-visible");
        button.textContent = isVisible ? "Hide details" : "More details";
    });
});

modalOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const modalId = button.getAttribute("data-modal-open");
        const modal = document.getElementById(modalId);

        if (modal) {
            modal.hidden = false;
        }
    });
});

modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const modal = button.closest(".modal");

        if (modal) {
            modal.hidden = true;
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal").forEach((modal) => {
            modal.hidden = true;
        });
    }
});

if (contactForm && formMessage) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = contactForm.name.value.trim();
        const email = contactForm.email.value.trim();
        const message = contactForm.message.value.trim();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name || !email || !message) {
            formMessage.textContent = "Please complete all fields before sending.";
            formMessage.style.color = "#ffd166";
            return;
        }

        if (!emailPattern.test(email)) {
            formMessage.textContent = "Please enter a valid email address.";
            formMessage.style.color = "#ffd166";
            return;
        }

        formMessage.textContent = "Thank you. Your message has been checked successfully.";
        formMessage.style.color = "#62e6a4";
        contactForm.reset();
    });
}

if (backToTop) {
    window.addEventListener("scroll", () => {
        backToTop.classList.toggle("is-visible", window.scrollY > 420);
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

function addChatMessage(content, type) {
    if (!chatbotMessages) {
        return null;
    }

    const message = document.createElement("p");
    message.className = `chat-message ${type}-message`;
    message.textContent = content;
    chatbotMessages.appendChild(message);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return message;
}

function setChatbotStatus(text, isError = false) {
    if (!chatbotStatus) {
        return;
    }

    chatbotStatus.textContent = text;
    chatbotStatus.style.background = isError ? "var(--yellow)" : "var(--green)";
}

if (chatbotForm && chatbotInput && chatbotMessages) {
    chatbotForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const userMessage = chatbotInput.value.trim();

        if (!userMessage) {
            return;
        }

        addChatMessage(userMessage, "user");
        chatHistory.push({ role: "user", content: userMessage });
        chatbotInput.value = "";
        chatbotInput.disabled = true;
        chatbotForm.querySelector("button").disabled = true;
        setChatbotStatus("Thinking");

        const loadingMessage = addChatMessage("Thinking...", "bot");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: chatHistory
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "The AI assistant is unavailable right now.");
            }

            const reply = data.reply || "I could not generate a response. Please try again.";

            if (loadingMessage) {
                loadingMessage.textContent = reply;
            }

            chatHistory.push({ role: "assistant", content: reply });
            setChatbotStatus("Ready");
        } catch (error) {
            const errorMessage = error.message || "The AI assistant is unavailable right now.";

            if (loadingMessage) {
                loadingMessage.textContent = errorMessage;
            }

            setChatbotStatus("Offline", true);
        } finally {
            chatbotInput.disabled = false;
            chatbotForm.querySelector("button").disabled = false;
            chatbotInput.focus();
        }
    });
}
