import * as React from "react";
import { useState, useEffect } from "react";
import "./app.css";
import * as L from "leaflet";

const App = () => {
  const [alerts, setAlerts] = useState([]);
  const [map, setMap] = useState(null);
  const [polys, setPolys] = useState([]);

  const source = new EventSource("http://localhost:8080/alerts");

  useEffect(() => {
    source.onmessage = (e) => {
      const alert = JSON.parse(e.data);
      if (map) {
        const polygon = L.polygon(alert.poly)
          .addTo(map)
          .bindTooltip(alert.title, { direction: "top" });
        setAlerts((alerts) => [...alerts, alert]);
        setPolys((polys) => [...polys, polygon]);
      }
    };
  }, [map]);

  useEffect(() => {
    var map = L.map("map").setView([41.2585732, -95.9649333], 5);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    setMap(map);
  }, []);

  return (
    <div>
      <h1>Weather alerts map</h1>

      <div id="map"></div>

      <div>
        {alerts.map((alert, i) => (
          <div key={i}>title: {alert.title}</div>
        ))}
      </div>
    </div>
  );
};

export default App;
