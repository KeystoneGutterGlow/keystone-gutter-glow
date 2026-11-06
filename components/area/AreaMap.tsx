"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { mapLabels, serviceRadius } from "@/content/area";
import styles from "./Area.module.css";

// A real map of the service area: OpenStreetMap tiles and the 10-mile circle. The tiles name the
// towns themselves, so the only label we add is Jamison, which they leave unnamed at this zoom.
// Leaflet and the tiles only load once the map is nearly on screen. The center is already rounded
// (see content/area.ts) and gets no marker. A list for screen readers sits beside it, and the ZIP
// check still answers the question if this doesn't load.

const METERS_PER_MILE = 1609.34;

export function AreaMap() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      // On touch screens one finger keeps scrolling the page, so the map can't trap anyone.
      const touch = window.matchMedia("(pointer: coarse)").matches;
      const map = L.map(el, { scrollWheelZoom: false, dragging: !touch, zoomSnap: 0.25, attributionControl: false });
      // The circle can't measure itself until the map has a view.
      map.setView([serviceRadius.lat, serviceRadius.lon], 11);
      L.control.attribution({ prefix: false }).addTo(map);
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 15,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      // The skeleton shimmer stops once the first tiles are in
      tiles.once("load", () => delete el.dataset.loading);

      const circle = L.circle([serviceRadius.lat, serviceRadius.lon], {
        radius: serviceRadius.miles * METERS_PER_MILE,
        color: "#0d2a4e",
        weight: 2,
        dashArray: "8 7",
        fillColor: "#3bb0ee",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map);
      map.fitBounds(circle.getBounds(), { padding: [14, 14] });
      map.setMinZoom(map.getZoom() - 1);
      map.setMaxBounds(circle.getBounds().pad(0.9));

      for (const place of mapLabels) {
        L.marker([place.lat, place.lon], {
          keyboard: false,
          interactive: false,
          icon: L.divIcon({ className: styles.pin ?? "", iconSize: [10, 10], iconAnchor: [5, 5] }),
        })
          .bindTooltip(place.name, { permanent: true, direction: "right", offset: [2, 0], className: styles.town ?? "" })
          .addTo(map);
      }
      cleanup = () => map.remove();
    };

    const watcher = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          watcher.disconnect();
          void start();
        }
      },
      { rootMargin: "400px" },
    );
    watcher.observe(el);

    return () => {
      cancelled = true;
      watcher.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={box}
      className={styles.mapBox}
      data-loading=""
      role="group"
      aria-label={`Map of Bucks County and the edge of Montgomery County, Pennsylvania, with a ${serviceRadius.miles}-mile circle around Jamison. Everywhere inside the circle is in our area.`}
    />
  );
}
