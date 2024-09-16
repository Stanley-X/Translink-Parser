import PromptSync from "prompt-sync";
const prompt = PromptSync();

//Function to prompt the user for the start and end stop numbers on a route
export async function startEnd(indexMax) {
  while (true) {
    const startEndPrompt = prompt("What is your start and end stop on the route?");
    const startEnd = startEndPrompt.split("-").map((s) => s.trim());
    const [start, end] = startEnd.map((part) => parseInt(part, 10));
    //Validate the parsed start and end values
    if (
      isNaN(start) ||
      isNaN(end) ||
      start < 1 ||
      end > indexMax ||
      start > indexMax
    ) {
      console.log("Please follow the format and enter a valid number for the stop.");
    } else {
      return [start, end];
    }
  }
}
