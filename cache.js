import fs from "fs";
import fetch from "node-fetch";

//Fetch data from a URL and cache it to a file
async function fetchCache(Url, cacheFilePath) {
  try {
    const respone = await fetch(Url);

    if (!respone.ok) {
      throw new Error(`Fetch failed, status: ${respone.status}`);
    }
    const data = await respone.json();
    fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("Error fetching and caching:", error);
  }
}

//Function to load data from the cache file
function loadFromCache(cacheFilePath) {
  try {
    const data = fs.readFileSync(cacheFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
}

//Exported function to manage caching and fetching of live data
export async function cacheLiveData(apiUrl, cacheFilePath) {
  let data = loadFromCache(cacheFilePath);
  if (!data) {
    console.log("Cache is empty, fetching data from api.");
    await fetchCache(apiUrl, cacheFilePath);
    data = loadFromCache(cacheFilePath);
  }
  if (data) {
    await fetchCache(apiUrl, cacheFilePath);
    data = loadFromCache(cacheFilePath);
  } else {
    console.error("Failed to load data.");
  }
}
