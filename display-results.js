import csvDataFrame from "./csv-processing.js";
import fs from "fs";
import {estimateTravelTime,scheduledArrivalTime,vehiclePosition} from "./time-position.js";

let results = [{}];

//Add result to the results array
function addResult(attribute, value) {
  let tempData = results[0];
  tempData[attribute] = value;
  results[0] = tempData;
}

//Function to load JSON data from a cache file
async function loadJSON(cacheFilePath) {
  try {
    const data = fs.readFileSync(cacheFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}
// Function to check if a bus service is available on the given date and time
async function checkAvaliable(serviceId,fulldate,hour,minute,start,stopIds) {
  const cacheFilePath = "./cached-data/trip_updates.json";
  const jsonData = loadJSON(cacheFilePath);
  const startStop = stopIds[start - 1];

  const calendar = await csvDataFrame.loadCSV("./static-data/calendar.txt");
  const serviceLine = calendar.data.find((row) => row.service_id === serviceId);
  if (!serviceLine) {
    console.error(`Service ID ${serviceId} not found in calendar.`);
    return false;
  }

  const monday = serviceLine.monday;
  const tuesday = serviceLine.tuesday;
  const wednesday = serviceLine.wednesday;
  const thursday = serviceLine.thursday;
  const friday = serviceLine.friday;
  const saturday = serviceLine.saturday;
  const sunday = serviceLine.sunday;
  const startDate = serviceLine.start_date;
  const endDate = serviceLine.end_date;

  //Check if the date is within the service's start and end dates
  if (fulldate < startDate || fulldate > endDate) {
    return false;
  }

  const targetDate = new Date(fulldate);
  const targetDay = targetDate.getDay();

  const serviceDays = [sunday,monday,tuesday,wednesday,thursday,friday,saturday];

  //Return true if the service runs on the target day
  return serviceDays[targetDay] === "1";
}

//Function to find the service ID for a given route ID
async function findSeviceID(routeID) {
  const trips = await csvDataFrame.loadCSV("./static-data/trips.txt");
  const findTrip = trips.data.find((row) => row.route_id === routeID);
  const service_id = findTrip.service_id;
  return service_id;
}

//Function to return the heading sign
async function headingSign(start, end, routeID, serviceId) {
  const trips = await csvDataFrame.loadCSV("./static-data/trips.txt");
  let directionId = null;
  let headSign = null;
  if (start > end) {
    directionId = "1";
  } else {
    directionId = "0";
  }

  //Determine direction based on start and end
  const trip = trips.data.find(
    (row) =>
      row.route_id === routeID &&
      row.service_id === serviceId &&
      row.direction_id === directionId
  );

  if (trip) {
    headSign = trip.trip_headsign;
  } else {
    console.warn(
      `No trip found for routeID: ${routeID}, serviceId: ${serviceId}, directionId: ${directionId}`
    );
  }
  return headSign;
}

//display final results
export async function displayResults(busNumber,routeLongName,fulldate,hour,minute,routeID,start,end,stopIds) {
  addResult("Route Short Name", busNumber);
  addResult("Route Long Name", routeLongName);
  const serviceId = await findSeviceID(routeID);
  addResult("Service ID", serviceId);
  const headSign = await headingSign(start, end, routeID, serviceId);
  addResult("Heading Sign", headSign);
  const check = await checkAvaliable(serviceId,fulldate,hour,minute,start,stopIds);
  const [scheduledTime, liveTime, vehicleId, stopTimeUpdate] =await scheduledArrivalTime(stopIds,start,end,routeID,fulldate,hour,minute,headSign);
  addResult("Scheduled Arrival Time", scheduledTime);
  addResult("Live Arrival Time", liveTime);
  const position = await vehiclePosition(vehicleId);
  addResult("Live Position", position);
  const estimateTime = await estimateTravelTime(stopIds,start,end,stopTimeUpdate);
  addResult("Estimated Travel Time", estimateTime);

  if (!check) {
    console.log("No bus exists.");
    return 1;
  } else {
    console.table(results);
    return 1;
  }
}
