<script lang="ts">
    import { onMount } from 'svelte';
    import PortfolioScreen from '$lib/PortfolioScreen.svelte';
    import ChartScreen from '$lib/ChartScreen.svelte';

    let currentRoute = $state('/');
    let selectedSymbol = $state('BTC-CAD');
    
    function navigate(path: string, symbol?: string) {
        currentRoute = path;
        if (symbol) {
            selectedSymbol = symbol;
        }
        window.history.pushState({}, '', path);
    }

    onMount(() => {
        currentRoute = window.location.pathname === '/chart' ? '/chart' : '/';
        
        window.onpopstate = () => {
            currentRoute = window.location.pathname;
        };
    });
</script>

{#if currentRoute === '/chart'}
    <ChartScreen {navigate} symbol={selectedSymbol} />
{:else}
    <PortfolioScreen {navigate} />
{/if}
