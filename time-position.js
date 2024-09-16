import fs from "fs";
import csvDataFrame from "./csv-processing.js";
const cacheTrip = "./cached-data/trip_updates.json";
const cachePosition = "./cached-data/vehicle_positions.json";

async function loadJSON(cacheFilePath) {
  try {
    const data = fs.readFileSync(cacheFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

//Function to convert a date and time to POSIX (Unix) time
function convertToPosix(date, hour, minute) {
  const year = Math.floor(date / 10000);
  const month = Math.floor((date % 10000) / 100) - 1;
  const day = date % 100;
  const newDate = new Date(year, month, day, hour, minute, 0, 0);
  const posixTime = Math.floor(newDate.getTime() / 1000);
  return posixTime;
}

//Function to convert POSIX time to a formatted date string
function convertPosixToFormattedDate(posixTimeStr) {
  const posixTime = parseInt(posixTimeStr, 10);
  const date = new Date(posixTime * 1000);
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}`;
  return formattedTime;
}

//Function to calculate scheduled and live arrival times, and vehicle ID for a route
export async function scheduledArrivalTime(stopIds,start,end,routeId,fulldate,hour,minute,headSign) {
  const startStopId = stopIds[start - 1];
  const jsonData = await loadJSON(cacheTrip);
  const trips = jsonData.entity;
  const posixTime = convertToPosix(fulldate, hour, minute);
  const tripIdCheck = await csvDataFrame.loadCSV("./static-data/trips.txt");

  //Filter trips that match the route ID and head sign
  const tripIds = tripIdCheck.data.filter(
    (row) => row.route_id === routeId && row.trip_headsign === headSign
  );

  //Filter trips that match the route ID from the JSON data
  const targetTrips = trips.filter(
    (entry) => entry.tripUpdate.trip.routeId === routeId
  );

  const matchTrip = targetTrips.filter((trip) =>
    tripIds.find((target) => target.trip_id === trip.tripUpdate.trip.tripId)
  );

  //Match trips with the trip IDs
  if (matchTrip) {
    const trip = await matchTrip.filter((trip) =>
      trip.tripUpdate.stopTimeUpdate.find(
        (stop) =>
          (stop.stopId === startStopId &&
            parseInt(stop.arrival?.time) - posixTime < 600) ||
          parseInt(stop.departure?.time) - posixTime < 600
      )
    );

    const startStops = trip
      .flatMap((targetTrip) => targetTrip.tripUpdate.stopTimeUpdate)
      .filter((targetStop) => targetStop.stopId === startStopId);
    if (startStops) {
      const stopsTimeUpdate = trip.flatMap(
        (trips) => trips.tripUpdate.stopTimeUpdate
      );

      //Calculate scheduled and live arrival times
      const arrivalPosix = startStops.map(
        (stop) => stop.arrival?.time || stop.departure?.time
      );

      const livePosix = startStops.map(
        (stop) =>
          parseInt(stop.arrival?.time) + stop.arrival?.delay ||
          parseInt(stop.departure?.time) + stop.departure?.delay
      );

      const scheduledTime = arrivalPosix.map(convertPosixToFormattedDate);
      const liveTime = livePosix.map(convertPosixToFormattedDate);
      const vehicleId = trip.map((trip) => trip.tripUpdate.vehicle.id);

      return [scheduledTime, liveTime, vehicleId, stopsTimeUpdate];
    }
  }
  console.error(
    `No bus is scheduled to arrive less than 10 minutes.`
  );
}

//Function to get the position of the vehicle
export async function vehiclePosition(vehicleId) {
  const jsonData = await loadJSON(cachePosition);
  const entries = jsonData.entity;
  const entry = entries.filter((entry) =>
    vehicleId.includes(entry.vehicle.vehicle.id)
  );
  const latitude = entry.map((lat) => lat.vehicle.position.latitude);
  const longitude = entry.map((long) => long.vehicle.position.longitude);
  const formattedPosition = `latitude: ${latitude}, longitude: ${longitude}`;
  return formattedPosition;
}

//Function to estimate travel time
export async function estimateTravelTime(stopIds, start, end, stopsTimeUpdate) {
  const startStopId = stopIds[start - 1];
  const endStopId = stopIds[end - 1];
  const startStop = stopsTimeUpdate.find((stop) => stop.stopId === startStopId);
  const endStop = stopsTimeUpdate.find((stop) =>stop.stopId === endStopId && stop.stopSequence > startStop?.stopSequence);
  if (startStop && endStop) {
    const startDepartureTime = parseInt(startStop.departure.time); //Start stop departure time
    const endArrivalTime = parseInt(endStop.arrival.time);  //End stop arrival time
    const timeDifference = endArrivalTime - startDepartureTime;
    const hours = Math.floor(timeDifference / 3600);
    const minutes = Math.floor((timeDifference % 3600) / 60);
    const secs = timeDifference % 60;

    //Format hours, minutes, and seconds
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(secs).padStart(2, "0");
    const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

    return formattedTime;

  } else {
    console.log("Start stop or end stop not found");
  }
}
