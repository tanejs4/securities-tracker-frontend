<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fetchChartHistory, fetchSymbolName, fetchPositions } from "./api.js";
  import { chartLiveTickStore, initWebSocket } from "./websocketStore.js";
  import {
    createChart,
    ColorType,
    type IChartApi,
    type ISeriesApi,
    CandlestickSeries,
    BaselineSeries,
  } from "lightweight-charts";

  let { navigate, symbol = "BTC/USDT" } = $props();

  let chartContainer: HTMLElement;
  let chart: IChartApi;
  let activeSeries:
    | ISeriesApi<"Candlestick">
    | ISeriesApi<"Baseline">
    | undefined;

  let chartData = $state([]);
  let symbolName = $state("Loading...");
  let lastTickTime = $state(Date.now());
  let isLive = $state(true);

  let selectedTimeframe = $state("1H");
  //   const timeframes = ["15m", "1H", "1D", "1M"];
  const timeframes = ["1H", "1D", "1W", "1M"];

  let bookPrice = $state<number | null>(null);
  let chartType = $state<"baseline" | "candlestick">("candlestick");

  function createSeries(type: "baseline" | "candlestick") {
    if (activeSeries) {
      chart.removeSeries(activeSeries);
    }

    if (type === "baseline" && bookPrice !== null) {
      activeSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: "price", price: bookPrice },
        topLineColor: "rgba( 38, 166, 154, 1)",
        topFillColor1: "rgba( 38, 166, 154, 0.28)",
        topFillColor2: "rgba( 38, 166, 154, 0.05)",
        bottomLineColor: "rgba( 239, 83, 80, 1)",
        bottomFillColor1: "rgba( 239, 83, 80, 0.05)",
        bottomFillColor2: "rgba( 239, 83, 80, 0.28)",
        autoscaleInfoProvider: (original: () => any) => {
          const res = original();
          if (res !== null && res.priceRange !== null) {
            res.priceRange.minValue = Math.min(
              res.priceRange.minValue,
              bookPrice!,
            );
            res.priceRange.maxValue = Math.max(
              res.priceRange.maxValue,
              bookPrice!,
            );
          }
          return res;
        },
      });
      activeSeries.createPriceLine({
        price: bookPrice,
        color: "rgba(255, 255, 255, 0.6)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Book Price",
      });
      if (chartData.length > 0) {
        activeSeries.setData(
          chartData.map((d: any) => ({ time: d.time, value: d.close })) as any,
        );
      }
    } else {
      activeSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
      if (chartData.length > 0) {
        activeSeries.setData(chartData as any);
      }
    }

    chartType = type;
  }

  $effect(() => {
    if ($chartLiveTickStore && activeSeries) {
      lastTickTime = Date.now();
      try {
        if (chartType === "baseline") {
          const tick = $chartLiveTickStore as any;
          activeSeries.update({ time: tick.time, value: tick.close } as any);
        } else {
          activeSeries.update($chartLiveTickStore as any);
        }
      } catch (e) {
        // Safe to ignore if time is older than the last candle
      }
    }
  });

  $effect(() => {
    const interval = setInterval(() => {
      isLive = Date.now() - lastTickTime < 60000;
    }, 1000);

    const pollInterval = setInterval(() => {
      loadData(selectedTimeframe, true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  });

  async function loadData(timeframe: string, isUpdate = false) {
    try {
      const data = await fetchChartHistory(symbol, timeframe);
      chartData = data as any;
      if (activeSeries) {
        if (chartType === "baseline") {
          activeSeries.setData(
            data.map((d: any) => ({ time: d.time, value: d.close })) as any,
          );
        } else {
          activeSeries.setData(data as any);
        }
        if (!isUpdate) {
          chart.timeScale().fitContent();
        }
        lastTickTime = Date.now();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleTimeframeChange(tf: string) {
    selectedTimeframe = tf;
    loadData(tf);
  }

  onMount(() => {
    chart = createChart(chartContainer, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b949e",
      },
      grid: {
        vertLines: { color: "rgba(43, 43, 67, 0.1)" },
        horzLines: { color: "rgba(43, 43, 67, 0.1)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: "rgba(43, 43, 67, 0.5)",
      },
    });

    fetchPositions()
      .then((positions) => {
        const pos = positions.find((p: any) => p.symbol === symbol);
        if (pos && pos.bookPrice !== undefined) {
          bookPrice = pos.bookPrice;
          createSeries("baseline");
        } else if (pos && (pos as any).book_price !== undefined) {
          bookPrice = (pos as any).book_price;
          createSeries("baseline");
        } else {
          createSeries("candlestick");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch positions:", err);
        createSeries("candlestick");
      });

    const handleResize = () => {
      if (chartContainer) {
        chart.applyOptions({
          width: chartContainer.clientWidth,
          height: chartContainer.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    loadData(selectedTimeframe);

    fetchSymbolName(symbol)
      .then((data: any) => {
        symbolName = data.name;
      })
      .catch((err: any) => {
        console.error(err);
        symbolName = symbol;
      });

    const ws = initWebSocket(symbol);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      if (ws) ws.close();
    };
  });
</script>

<div class="flex flex-col h-screen overflow-hidden" id="symbol-chart">
  <div
    class="h-12 flex items-center px-4 bg-surface-container-low border-b border-outline-variant/10 justify-between shrink-0"
  >
    <div class="flex items-center gap-6">
      <button
        onclick={() => navigate("/")}
        class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors pr-6 border-r border-outline-variant/20"
      >
        <span class="material-symbols-outlined text-xl">arrow_back</span>
        <span class="text-xs font-bold uppercase tracking-wider"
          >Back to Portfolio</span
        >
      </button>
      <div
        class="flex items-center gap-2 pr-4 border-r border-outline-variant/20"
      >
        <span class="font-bold text-on-surface tracking-tight">{symbol}</span>
        <!-- <span
          class="text-xs font-bold px-1.5 py-0.5 rounded bg-primary-container/20 text-primary"
          >PERP</span
        > -->
      </div>
      <div class="flex items-center gap-3" id="chart-timeframe-option">
        <div
          class="flex items-center gap-1 bg-surface-container-low rounded p-0.5 border border-outline-variant/10 mr-2"
        >
          <button
            onclick={() => {
              if (bookPrice !== null) createSeries("baseline");
            }}
            disabled={bookPrice === null}
            class="text-xs font-semibold px-2 py-1 rounded transition-colors {chartType ===
            'baseline'
              ? 'bg-surface-container-high text-on-surface'
              : 'text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed'}"
          >
            Baseline
          </button>
          <button
            onclick={() => createSeries("candlestick")}
            class="text-xs font-semibold px-2 py-1 rounded transition-colors {chartType ===
            'candlestick'
              ? 'bg-surface-container-high text-on-surface'
              : 'text-on-surface-variant hover:bg-surface-container-high'}"
          >
            Candles
          </button>
        </div>
        {#each timeframes as tf}
          <button
            onclick={() => handleTimeframeChange(tf)}
            class="text-xs font-semibold px-2 py-1 rounded transition-colors {selectedTimeframe ===
            tf
              ? 'bg-surface-container-high text-on-surface'
              : 'text-on-surface-variant hover:bg-surface-container-high'}"
            >{tf}</button
          >
        {/each}
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div id="live-data-indicator" class="flex items-center gap-2">
        <span
          class="material-symbols-outlined text-lg transition-colors {isLive
            ? 'text-primary animate-pulse'
            : 'text-black'}"
          >circle
        </span>
        <span class="text-xs font-mono font-medium text-primary">LIVE</span>
      </div>
    </div>
  </div>

  <main class="relative flex-1 bg-[#131722] overflow-hidden chart-grid-h">
    <div
      class="absolute top-8 right-12 select-none opacity-5 pointer-events-none z-0"
    >
      <span class="text-[12rem] font-black tracking-tighter text-on-surface"
        >{symbol.split("-")[0].split("/")[0]}</span
      >
    </div>

    <div
      class="absolute top-4 left-6 z-10 flex flex-col gap-1 pointer-events-none"
    >
      <div class="flex items-center gap-2 mb-1">
        <span class="text-sm font-bold text-on-surface" id="chart-symbol-name"
          >{symbolName}</span
        >
      </div>
    </div>

    <div
      id="chart-historic-candle-stick-bar"
      bind:this={chartContainer}
      class="absolute inset-0 mt-16 z-10"
    ></div>
  </main>
</div>
