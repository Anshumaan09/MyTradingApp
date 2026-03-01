import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { useSymbolPrice } from '../lib/useMarketData';

const ChartComponent = ({ basePrice = 1000, symbol }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const [chartError, setChartError] = useState(false);
    const lastCandleRef = useRef(null);

    // Subscribe to live ticks for this symbol
    const { price: livePrice } = useSymbolPrice(symbol);

    // Initialize chart with historical candles based on basePrice
    useEffect(() => {
        if (!chartContainerRef.current) return;

        let chart;
        try {
            const containerWidth = chartContainerRef.current.clientWidth || 600;

            chart = createChart(chartContainerRef.current, {
                width: containerWidth,
                height: 480,
                layout: {
                    background: { color: 'transparent' },
                    textColor: '#94a3b8',
                },
                grid: {
                    vertLines: { color: 'rgba(45, 45, 59, 0.5)' },
                    horzLines: { color: 'rgba(45, 45, 59, 0.5)' },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
                crosshair: {
                    mode: 1,
                }
            });

            const candlestickSeries = chart.addSeries(CandlestickSeries, {
                upColor: '#10b981',
                downColor: '#ef4444',
                borderVisible: false,
                wickUpColor: '#10b981',
                wickDownColor: '#ef4444',
            });

            // Generate realistic historical data based on the ACTUAL instrument price
            const bp = basePrice || 1000;
            const volatilityFactor = bp > 10000 ? 0.001 : bp > 100 ? 0.002 : bp > 1 ? 0.005 : 0.01;
            let time = Math.floor(Date.now() / 1000) - (100 * 60);
            let currentPrice = bp * (0.97 + Math.random() * 0.03); // start 0-3% below current
            const data = [];

            for (let i = 0; i < 100; i++) {
                const volatility = currentPrice * volatilityFactor;
                const open = currentPrice;
                const close = open + (Math.random() - 0.48) * volatility; // slight upward bias
                const high = Math.max(open, close) + Math.random() * volatility * 0.5;
                const low = Math.min(open, close) - Math.random() * volatility * 0.5;
                data.push({
                    time,
                    open: +open.toFixed(bp < 1 ? 6 : 2),
                    high: +high.toFixed(bp < 1 ? 6 : 2),
                    low: +low.toFixed(bp < 1 ? 6 : 2),
                    close: +close.toFixed(bp < 1 ? 6 : 2)
                });
                time += 60;
                currentPrice = close;
            }

            // Ensure the last candle ends near the actual price
            const lastCandle = data[data.length - 1];
            lastCandle.close = +bp.toFixed(bp < 1 ? 6 : 2);
            lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
            lastCandle.low = Math.min(lastCandle.low, lastCandle.close);

            candlestickSeries.setData(data);
            chart.timeScale().fitContent();
            lastCandleRef.current = { ...lastCandle };

            chartRef.current = chart;
            seriesRef.current = candlestickSeries;

            const handleResize = () => {
                if (chartContainerRef.current) {
                    chart.applyOptions({ width: chartContainerRef.current.clientWidth });
                }
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                chart.remove();
                chartRef.current = null;
                seriesRef.current = null;
            };
        } catch (err) {
            console.error('Chart initialization failed:', err);
            setChartError(true);
        }
    }, [basePrice, symbol]);

    // Update chart in real-time with live ticks
    useEffect(() => {
        if (!seriesRef.current || !livePrice || !lastCandleRef.current) return;

        const now = Math.floor(Date.now() / 1000);
        const minuteBucket = now - (now % 60);
        const ltp = livePrice.ltp;
        const decimals = basePrice < 1 ? 6 : 2;

        const last = lastCandleRef.current;

        if (last.time === minuteBucket) {
            // Update current candle
            last.close = +ltp.toFixed(decimals);
            last.high = +Math.max(last.high, ltp).toFixed(decimals);
            last.low = +Math.min(last.low, ltp).toFixed(decimals);
        } else {
            // New candle
            lastCandleRef.current = {
                time: minuteBucket,
                open: +ltp.toFixed(decimals),
                high: +ltp.toFixed(decimals),
                low: +ltp.toFixed(decimals),
                close: +ltp.toFixed(decimals)
            };
        }

        seriesRef.current.update(lastCandleRef.current);
    }, [livePrice]);

    if (chartError) {
        return <div className="flex-center" style={{ height: '480px', color: 'var(--text-muted)' }}>Chart failed to initialize. Please refresh.</div>;
    }

    return <div ref={chartContainerRef} style={{ width: '100%', minHeight: '480px' }} />;
};

export const MarketView = ({ assetId = 'RELIANCE', assetName = 'Reliance Industries', price = 2890, change = 0.85 }) => {
    const [activeTab, setActiveTab] = useState('chart');

    // Live price for this symbol
    const { price: livePrice, isLive } = useSymbolPrice(assetId);
    const displayPrice = livePrice?.ltp || price;
    const displayChange = livePrice?.changePercent ?? change;
    const isPositive = displayChange >= 0;

    // Determine currency
    const isForeign = assetId.includes('USDT') || assetId.includes('EURUSD') || assetId.includes('GBPUSD');
    const currencySymbol = isForeign ? '$' : '₹';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            <div className="flex-between">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {assetId}
                        <span style={{
                            fontSize: '1.25rem',
                            color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
                            fontWeight: '600', fontFamily: 'var(--font-mono)',
                            transition: 'color 0.15s'
                        }}>
                            {currencySymbol}{displayPrice.toLocaleString(isForeign ? 'en-US' : 'en-IN', {
                                minimumFractionDigits: displayPrice < 1 ? 4 : 2,
                                maximumFractionDigits: displayPrice < 1 ? 6 : 2
                            })}
                        </span>
                        {isLive && <span style={{ fontSize: '0.6rem', color: 'var(--color-success)', verticalAlign: 'super' }}>● LIVE</span>}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{assetName}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '120px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Change</span>
                        <span className={`text-mono ${isPositive ? 'color-success' : 'color-danger'}`} style={{ fontWeight: '600' }}>
                            {isPositive ? '+' : ''}{displayChange.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem', flex: 1 }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: '550px', height: 'auto' }}>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                        <button
                            style={{
                                background: 'none', border: 'none',
                                color: activeTab === 'chart' ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: activeTab === 'chart' ? '600' : '500',
                                cursor: 'pointer'
                            }}
                            onClick={() => setActiveTab('chart')}
                        >
                            Price Chart
                        </button>
                        <button
                            style={{
                                background: 'none', border: 'none',
                                color: activeTab === 'depth' ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: activeTab === 'depth' ? '600' : '500',
                                cursor: 'pointer'
                            }}
                            onClick={() => setActiveTab('depth')}
                        >
                            Depth Chart
                        </button>
                    </div>

                    <div style={{ flex: 1, position: 'relative' }}>
                        {activeTab === 'chart' && <ChartComponent basePrice={price} symbol={assetId} />}
                        {activeTab === 'depth' && (
                            <div className="flex-center" style={{ height: '100%', backgroundColor: 'var(--bg-base)', borderRadius: '8px' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Order Book Depth Visualization coming soon</p>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Order Book Panel */}
                    <div className="card" style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span className="card-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Order Book (L2)</span>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                            <div className="flex-between text-mono" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                                <span>Price</span>
                                <span>Size</span>
                            </div>

                            {/* Asks (Sell) */}
                            {[...Array(8)].map((_, i) => {
                                const askPrice = displayPrice + (8 - i) * (displayPrice * 0.0002);
                                return (
                                    <div key={`ask-${i}`} className="flex-between text-mono" style={{ color: 'var(--color-danger)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${20 + Math.random() * 80}%`, backgroundColor: 'var(--color-danger-bg)', zIndex: 0 }} />
                                        <span style={{ zIndex: 1 }}>{currencySymbol}{askPrice.toLocaleString(isForeign ? 'en-US' : 'en-IN', { minimumFractionDigits: displayPrice < 1 ? 4 : 2 })}</span>
                                        <span style={{ zIndex: 1 }}>{(Math.random() * 50 + 1).toFixed(displayPrice < 10 ? 4 : 0)}</span>
                                    </div>
                                );
                            })}

                            <div className="flex-center text-mono" style={{ padding: '0.5rem 0', fontWeight: '600', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', margin: '0.5rem 0', fontSize: '1rem', color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                {currencySymbol}{displayPrice.toLocaleString(isForeign ? 'en-US' : 'en-IN', { minimumFractionDigits: displayPrice < 1 ? 4 : 2 })}
                            </div>

                            {/* Bids (Buy) */}
                            {[...Array(8)].map((_, i) => {
                                const bidPrice = displayPrice - (i + 1) * (displayPrice * 0.0002);
                                return (
                                    <div key={`bid-${i}`} className="flex-between text-mono" style={{ color: 'var(--color-success)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${20 + Math.random() * 80}%`, backgroundColor: 'var(--color-success-bg)', zIndex: 0 }} />
                                        <span style={{ zIndex: 1 }}>{currencySymbol}{bidPrice.toLocaleString(isForeign ? 'en-US' : 'en-IN', { minimumFractionDigits: displayPrice < 1 ? 4 : 2 })}</span>
                                        <span style={{ zIndex: 1 }}>{(Math.random() * 50 + 1).toFixed(displayPrice < 10 ? 4 : 0)}</span>
                                    </div>
                                );
                            })}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
