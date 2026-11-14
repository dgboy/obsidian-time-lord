import chroma from "chroma-js";

import { getObsidianContext } from "../../context/obsidian-context";
import { currentTimeSignal } from "../../global-store/current-time";
import type { TimeBlock } from "../../time-block-types";
import { getTextColorWithEnoughContrast } from "../../util/color";
import { getRelationToNow } from "../../util/moment";
import * as t from "../../util/time-block-utils";
import { getOneLineSummary } from "../../util/time-block-utils";

interface UseColorProps {
  timeBlock: TimeBlock;
}

export function useColorsForRelationToNow(timeBlock: TimeBlock) {
  const relationToNow = $derived.by(() => {
    if (timeBlock.isAllDayEvent) {
      return getRelationToNow(
        currentTimeSignal.current,
        timeBlock.startTime.clone().startOf("day"),
        timeBlock.startTime.clone().endOf("day"),
      );
    }

    if (t.isWithDuration(timeBlock)) {
      return getRelationToNow(
        currentTimeSignal.current,
        timeBlock.startTime,
        t.getEndTime(timeBlock),
      );
    }

    return "present";
  });

  const borderColor = $derived(
    relationToNow === "present" && !timeBlock.isAllDayEvent
      ? "var(--color-accent)"
      : "",
  );

  const backgroundColor = $derived(
    relationToNow === "past" ? "var(--background-secondary)" : "",
  );

  return {
    get backgroundColor() {
      return backgroundColor;
    },
    get borderColor() {
      return borderColor;
    },
  };
}

export function useColoredTimeline(timeBlock: TimeBlock) {
  const { settingsSignal } = getObsidianContext();

  const colorScale = $derived.by(() => {
    const { timelineStartColor, timelineEndColor } = settingsSignal.current;

    return chroma.scale([timelineStartColor, timelineEndColor]).mode("lab");
  });

  const backgroundColor = $derived.by(() => {
    const { timelineColored, startHour } = settingsSignal.current;

    if (timelineColored) {
      const scaleKey =
        (timeBlock.startTime.hour() - startHour) / (24 - startHour);

      return colorScale(scaleKey).hex();
    }

    return "";
  });

  const properContrastColors = $derived.by(() => {
    const { timelineColored } = settingsSignal.current;

    return timelineColored && backgroundColor
      ? getTextColorWithEnoughContrast(backgroundColor)
      : {
          normal: "inherit",
          muted: "inherit",
          faint: "inherit",
        };
  });

  return {
    get properContrastColors() {
      return properContrastColors;
    },
    get backgroundColor() {
      return backgroundColor;
    },
  };
}

export function useColorOverrides({ timeBlock }: UseColorProps) {
  const { settingsSignal, isDarkMode } = getObsidianContext();

  const colorOverride = $derived.by(() => {
    const { colorOverrides } = settingsSignal.current;

    return colorOverrides.find((override) =>
      getOneLineSummary(timeBlock).includes(override.text),
    );
  });

  const backgroundColor = $derived.by(() => {
    if (colorOverride) {
      return isDarkMode.current
        ? colorOverride?.darkModeColor
        : colorOverride?.color;
    }

    return "";
  });

  const properContrastColors = $derived.by(() => {
    const { timelineColored } = settingsSignal.current;

    return (timelineColored || colorOverride) && backgroundColor
      ? getTextColorWithEnoughContrast(backgroundColor)
      : {
          normal: "inherit",
          muted: "inherit",
          faint: "inherit",
        };
  });

  return {
    get properContrastColors() {
      return properContrastColors;
    },
    get backgroundColor() {
      return backgroundColor;
    },
  };
}

export function useFolderColors(timeBlock: TimeBlock) {
  const { settingsSignal, isDarkMode } = getObsidianContext();

  const folderPath = $derived.by(() => {
    if ("path" in timeBlock && typeof timeBlock.path === "string") {
      // Extract folder from full path: "vault/notebooks/daily.md" -> "notebooks"
      const parts = timeBlock.path.split("/");
      parts.pop(); // remove filename
      return parts.join("/");
    }
    return "";
  });

  const backgroundColor = $derived.by(() => {
    const path = folderPath;
    console.log("[useFolderColors] timeBlock.id:", timeBlock.id, "source:", timeBlock.source, "fullPath:", timeBlock.path, "folderPath:", path);

    if (!path) {
      console.log("[useFolderColors] no folder path, returning empty");
      return "";
    }

    const { folderColors } = settingsSignal.current;
    console.log("[useFolderColors] folderColors rules:", folderColors);

    // Find the first folder rule that matches (longest prefix match)
    const matchingRules = folderColors.filter(
      (rule) => path === rule.folder || path.startsWith(rule.folder + "/"),
    );
    console.log("[useFolderColors] matching rules:", matchingRules);

    const matchingRule = matchingRules.sort(
      (a, b) => b.folder.length - a.folder.length,
    )[0];

    if (!matchingRule) {
      console.log("[useFolderColors] no matching rule, returning empty");
      return "";
    }

    const color = isDarkMode.current ? matchingRule.dark : matchingRule.light;
    console.log("[useFolderColors] matched rule:", matchingRule.folder, "isDark:", isDarkMode.current, "color:", color);

    return color;
  });

  const properContrastColors = $derived.by(() => {
    return backgroundColor
      ? getTextColorWithEnoughContrast(backgroundColor as import("obsidian").HexString)
      : {
          normal: "inherit",
          muted: "inherit",
          faint: "inherit",
        };
  });

  return {
    get properContrastColors() {
      return properContrastColors;
    },
    get backgroundColor() {
      return backgroundColor;
    },
  };
}
