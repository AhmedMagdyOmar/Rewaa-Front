// Tremor CategoryBar [v0.0.3]

"use client";

import React from "react";

import {
  AvailableChartColors,
  AvailableChartColorsKeys,
  getColorClassName,
} from "@/lib/chart-utils";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Tooltip";

const getMarkerBgColor = (
  marker: number | undefined,
  values: number[],
  colors: AvailableChartColorsKeys[],
): string => {
  if (marker === undefined) return "";

  if (marker === 0) {
    for (let index = 0; index < values.length; index++) {
      if (values[index] > 0) {
        return getColorClassName(colors[index], "bg");
      }
    }
  }

  let prefixSum = 0;
  for (let index = 0; index < values.length; index++) {
    prefixSum += values[index];
    if (prefixSum >= marker) {
      return getColorClassName(colors[index], "bg");
    }
  }

  return getColorClassName(colors[values.length - 1], "bg");
};

const getPositionLeft = (value: number | undefined, maxValue: number): number =>
  value ? (value / maxValue) * 100 : 0;

const sumNumericArray = (arr: number[]) => arr.reduce((prefixSum, num) => prefixSum + num, 0);

const formatNumber = (num: number): string => {
  if (Number.isInteger(num)) {
    return num.toString();
  }
  return num.toFixed(1);
};

const BarLabels = ({ values }: { values: number[] }) => {
  const sumValues = React.useMemo(() => sumNumericArray(values), [values]);

  // Pre-calculate the label states to keep the render phase pure
  const labelItems = React.useMemo(() => {
    return values.reduce<{
      items: {
        widthPercentage: number;
        prefixSum: number;
        showLabel: boolean;
      }[];
      prefixSum: number;
      hiddenSum: number;
    }>(
      (acc, widthPercentage) => {
        const nextPrefixSum = acc.prefixSum + widthPercentage;

        const showLabel =
          (widthPercentage >= 0.1 * sumValues || acc.hiddenSum >= 0.09 * sumValues) &&
          sumValues - nextPrefixSum >= 0.1 * sumValues &&
          nextPrefixSum >= 0.1 * sumValues &&
          nextPrefixSum < 0.9 * sumValues;

        const nextHiddenSum = showLabel ? 0 : acc.hiddenSum + widthPercentage;

        acc.items.push({
          widthPercentage,
          prefixSum: nextPrefixSum,
          showLabel,
        });

        return {
          items: acc.items,
          prefixSum: nextPrefixSum,
          hiddenSum: nextHiddenSum,
        };
      },
      {
        items: [],
        prefixSum: 0,
        hiddenSum: 0,
      },
    ).items;
  }, [values, sumValues]);

  return (
    <div
      className={cn(
        // base
        "relative mb-2 flex h-5 w-full text-sm font-medium",
        // text color
        "text-muted-foreground",
      )}
    >
      <div className="absolute bottom-0 left-0 flex items-center">0</div>
      {labelItems.map((item, index) => {
        const widthPositionLeft = getPositionLeft(item.widthPercentage, sumValues);

        return (
          <div
            key={`item-${index}`}
            className="flex items-center justify-end pr-0.5"
            style={{ width: `${widthPositionLeft}%` }}
          >
            {item.showLabel ? (
              <span className={cn("block translate-x-1/2 text-sm tabular-nums")}>
                {formatNumber(item.prefixSum)}
              </span>
            ) : null}
          </div>
        );
      })}
      <div className="absolute right-0 bottom-0 flex items-center">{formatNumber(sumValues)}</div>
    </div>
  );
};

interface CategoryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  values: number[];
  colors?: AvailableChartColorsKeys[];
  marker?: { value: number; tooltip?: string; showAnimation?: boolean };
  showLabels?: boolean;
}

const CategoryBar = React.forwardRef<HTMLDivElement, CategoryBarProps>(
  (
    { values = [], colors = AvailableChartColors, marker, showLabels = true, className, ...props },
    forwardedRef,
  ) => {
    const markerBgColor = React.useMemo(
      () => getMarkerBgColor(marker?.value, values, colors),
      [marker, values, colors],
    );

    const maxValue = React.useMemo(() => sumNumericArray(values), [values]);

    const adjustedMarkerValue = React.useMemo(() => {
      if (marker === undefined) return undefined;
      if (marker.value < 0) return 0;
      if (marker.value > maxValue) return maxValue;
      return marker.value;
    }, [marker, maxValue]);

    const markerPositionLeft: number = React.useMemo(
      () => getPositionLeft(adjustedMarkerValue, maxValue),
      [adjustedMarkerValue, maxValue],
    );

    return (
      <div
        ref={forwardedRef}
        className={cn(className)}
        aria-label="Category bar"
        aria-valuenow={marker?.value}
        tremor-id="tremor-raw"
        {...props}
      >
        {showLabels ? <BarLabels values={values} /> : null}
        <div className="relative flex h-2 w-full items-center">
          <div className="flex h-full flex-1 items-center gap-0.5 overflow-hidden rounded-full">
            {values.map((value, index) => {
              const barColor = colors[index] ?? "chart-5";
              const percentage = (value / maxValue) * 100;
              return (
                <div
                  key={`item-${index}`}
                  className={cn(
                    "h-full",
                    getColorClassName(barColor as AvailableChartColorsKeys, "bg"),
                    percentage === 0 && "hidden",
                  )}
                  style={{ width: `${percentage}%` }}
                />
              );
            })}
          </div>

          {marker !== undefined ? (
            <div
              className={cn(
                "absolute w-2 -translate-x-1/2",
                marker.showAnimation && "transform-gpu transition-all duration-300 ease-in-out",
              )}
              style={{
                left: `${markerPositionLeft}%`,
              }}
            >
              {marker.tooltip ? (
                <Tooltip asChild content={marker.tooltip}>
                  <div
                    aria-hidden="true"
                    className={cn(
                      "relative mx-auto h-4 w-1 rounded-full ring-2",
                      "ring-white",
                      markerBgColor,
                    )}
                  >
                    <div
                      aria-hidden
                      className="absolute size-7 translate-x-[-45%] translate-y-[-15%]"
                    ></div>
                  </div>
                </Tooltip>
              ) : (
                <div
                  className={cn("mx-auto h-4 w-1 rounded-full ring-2", "ring-white", markerBgColor)}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

CategoryBar.displayName = "CategoryBar";

export { CategoryBar, type CategoryBarProps };
