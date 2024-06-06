const shuffleArray = require("./shuffleArray");

// Function to format answer when it is greater than 80 characters
function formatAnswer(answer, maxLength = 80) {
  if (answer.length > maxLength) {
    return answer.slice(0, maxLength - 3) + "...";
  }
  return answer;
}

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
        questionItem.correctAnswer.length > 80
          ? formatAnswer(questionItem.correctAnswer)
          : questionItem.correctAnswer,
        ...questionItem.incorrectAnswers.map((answer) =>
          answer.length > 80 ? formatAnswer(answer) : answer
        ),
      ]),
      correctAnswer:
        questionItem.correctAnswer.length > 80
          ? formatAnswer(questionItem.correctAnswer)
          : questionItem.correctAnswer,
    };
  } catch (error) {
    console.error("Error fetching single question:", error);
  }
};
