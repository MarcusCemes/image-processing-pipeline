import { cross, tick, warning as warningSymbol } from "figures";
import { Color, Text } from "ink";
import Spinner from "ink-spinner";
import React from "react";

export const Indicator: React.FC<{ state: "none" | "pending" | "success" | "error" | "warning" }> = ({ state }) => {
  if (state === "pending")
    return (
      <Color cyan>
        <Spinner />
      </Color>
    );
  if (state === "warning") return <Color yellow>{warningSymbol}</Color>;
  if (state === "error") return <Color red>{cross}</Color>;
  if (state === "success") return <Color green>{tick}</Color>;
  return <Text> </Text>;
};
