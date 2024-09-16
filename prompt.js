import PromptSync from "prompt-sync";

const prompt = PromptSync();

//Function to prompt the user
export function promptUser() {
  const validInputs = ["y", "yes", "n", "no"];

  let userInput = prompt("Would you like to search again?").toLowerCase();

  while (!validInputs.includes(userInput)) {
    console.warn("Please enter a valid option.");
    userInput = prompt("Would you like to search again? ").toLowerCase();
  }

  if (userInput === "y" || userInput === "yes") {
    return 1;
  } else if (userInput === "n" || userInput === "no") {
    console.log("Thanks for using the Route tracker!");
    return 0;
  }
}
