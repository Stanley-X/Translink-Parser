import fs from "fs";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";

//Define a class for handling CSV data
class csvDataFrame {
  constructor(data = []) {
    this.data = data;
  }
  //load csv
  static async loadCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true }))
        .on("data", (row) => {
          results.push(row);
        })
        .on("end", () => {
          resolve(new csvDataFrame(results));
        })
        .on("error", reject);
    });
  }
  // Merging data
  static async mergeCSVData(routesFile, tripsFile, stopsFile) {
    const routesDataFrame = await csvDataFrame.loadCSV(routesFile);
    const tripsDataFrame = await csvDataFrame.loadCSV(tripsFile);
    const stopsDataFrame = await csvDataFrame.loadCSV(stopsFile);

    const routesData = routesDataFrame.data;
    const tripsData = tripsDataFrame.data;
    const stopsData = stopsDataFrame.data;

    const routeMap = new Map();
    routesData.forEach((route) => {
      routeMap.set(route.route_id, route.route_short_name);
    });

    const tripStopMap = new Map();
    stopsData.forEach((stop) => {
      if (!tripStopMap.has(stop.trip_id)) {
        tripStopMap.set(stop.trip_id, []);
      }
      tripStopMap.get(stop.trip_id).push(stop.stop_id);
    });

    const mergedResults = [];
    tripsData.forEach((trip) => {
      const routeShortName = routeMap.get(trip.route_id);
      const stopIds = tripStopMap.get(trip.trip_id) || [];
      stopIds.forEach((stopId) => {
        mergedResults.push({
          route_short_name: routeShortName,
          route_id: trip.route_id,
          trip_id: trip.trip_id,
          stop_id: stopId,
        });
      });
    });

    return mergedResults;
  }
  //Save data to a CSV file
  static async saveToCSV(data, outputFile) {
    const header = ["route_short_name", "route_id", "trip_id", "stop_id"];
    const records = data.map((row) => [
      row.route_short_name,
      row.route_id,
      row.trip_id,
      row.stop_id,
    ]);

    const writableStream = fs.createWriteStream(outputFile);

    return new Promise((resolve, reject) => {
      const stringifier = stringify({ header: true, columns: header });
      records.forEach((record) => stringifier.write(record));
      stringifier.end();

      stringifier
        .pipe(writableStream)
        .on("finish", () => {
          console.log(`Data has been written to ${outputFile}`);
          resolve();
        })
        .on("error", (err) => {
          console.error("Error writing file:", err);
          reject(err);
        });
    });
  }
  //Select specific columns from the data
  selet(columns) {
    const seleted = this.data.map((row) => {
      const newRow = {};
      columns.forEach((col) => {
        newRow[col] = row[col];
      });
      return newRow;
    });
    return new csvDataFrame(seleted);
  }
}
//Export the csvDataFrame class
export default csvDataFrame;
