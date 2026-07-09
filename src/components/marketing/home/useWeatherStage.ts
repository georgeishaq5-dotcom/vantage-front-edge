import { useEffect, useState } from "react";

export type WeatherStage = "rain" | "clearing" | "sent";

const STAGE_DURATIONS: Record<WeatherStage, number> = {
  rain: 2200,
  clearing: 1600,
  sent: 3200,
};

const ORDER: WeatherStage[] = ["rain", "clearing", "sent"];

/** Drives the shared rain -> clearing -> sent cycle for both weather HUD cards on the page, kept in sync. */
export function useWeatherStage() {
  const [stage, setStage] = useState<WeatherStage>("rain");

  useEffect(() => {
    const t = setTimeout(() => {
      const i = ORDER.indexOf(stage);
      setStage(ORDER[(i + 1) % ORDER.length]);
    }, STAGE_DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  return stage;
}
