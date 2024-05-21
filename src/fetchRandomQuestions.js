const shuffleArray = require("./shuffleArray");

// Function to fetch questions to be stored in the questionBank & used for Random/"Surprise Me!" button selection
module.exports = async function fetchRandomQuestions() {
  try {
    const fetch = (await import("node-fetch")).default;
    let url = "https://the-trivia-api.com/v2/questions?limit=20"; // Can update batch limit, up to 50 questions.
    const response = await fetch(url);
    const data = await response.json();

    return data.map((questionItem) => ({
      question: questionItem.question.text,
      category: questionItem.category,
      allAnswers: shuffleArray([
        questionItem.correctAnswer,
        ...questionItem.incorrectAnswers,
      ]),
      correctAnswer: questionItem.correctAnswer,
    }));
  } catch (error) {
    console.error("Error fetching question batch:", error);
  }
};
