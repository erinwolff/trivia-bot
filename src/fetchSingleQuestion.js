const shuffleArray = require("./shuffleArray");

// Function to fetch a single question when a specific category is chosen
module.exports = async function fetchSingleQuestion(category) {
  try {
    const fetch = (await import("node-fetch")).default;
    let url = `https://the-trivia-api.com/v2/questions?limit=1&categories=${category}`; // Fetch a single question

    const response = await fetch(url);
    const data = await response.json();

    const questionItem = data[0];

    return {
      // Return a formatted question object
      question: questionItem.question.text,
      category: questionItem.category,
      allAnswers: shuffleArray([
        questionItem.correctAnswer,
        ...questionItem.incorrectAnswers,
      ]),
      correctAnswer: questionItem.correctAnswer,
    };
  } catch (error) {
    console.error("Error fetching single question:", error);
  }
};
