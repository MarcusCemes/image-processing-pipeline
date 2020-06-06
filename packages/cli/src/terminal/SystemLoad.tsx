import Spinner from "ink-spinner";
import { cpus } from "os";
import { performance } from "perf_hooks";
import React, { ReactNode, useEffect, useState } from "react";

export const SystemLoad: React.FC<{ interval?: number; placeholder?: ReactNode }> = ({
  interval = 1000,
  placeholder = <Spinner />,
}) => {
  const [load, setLoad] = useState<number>();

  useEffect(() => {
    let lastUser = 0;
    let lastTick = performance.now();

    const intervalRef = setInterval(() => {
      const cpuStats = cpus();
      const currentTick = performance.now();

      let currentUser = 0;
      for (const cpu of cpuStats) {
        currentUser += cpu.times.user + cpu.times.sys;
      }

      if (lastUser) {
        const load = (currentUser - lastUser) / (currentTick - lastTick) / cpuStats.length;
        setLoad(Math.min(1, Math.max(0, load)));
      }

      lastUser = currentUser;
      lastTick = currentTick;
    }, interval);

    return (): void => clearInterval(intervalRef);
  }, []);

  if (!load) return <>{placeholder}</>;
  return <>{Math.round(100 * load)}%</>;
};
