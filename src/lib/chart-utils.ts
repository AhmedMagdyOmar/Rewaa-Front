/* eslint-disable @typescript-eslint/no-explicit-any */
// Tremor chartColors [v0.1.0]

export type ColorUtility = "bg" | "stroke" | "fill" | "text" | "foreground";

export const chartColors = {
  "chart-1": {
    bg: "bg-chart-1",
    stroke: "stroke-chart-1",
    fill: "fill-chart-1",
    text: "text-chart-1",
    foreground: "text-chart-1-foreground",
  },
  "chart-2": {
    bg: "bg-chart-2",
    stroke: "stroke-chart-2",
    fill: "fill-chart-2",
    text: "text-chart-2",
    foreground: "text-chart-2-foreground",
  },
  "chart-3": {
    bg: "bg-chart-3",
    stroke: "stroke-chart-3",
    fill: "fill-chart-3",
    text: "text-chart-3",
    foreground: "text-chart-3-foreground",
  },
  "chart-4": {
    bg: "bg-chart-4",
    stroke: "stroke-chart-4",
    fill: "fill-chart-4",
    text: "text-chart-4",
    foreground: "text-chart-4-foreground",
  },
  "chart-5": {
    bg: "bg-chart-5",
    stroke: "stroke-chart-5",
    fill: "fill-chart-5",
    text: "text-chart-5",
    foreground: "text-chart-5-foreground",
  },
  "chart-6": {
    bg: "bg-chart-6",
    stroke: "stroke-chart-6",
    fill: "fill-chart-6",
    text: "text-chart-6",
    foreground: "text-chart-6-foreground",
  },
  success: {
    bg: "bg-success",
    stroke: "stroke-success",
    fill: "fill-success",
    text: "text-success",
    foreground: "text-white",
  },
  error: {
    bg: "bg-error",
    stroke: "stroke-error",
    fill: "fill-error",
    text: "text-error",
    foreground: "text-white",
  },
} as const satisfies {
  [color: string]: {
    [key in ColorUtility]: string;
  };
};

export type AvailableChartColorsKeys = keyof typeof chartColors;

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
  chartColors,
) as Array<AvailableChartColorsKeys>;

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[],
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>();
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length]);
  });
  return categoryColors;
};

export const getColorClassName = (color: AvailableChartColorsKeys, type: ColorUtility): string => {
  const fallbackColor = {
    bg: "bg-gray-500",
    stroke: "stroke-gray-500",
    fill: "fill-gray-500",
    text: "text-gray-500",
    foreground: "text-white",
  };
  return chartColors[color]?.[type] ?? fallbackColor[type];
};

// Tremor getYAxisDomain [v0.0.0]

export const getYAxisDomain = (
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined,
) => {
  const minDomain = autoMinValue ? "auto" : (minValue ?? 0);
  const maxDomain = maxValue ?? "auto";
  return [minDomain, maxDomain];
};

// Tremor hasOnlyOneValueForKey [v0.1.0]

export function hasOnlyOneValueForKey(array: any[], keyToCheck: string): boolean {
  const val: any[] = [];

  for (const obj of array) {
    if (Object.prototype.hasOwnProperty.call(obj, keyToCheck)) {
      val.push(obj[keyToCheck]);
      if (val.length > 1) {
        return false;
      }
    }
  }

  return true;
}
