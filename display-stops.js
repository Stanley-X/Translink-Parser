import PromptSync from "prompt-sync";
const prompt = PromptSync();

//Function to map stop IDs to stop names using the stops data frame
function displayNames(stopsDF, stopIds) {
  const stopIdToNameMap = new Map(
    stopsDF.data.map((row) => [row.stop_id, row.stop_name])
  );
  const stopNames = stopIds.map((id) => stopIdToNameMap.get(id));
  return stopNames;
}

//Function to display bus stops for a given route
export async function displayStops(routesDF, tripsDF, stopTimeDF, stopsDF) {
  try {
    let busNumber = null;
    let route = null;
    let routeID = 0;
    let tripID = 0;
    let indexMax = 0;
    let routeLongName = null;
    //Loop to prompt the user until a valid bus route is entered
    while (!route) {
      busNumber = prompt("What Bus Route would you like to take?");
      route = routesDF.data.find((row) => row.route_short_name === busNumber);
      if (!route) {
        console.log("Please enter a valid bus route.");
      }
    }
    routeID = route.route_id;
    const trip = tripsDF.data.find((row) => row.route_id === routeID);
    tripID = trip.trip_id;
    const stops = stopTimeDF.data.filter((row) => row.trip_id === tripID);
    const stopIds = stops.map((row) => row.stop_id);
    const stopNames = displayNames(stopsDF, stopIds);

    //Display each stop name with an index
    stopNames.forEach((stopName, index) => {
      console.log(`${index + 1}. ${stopName}`);
      indexMax = index + 1;
    });

    routeLongName = route.route_long_name;
    return [indexMax, busNumber, routeLongName, routeID, stopIds];
  } catch (error) {
    console.error("Error loading data:", error);
  }
}
