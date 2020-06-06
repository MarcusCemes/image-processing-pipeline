import { cross, tick, warning as warningSymbol } from "figures";
import { Box, Color, ColorProps } from "ink";
import Spinner from "ink-spinner";
import React from "react";

type IndicatorState = "none" | "pending" | "success" | "error" | "warning";

export const Indicator: React.FC<{ state: IndicatorState; colour?: ColorProps }> = ({ state, colour }) => {
  const symbol =
    state === "pending" ? (
      <Color cyanBright={!colour} {...colour}>
        <Spinner />
      </Color>
    ) : state === "warning" ? (
      <Color yellow={!colour} {...colour}>
        {warningSymbol}
      </Color>
    ) : state === "error" ? (
      <Color red={!colour} {...colour}>
        {cross}
      </Color>
    ) : state === "success" ? (
      <Color green={!colour} {...colour}>
        {tick}
      </Color>
    ) : null;

  return <Box width={1}>{symbol}</Box>;
};
