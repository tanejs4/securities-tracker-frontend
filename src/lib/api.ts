// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// --- Types/Schemas ---

export interface PortfolioOverview {
    totalValue: number;
    dailyChange: number;
    dailyChangePercent: number;
    goalPercentage: number;
}

export interface Position {
    symbol: string;
    currentPrice: number;
    bookPrice: number;
    shares: number;
    pl: number;
    performance: number;
}

export interface ChartDataPoint {
    time: number; // Unix timestamp
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// --- API Methods ---

/**
 * GET /api/portfolio
 * Retrieves the high-level portfolio overview.
 */
export async function fetchPortfolioOverview(): Promise<PortfolioOverview> {
    const response = await fetch(`${API_BASE_URL}/portfolio`);
    if (!response.ok) throw new Error('Failed to fetch portfolio overview');
    return await response.json();
}

/**
 * GET /api/startup_portflio
 * Retrieves the numeric value of the startup portfolio.
 */
export async function fetchStartupPortfolio(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/startup_portflio`);
    if (!response.ok) throw new Error('Failed to fetch startup portfolio');
    return await response.json();
}

/**
 * GET /api/symbol_name
 * Retrieves the formatted symbol name.
 */
export async function fetchSymbolName(symbol: string): Promise<{name: string}> {
    const params = new URLSearchParams({ symbol });
    const response = await fetch(`${API_BASE_URL}/symbol_name?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch symbol name');
    return await response.json();
}

/**
 * GET /api/positions
 * Retrieves the current list of active positions.
 */
export async function fetchPositions(): Promise<Position[]> {
    const response = await fetch(`${API_BASE_URL}/positions`);
    if (!response.ok) throw new Error('Failed to fetch positions');
    return await response.json();
}

/**
 * GET /api/chart/history?symbol=BTC/USDT&timeframe=15m
 * Retrieves historical OHLCV data for rendering the chart.
 */
export async function fetchChartHistory(symbol: string, timeframe: string): Promise<ChartDataPoint[]> {
    const params = new URLSearchParams({ symbol, timeframe });
    const response = await fetch(`${API_BASE_URL}/chart/history?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch chart history');
    return await response.json();
}
