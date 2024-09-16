//Import functions from other js files
import { displayStops } from "./display-stops.js";
import { startEnd } from "./start-end.js";
import { date, time } from "./date-time.js";
import { displayResults } from "./display-results.js";
import { promptUser } from "./prompt.js";
import { cacheLiveData } from "./cache.js";
import csvDataFrame from "./csv-processing.js";

const apiUrlTripUpdate = "http://127.0.0.1:5343/gtfs/seq/trip_updates.json ";
const apiUrlVehiclePosition = "http://127.0.0.1:5343/gtfs/seq/vehicle_positions.json";
const apiUrlAlerts = "http://127.0.0.1:5343/gtfs/seq/alerts.json ";

const cacheTripUpdate = "./cached-data/trip_updates.json";
const cacheVehiclePosition = "./cached-data/vehicle_positions.json";
const cacaheAlerts = "./cached-data/alerts.json";

//Main function to run the Route Planner application
export async function main() {
  let status = 1;
  const routesDF = await csvDataFrame.loadCSV("./static-data/routes.txt");
  const tripsDF = await csvDataFrame.loadCSV("./static-data/trips.txt");
  const stopTimeDF = await csvDataFrame.loadCSV("./static-data/stop_times.txt");
  const stopsDF = await csvDataFrame.loadCSV("./static-data/stops.txt");

  //Loop to keep the application running until the user chooses to exit
  while (status) {
    console.log("Welcome to the South East Queensland Route Planner!");
    await cacheLiveData(apiUrlTripUpdate, cacheTripUpdate);
    await cacheLiveData(apiUrlVehiclePosition, cacheVehiclePosition);
    await cacheLiveData(apiUrlAlerts, cacaheAlerts);
    const [indexMax, busNumber, routeLongName, routeID, stopIds] = await displayStops(routesDF, tripsDF, stopTimeDF, stopsDF);
    const [start, end] = await startEnd(indexMax);
    const fulldate = await date();
    const [hour, minute] = await time();
    await displayResults(busNumber,routeLongName,fulldate,hour,minute,routeID,start,end,stopIds);
    status = promptUser();
  }
}

main();
