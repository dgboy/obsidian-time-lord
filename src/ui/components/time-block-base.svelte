<script lang="ts">
  import { type Snippet } from "svelte";

  import type { TimeBlock } from "../../time-block-types";
  import { useColorOverrides, useFolderColors } from "../hooks/use-color.svelte";

  interface Props {
    children: Snippet;
    blockEndDecoration?: Snippet;
    timeBlock: TimeBlock;
    onpointerup?: (event: PointerEvent) => void;
  }

  const {
    onpointerup,
    children,
    blockEndDecoration,
    timeBlock,
    ...rest
  }: Props = $props();

  // Priority: color overrides > folder colors
  const colorOverrides = useColorOverrides({ timeBlock });
  const folderColors = useFolderColors(timeBlock);

  const backgroundColor = $derived(
    colorOverrides.backgroundColor || folderColors.backgroundColor,
  );

  console.log("[time-block-base] id:", timeBlock.id, "source:", timeBlock.source, "path:", (timeBlock as any).path, "colorOverrides.bg:", colorOverrides.backgroundColor, "folderColors.bg:", folderColors.backgroundColor, "finalBg:", backgroundColor);

  const contrastColors = $derived.by(() => {
    return colorOverrides.properContrastColors || folderColors.properContrastColors;
  });
</script>

<div class="padding">
  <div
    style:--text-faint={contrastColors.faint}
    style:--text-muted={contrastColors.muted}
    style:--text-normal={contrastColors.normal}
    style:--time-block-bg-color={backgroundColor}
    class={[
      "content",
      timeBlock.truncated?.includes("left") && "truncated-left",
      timeBlock.truncated?.includes("right") && "truncated-right",
      timeBlock.truncated?.includes("bottom") && "truncated-bottom",
    ]}
    {onpointerup}
    {...rest}
  >
    {@render children()}

    {@render blockEndDecoration?.()}
  </div>
</div>

<style>
  .padding {
    position: var(--time-block-position, static);
    top: var(--time-block-top, 0);
    left: var(--time-block-left, 0);

    display: flex;
    grid-column: var(--time-block-grid-column, unset);

    width: var(--time-block-width, 100%);
    height: var(--time-block-height, auto);
    padding: var(--time-block-padding, 0 1px 2px);
  }

  .content {
    position: relative;

    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr auto;
    flex: 1 0 0;

    padding: var(--time-block-content-padding);

    font-family: var(--planner-time-block-font-family, var(--font-interface));
    font-size: var(--planner-time-block-font-size, var(--font-ui-small));
    color: var(--text-muted);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    background-color: var(--time-block-bg-color, var(--background-primary));

    /* TODO: use a single var */
    border: var(
      --time-block-border,
      1px solid
        var(
          --time-block-border-color-override,
          var(--time-block-border-color, var(--color-base-40))
        )
    );
    border-radius: var(--time-block-border-radius, var(--radius-s));
    box-shadow: var(--time-block-box-shadow);
  }

  .truncated-left {
    border-left-style: dashed;
    border-left-width: 2px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .truncated-right {
    border-right-style: dashed;
    border-right-width: 2px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .truncated-bottom {
    border-bottom-style: dashed;
    border-bottom-width: 2px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
  }
</style>
