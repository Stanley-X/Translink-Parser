import PromptSync from "prompt-sync";
const prompt = PromptSync();

//Function to prompt the user for a date and validate the format
export async function date() {
  let date = null;
  let datePrompt = "";
  while (!date) {
    datePrompt = prompt("What date will you take the route?");
    date = /^\d{4}-\d{2}-\d{2}$/.test(datePrompt);
    if (!date) {
      console.log("Incorrect date format. Please use YYYY-MM-DD.");
    }
  }
  const fulldate = Number(datePrompt.replace(/-/g, ""));
  return fulldate;
}

// Function to prompt the user for a time and validate the format
export async function time() {
  let timePrompt = "";
  let time = null;
  while (!time) {
    timePrompt = prompt("What time will you leave? (HH:mm) ");
    time = /^\d{2}:\d{2}$/.test(timePrompt);
    if (!time) {
      console.log("Incorrect time format. Please use HH:mm");
    }
  }
  const timeParts = timePrompt.split(":");
  const [hour, minute] = timeParts.map((part) => parseInt(part, 10));
  return [hour, minute];
}
