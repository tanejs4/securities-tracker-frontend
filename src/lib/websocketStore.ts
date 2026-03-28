import { writable } from 'svelte/store';
import type { Position, PortfolioOverview, ChartDataPoint } from './api.js';

// Config
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// Stores
export const positionsStore = writable<Position[]>([]);
export const portfolioStore = writable<PortfolioOverview | null>(null);
export const chartLiveTickStore = writable<ChartDataPoint | null>(null);
export const wsConnectionStatus = writable<'disconnected' | 'connecting' | 'connected'>('disconnected');

let socket: WebSocket | null = null;

export function initWebSocket(symbolToSubscribe?: string) {
    if (typeof window === 'undefined') return null;
    
    // Prevent multiple connections
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return socket;
    }

    wsConnectionStatus.set('connecting');
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log('WebSocket connected');
        wsConnectionStatus.set('connected');
        
        // Example: Subscribe to global updates + specific chart symbol if provided
        const initPayload = {
            action: 'subscribe',
            channels: ['portfolio_updates', 'positions_updates']
        };
        
        if (symbolToSubscribe) {
            initPayload.channels.push(`chart_ticks:${symbolToSubscribe}`);
        }
        
        socket?.send(JSON.stringify(initPayload));
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Expected schema: { type: 'EVENT_NAME', payload: any }
            switch (data.type) {
                case 'POSITIONS_UPDATE':
                    // Payload is array of Position
                    positionsStore.set(data.payload);
                    break;
                case 'PORTFOLIO_UPDATE':
                    // Payload is PortfolioOverview
                    portfolioStore.set(data.payload);
                    break;
                case 'CHART_TICK':
                    // Payload is ChartDataPoint
                    chartLiveTickStore.set(data.payload);
                    break;
                default:
                    console.warn('Unknown WS message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    socket.onclose = () => {
        console.log('WebSocket disconnected');
        wsConnectionStatus.set('disconnected');
        socket = null;
        // Depending on requirements, implement auto-reconnect logic here
    };

    socket.onerror = (err) => {
        console.error('WebSocket error:', err);
    };

    return {
        close: () => {
            if (socket) socket.close();
        },
        subscribeToSymbol: (symbol: string) => {
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: 'subscribe', channels: [`chart_ticks:${symbol}`] }));
            }
        },
        unsubscribeFromSymbol: (symbol: string) => {
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ action: 'unsubscribe', channels: [`chart_ticks:${symbol}`] }));
            }
        }
    };
}
