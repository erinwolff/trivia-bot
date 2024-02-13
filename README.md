# Trivia Bot 

A Discord bot that delivers a fun and engaging trivia experience with random questions and category-based selections. 

## Features

*   **Random Trivia:**  Spins up random trivia questions for a delightful 'challenge me' feature. Trivia questions sourced from https://the-trivia-api.com/.
*   **Category Choices:**  Provides users with specific categories to test their knowledge.
*   **Dynamic Buttons:**  Employs easy-to-use buttons for answering trivia questions.
*   **Answer Feedback:** Reveals the correct answer upon submission.

## Setup

**Installation**

1.  Clone this repository.
    

2.  Navigate to the repository directory:
    ```bash
    cd trivia-bot
    ```

3.  Install dependencies:
    ```bash
    npm install
    ```

**Configuration**

1.  Create a `config.json` file at the root of your project with the following:
    ```
    { 
    "token": "YOUR_BOT_TOKEN",
    "guild_id":"DISCORD_SERVER_ID",
    "client_id":"BOT_ID",
    "bot_chat_channel_id":"BOT_CHAT_CHANNEL_ID" 
    }
    ```
2. Run the bot with `node index.js` or the name of your main bot file

## Feedback and Support 

If you need help, encounter a bug, or have
suggestions for additional features, please reach out!


