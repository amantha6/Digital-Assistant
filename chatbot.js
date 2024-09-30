document.addEventListener("DOMContentLoaded", function () {
    let chatbotName = "Digital Assistant";
    let chatLog = document.getElementById("chat-log");
    let sendBtn = document.getElementById("send-btn");
    let userInput = document.querySelector(".user-input");
    let apiKey = "Your API key"; 
    let apiUrl = "https://api.openai.com/v1/chat/completions";
    let clearBtn = document.getElementById("clear-btn");
    const readCurrentMessage = document.getElementById("message-reader-btn");
    const readAllMessages = document.getElementById("conversation-reader-btn");
    const voiceInputButton = document.getElementById("voice-btn");

    // Set the chatbot name and welcome message
    function setChatBotName() {
        document.querySelector(".chatbot-name").textContent = chatbotName;
        document.title = chatbotName;
        showWelcomeMessage(chatbotName);
    }

    // Show the welcome message
    function showWelcomeMessage(chatName) {
        const welcomeMessage = document.getElementById("welcome-message");
        welcomeMessage.textContent = `Welcome to ${chatName}! How can I assist you today?`;
    }

    setChatBotName();

    // Clear the chat history
    clearBtn.addEventListener("click", function () {
        clearChatHistory();
        displayMessage("received", `Welcome to ${chatbotName}! How can I assist you today?`);
    });

    function clearChatHistory() {
        while (chatLog.firstChild) {
            chatLog.removeChild(chatLog.firstChild);
        }
    }

    // Process special commands such as /help and /about
    function processSpecialCommand(command) {
        switch (command) {
            case "/help":
                displayMessage("sent", "You can ask me questions or seek assistance. How may I help you?");
                break;
            case "/about":
                displayMessage("sent", "I am a chatbot designed to assist you. Feel free to ask me anything!");
                break;
            default:
                displayMessage("sent", "I'm sorry, I don't understand that command. Type /help for assistance.");
        }
    }

    // Send the chat message when the user clicks the send button or presses Enter
    sendBtn.addEventListener("click", async function () {
        let userMessage = userInput.value.trim();
        if (userMessage !== "") {
            if (!checkInternetConnection()) {
                displayMessage("error", "Sorry, you are offline. Please check your internet connection.");
                return;
            }

            if (userMessage.startsWith("/")) {
                processSpecialCommand(userMessage.toLowerCase());
                userInput.value = "";
            } else {
                if (apiKey) {
                    try {
                        displayMessage("sent", userMessage);
                        let response = await sendChatMessage(userMessage);
                        if (response) {
                            displayMessage("received", response);
                            scrollChatLog();
                        }
                    } catch (error) {
                        console.error("API Error:", error);
                        displayMessage("error", "Error: Failed to fetch response from the API.");
                    }
                    userInput.value = "";
                } else {
                    displayMessage("error", "No API Key provided. Unable to send message.");
                    userInput.value = "";
                }
            }
        }
    });

    // Function to send the chat message to OpenAI API
    async function sendChatMessage(message) {
        let data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                { role: "system", content: "Welcome to Curious Advisor! How can I assist you today?" },
                { role: "user", content: message }
            ]
        };

        showLoadingIndicator();
        try {
            let response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            let responseData = await response.json();
            if (responseData && responseData.choices && responseData.choices.length > 0) {
                let botResponse = responseData.choices[0].message.content;
                return botResponse;
            } else {
                handleAPIError(responseData);
            }
        } catch (error) {
            console.error("Error sending chat message:", error);
            throw error;
        } finally {
            hideLoadingIndicator();
        }
    }

    function handleAPIError(responseData) {
        if (responseData && responseData.error && responseData.error.message) {
            displayMessage("error", "API ERROR: " + responseData.error.message);
        } else {
            displayMessage("error", "Sorry, an error occurred. Please try again!");
        }
    }

    // Check internet connection
    function checkInternetConnection() {
        return navigator.onLine;
    }

    window.addEventListener('offline', () => {
        displayMessage("error", "You're offline. Please check your internet connection.");
    });

    // Send message on pressing Enter
    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendBtn.click();
        }
    });

    // Function to display messages in the chat log
    function displayMessage(type, message) {
        let messageContainer = document.createElement("div");
        messageContainer.classList.add("message", type);
        let messageText = document.createElement("p");
        messageText.textContent = message;
        messageContainer.appendChild(messageText);
        chatLog.appendChild(messageContainer);
        scrollChatLog();
    }

    // Scroll to the latest message in the chat log
    function scrollChatLog() {
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Show and hide the loading indicator
    function showLoadingIndicator() {
        document.getElementById("loading-indicator").style.display = "flex";
    }

    function hideLoadingIndicator() {
        document.getElementById("loading-indicator").style.display = "none";
    }

    // Voice Recognition feature
    function startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            displayMessage("error", "Sorry, your browser does not support voice recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            const transcript = event.results[event.results.length - 1][0].transcript;
            if (transcript.trim() !== "") {
                processVoiceInput(transcript);
            }
        };

        recognition.onerror = function (event) {
            console.error(event);
            displayMessage("error", "Voice recognition failed. Please try again.");
        };

        recognition.start();
    }

    voiceInputButton.addEventListener('click', startVoiceInput);

    // Process the voice input
    function processVoiceInput(transcript) {
        userInput.value = transcript;
        handleUserInput();
    }

    function handleUserInput() {
        const message = userInput.value;
        if (message.length > 0) {
            sendBtn.click();
        }
    }

    // Read messages via Speech Synthesis
    function readMessage(message) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            window.speechSynthesis.speak(utterance);
        } else {
            displayMessage("error", "Sorry, your browser does not support speech synthesis.");
        }
    }

    readCurrentMessage.addEventListener("click", () => {
        const currentMessage = document.querySelector(".message:last-child");
        if (currentMessage) {
            readMessage(currentMessage.textContent);
        }
    });

    readAllMessages.addEventListener("click", () => {
        const messages = Array.from(document.getElementsByClassName("message")).map(msg => msg.textContent);
        messages.forEach(readMessage);
    });

    window.addEventListener("beforeunload", () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    });
});
