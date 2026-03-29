<script lang="ts">
  import { onMount } from "svelte";
  import {
    fetchPortfolioOverview,
    fetchPositions,
    fetchStartupPortfolio,
  } from "./api.js";
  import {
    positionsStore,
    portfolioStore,
    initWebSocket,
  } from "./websocketStore.js";

  let { navigate } = $props();

  let startupPortfolioValue = $state<number>(0);

  onMount(() => {
    // Fetch initial static snapshot
    fetchPortfolioOverview()
      .then((data: any) => portfolioStore.set(data))
      .catch(console.error);
    fetchPositions()
      .then((data: any) => positionsStore.set(data))
      .catch(console.error);
    fetchStartupPortfolio()
      .then((value: number) => (startupPortfolioValue = value))
      .catch(console.error);

    // Connect to WebSocket for live updates
    const ws = initWebSocket();
    // 3. Drag-to-Scroll Logic
    let isDown = false;
    let startY: any;
    let scrollTop: any;

    // Helper to get Y coordinate from either a mouse or touch event
    const getPageY = (e: any) =>
      e.touches && e.touches.length > 0 ? e.touches[0].pageY : e.pageY;

    const handleDown = (e: any) => {
      isDown = true;
      startY = getPageY(e);
      scrollTop = window.scrollY || document.documentElement.scrollTop;
    };

    const handleUpOrLeave = () => {
      isDown = false;
    };

    const handleMove = (e: any) => {
      if (!isDown) return;
      e.preventDefault(); // Stop text selection / native panning

      const y = getPageY(e);
      const walk = (y - startY) * 1.5;
      window.scrollTo(0, scrollTop - walk);
    };

    // Attach Mouse Events (for Pi OS text-selection quirk)
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseleave", handleUpOrLeave);
    window.addEventListener("mouseup", handleUpOrLeave);
    window.addEventListener("mousemove", handleMove, { passive: false });

    // Attach Touch Events (for native touch pass-through)
    window.addEventListener("touchstart", handleDown, { passive: false });
    window.addEventListener("touchend", handleUpOrLeave);
    window.addEventListener("touchmove", handleMove, { passive: false });
    return () => {
      if (ws) ws.close();
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseleave", handleUpOrLeave);
      window.removeEventListener("mouseup", handleUpOrLeave);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleDown);
      window.removeEventListener("touchend", handleUpOrLeave);
      window.removeEventListener("touchmove", handleMove);
    };
  });

  let totalPL = $derived(
    $positionsStore
      ? $positionsStore.reduce(
          (sum: number, pos: any) => sum + (pos.pl || 0),
          0,
        )
      : 0,
  );

  let startupPortfolioPercent = $derived(
    startupPortfolioValue > 0
      ? ((totalPL - startupPortfolioValue) / startupPortfolioValue) * 100
      : 0,
  );

  let lastUpdateTime = $state<Date | null>(null);
  let timeAgo = $state<string>("Never");

  $effect(() => {
    if ($portfolioStore || $positionsStore) {
      lastUpdateTime = new Date();
    }
  });

  $effect(() => {
    const interval = setInterval(() => {
      if (!lastUpdateTime) {
        timeAgo = "Never";
        return;
      }
      const diffInSeconds = Math.floor(
        (new Date().getTime() - lastUpdateTime.getTime()) / 1000,
      );

      if (diffInSeconds < 5) {
        timeAgo = "Just now";
      } else if (diffInSeconds < 60) {
        timeAgo = `${diffInSeconds} seconds ago`;
      } else if (diffInSeconds < 3600) {
        timeAgo = `${Math.floor(diffInSeconds / 60)} minutes ago`;
      } else {
        timeAgo = `${Math.floor(diffInSeconds / 3600)} hours ago`;
      }
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="flex min-h-screen justify-center">
  <main class="flex-1 px-4 md:px-10 py-12 max-w-7xl w-full">
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div
        class="col-span-1 md:col-span-2 p-8 rounded-xl bg-surface-container-low relative overflow-hidden"
      >
        <div class="relative z-10">
          <h2
            class="text-on-surface-variant text-sm font-medium tracking-wide uppercase mb-2"
          >
            Total Portfolio Value
          </h2>
          <div class="flex items-baseline gap-4">
            <span
              class="text-4xl md:text-5xl font-black text-on-surface tracking-tighter"
            >
              {totalPL >= 0 ? "$" : "-$"}{Math.abs(totalPL).toLocaleString(
                undefined,
                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
              )}
            </span>
            <span
              class="flex items-center gap-1 {startupPortfolioPercent >= 0
                ? 'text-primary'
                : 'text-secondary'} font-bold text-lg"
            >
              <span
                class="material-symbols-outlined text-sm"
                id="total-portfolio-value-percentage-and-arrow"
                >{startupPortfolioPercent >= 0
                  ? "north_east"
                  : "south_east"}</span
              >
              {Math.abs(startupPortfolioPercent).toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}%
            </span>
          </div>
        </div>
        <div
          class="absolute right-0 bottom-0 w-1/2 h-full opacity-10 pointer-events-none"
        >
          <svg
            class="w-full h-full text-primary"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              d="M0 80 Q 25 70, 40 40 T 70 30 T 100 0 V 100 H 0 Z"
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </div>

      <div
        class="p-8 rounded-xl bg-surface-container-low border border-primary/5"
      >
        <h2
          class="text-on-surface-variant text-sm font-medium tracking-wide uppercase mb-2"
        >
          Daily Change
        </h2>
        <div
          class="text-3xl font-bold {($portfolioStore?.dailyChange ?? 0) >= 0
            ? 'text-primary'
            : 'text-secondary'} mb-1"
        >
          {($portfolioStore?.dailyChange ?? 0) >= 0 ? "+" : "-"} ${$portfolioStore
            ? Math.abs($portfolioStore.dailyChange).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"}
        </div>
        <p class="text-xs text-on-surface-variant" id="last-updated-label">
          Last updated: {timeAgo}
        </p>
        <div class="mt-4 flex items-center gap-2">
          <div
            class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden"
          >
            <div
              class="h-full {($portfolioStore?.dailyChange ?? 0) >= 0
                ? 'bg-primary'
                : 'bg-secondary'} rounded-full"
              style="width: {$portfolioStore?.goalPercentage || 65}%;"
            ></div>
          </div>
          <span
            class="text-[10px] text-on-surface-variant font-bold whitespace-nowrap"
            >Goal {$portfolioStore?.goalPercentage || 65}%</span
          >
        </div>
      </div>
    </section>

    <section
      class="bg-surface-container-low rounded-xl overflow-hidden shadow-2xl"
    >
      <div
        class="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container"
      >
        <h3 class="font-bold text-lg">Active Positions</h3>
      </div>
      <!-- <div class="overflow-x-auto"> -->
      <!-- <div class="overflow-x-auto touch-pan-x touch-pan-y overscroll-y-auto"> -->
      <div>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="text-on-surface-variant text-[11px] uppercase tracking-widest bg-surface-container-lowest/50"
            >
              <th class="px-6 py-4 font-semibold">Stock Symbol</th>
              <th class="px-6 py-4 font-semibold text-right">Current Price</th>
              <th class="px-6 py-4 font-semibold text-right">Book Price</th>
              <th class="px-6 py-4 font-semibold text-right">Shares</th>
              <th class="px-6 py-4 font-semibold text-right">P/L (Total)</th>
              <th class="px-6 py-4 font-semibold text-right">Performance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/5">
            {#each $positionsStore as pos}
              <tr
                onclick={() => navigate("/chart", pos.symbol)}
                class="hover:bg-surface-container-high transition-colors cursor-pointer group"
              >
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div
                      class="text-on-surface font-bold group-hover:text-primary transition-colors"
                    >
                      {pos.symbol}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5 text-right font-mono text-on-surface"
                  >{pos.currentPrice}</td
                >
                <td
                  class="px-6 py-5 text-right font-mono text-on-surface-variant"
                  >{pos.bookPrice}</td
                >
                <td class="px-6 py-5 text-right font-mono text-on-surface"
                  >{pos.shares}</td
                >
                <td
                  class="px-6 py-5 text-right font-bold {pos.pl >= 0
                    ? 'text-primary'
                    : 'text-secondary'}">{pos.pl}</td
                >
                <td class="px-6 py-5 text-right">
                  <span
                    class="px-2 py-1 rounded-sm text-[10px] font-black {pos.performance >=
                    0
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/10 text-secondary'}"
                    >{pos.performance}%</span
                  >
                </td>
              </tr>
            {:else}
              <tr>
                <td
                  colspan="6"
                  class="px-6 py-8 text-center text-on-surface-variant font-mono text-sm"
                  >Waiting for live data...</td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  </main>
</div>
