document.addEventListener("DOMContentLoaded", () => {
    const botIcon = document.getElementById("bot-icon");
    const botChat = document.getElementById("bot-chat");
    const closeBot = document.getElementById("close-bot");
    const sendMessage = document.getElementById("send-message");
    const userMessageInput = document.getElementById("user-message");
    const botMessages = document.getElementById("bot-messages");

    let botActive = false;

    // 🟢 Ensure Chatbox Opens and Closes Properly
    botIcon.addEventListener("click", () => {
        botChat.classList.toggle("show");
        botActive = botChat.classList.contains("show");
    });

    closeBot.addEventListener("click", () => {
        botChat.classList.remove("show");
        botActive = false;
    });

    // 🟢 Click Anywhere Outside to Close
    document.addEventListener("click", (event) => {
        if (botActive && !botChat.contains(event.target) && event.target !== botIcon) {
            botChat.classList.remove("show");
            botActive = false;
        }
    });

    // 🟢 Handle Sending Messages
    sendMessage.addEventListener("click", sendUserMessage);
    userMessageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent default form submission
            sendUserMessage();
        }
    });

    async function sendUserMessage() {
        const userMessage = userMessageInput.value.trim();
        if (!userMessage) return;

        appendMessage(userMessage, ["user-text"]); // ✅ Show User Message
        userMessageInput.value = "";

        const typingIndicator = appendMessage("Typing...", ["bot-text", "typing"]); // ✅ Correct class formatting

        try {
            const botResponse = await getAIResponse(userMessage);
            typingIndicator.remove(); // ✅ Remove typing effect when response arrives
            appendMessage(botResponse, ["bot-text"]);
        } catch (error) {
            console.error("❌ Error:", error);
            typingIndicator.remove();
            appendMessage("Something went wrong, please try again.", ["bot-text", "error-text"]);
        }
    }

    function appendMessage(message, classNames = []) {
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        classNames.forEach(className => messageElement.classList.add(className)); // ✅ Add multiple classes correctly
        botMessages.appendChild(messageElement);
        botMessages.scrollTop = botMessages.scrollHeight;
        return messageElement; // ✅ Return the element for potential removal (e.g., "Typing..." effect)
    }

    async function getAIResponse(userMessage) {
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userMessage }) //send userId then personalize..
            });

            if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

            const data = await response.json();
            console.log("🟢 AI Response:", data); // ✅ Log full response for debugging

            return data.response || "I'm not sure, could you clarify? 🤔";
        } catch (error) {
            console.error("❌ Failed to fetch AI response:", error);
            return "Something went wrong, please try again.";
        }
    }
});
