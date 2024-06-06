const shuffleArray = require("./shuffleArray");

// Function to format answer when it is greater than 80 characters
function formatAnswer(answer, maxLength = 80) {
  if (answer.length > maxLength) {
    return answer.slice(0, maxLength - 3) + "...";
  }
  return answer;
}

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
    }));
  } catch (error) {
    console.error("Error fetching question batch:", error);
  }
};
