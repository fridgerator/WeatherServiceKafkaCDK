import { Alert } from "./alert";

export const BOOTSTRAP_SERVERS =
  process.env.NODE_ENV === "prod"
    ? process.env.BOOTSTRAP_SERVERS!
    : "localhost:29092,localhost:29093";
export const DEBUG = process.env.NODE_ENV !== "prod";
export const WEATHER_ALERTS_TOPIC = "weather_alerts";
export const ALERTS_ATOM_URL = "https://alerts.weather.gov/cap/us.php?x=0";

export const getState = (alert: Alert): string => {
  return alert["cap:geocode"].value[1]["#"].split(" ")[0].substring(0, 2);
};
