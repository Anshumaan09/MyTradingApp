import React from 'react';
import { Link } from 'react-router-dom';
import './LandingTailwind.css';

export const Landing = () => {
    return (
        <div className="font-display text-slate-100 overflow-x-hidden mesh-bg selection:bg-primary selection:text-white" style={{ minHeight: '100vh', backgroundColor: '#05010d' }}>
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full cinematic-flare animate-pulse" style={{ animationDuration: '10s' }}></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full cinematic-flare-cyan"></div>
                <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px]"></div>
            </div>

            <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/5 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative bg-gradient-to-br from-primary to-purple-800 p-2 rounded-xl shadow-neon">
                                <span className="material-symbols-outlined text-white font-bold text-xl">rocket_launch</span>
                            </div>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-wide text-white uppercase group-hover:text-primary transition-colors">NexusTrade</h2>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 bg-white/5 px-6 py-2 rounded-full border border-white/5 backdrop-blur-md">
                        <a className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group" href="#markets">
                            Markets
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full shadow-[0_0_10px_#00f0ff]"></span>
                        </a>
                        <a className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group" href="#assets">
                            Assets
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full shadow-[0_0_10px_#00f0ff]"></span>
                        </a>
                        <a className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group" href="#platform">
                            Platform
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full shadow-[0_0_10px_#00f0ff]"></span>
                        </a>
                        <a className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group" href="#learn">
                            Learn
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full shadow-[0_0_10px_#00f0ff]"></span>
                        </a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link to="/auth" className="text-sm font-bold text-slate-300 px-5 py-2 hover:text-white transition-colors">Login</Link>
                        <Link to="/auth" className="relative overflow-hidden group bg-transparent border border-primary text-white text-sm font-extrabold px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(176,38,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all">
                            <span className="relative z-10 group-hover:text-black transition-colors">Get Started</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-secondary translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        </Link>
                    </div>
                </div>
            </header>

            <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-secondary rounded-full shadow-[0_0_10px_#00f0ff]"></div>
                    <div className="absolute top-[35%] right-[20%] w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_15px_#b026ff]"></div>
                    <div className="absolute bottom-[20%] left-[30%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-10">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-xl shadow-inner-light">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary shadow-[0_0_10px_#00f0ff]"></span>
                            </span>
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-secondary">Live Market Access</span>
                        </div>

                        <h1 className="text-6xl lg:text-8xl font-black leading-[0.95] tracking-tight text-white drop-shadow-2xl">
                            Master Your Wealth with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300">Multi-Asset</span>
                            <span className="text-primary text-glow block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Trading.</span>
                        </h1>

                        <p className="text-lg text-slate-400 max-w-lg leading-relaxed font-light tracking-wide">
                            Trade stocks, crypto, and mutual funds on a high-voltage platform designed for the future. Precision, speed, and security redefined.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 pt-4">
                            <Link to="/auth" className="group relative px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-neon overflow-hidden transition-all hover:scale-105 hover:shadow-cyan-glow">
                                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center gap-2 text-lg z-10">
                                    Start Trading <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </span>
                            </Link>

                            <button className="px-8 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 hover:border-secondary/50 transition-colors backdrop-blur-md text-white flex items-center gap-2 group">
                                <span className="material-symbols-outlined text-secondary group-hover:text-white transition-colors shadow-[0_0_10px_rgba(0,240,255,0.5)] rounded-full">play_circle</span> View Demo
                            </button>
                        </div>

                        <div className="flex items-center gap-6 pt-4 text-sm font-medium text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-lg">verified_user</span> No hidden fees
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-lg">verified_user</span> Bank-grade security
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[600px] flex items-center justify-center perspective-container">
                        <div className="absolute top-[10%] right-[10%] w-32 h-32 bg-primary/30 rounded-full blur-[50px] floating-slow"></div>
                        <div className="absolute bottom-[20%] left-[10%] w-40 h-40 bg-secondary/20 rounded-full blur-[60px] floating-medium"></div>

                        <div className="relative w-full max-w-[500px] aspect-[4/5] card-3d">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/20 rounded-[2rem] blur-2xl transform translate-z-[-20px]"></div>
                            <div className="absolute inset-0 glass-card-strong rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden z-20 border-t border-l border-white/20">

                                <div className="flex justify-between items-start layer-1">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg group">
                                            <span className="material-symbols-outlined text-secondary group-hover:text-white transition-colors">show_chart</span>
                                        </div>
                                        <div>
                                            <h4 className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Total Balance</h4>
                                            <p className="text-3xl font-black text-white tracking-tight">$124,592.80</p>
                                        </div>
                                    </div>
                                    <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_10px_rgba(176,38,255,0.3)]">
                                        <span className="text-secondary text-xs font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">trending_up</span> +12.4%
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 relative mt-8 mb-4 layer-2">
                                    <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                                        <div className="w-full h-px bg-white"></div>
                                        <div className="w-full h-px bg-white"></div>
                                        <div className="w-full h-px bg-white"></div>
                                        <div className="w-full h-px bg-white"></div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-[70%] bg-gradient-to-t from-primary/30 to-transparent clip-path-chart z-0"></div>

                                    <svg className="absolute bottom-0 left-0 w-full h-[70%] overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                                <stop offset="0%" style={{ stopColor: '#b026ff', stopOpacity: 0.2 }}></stop>
                                                <stop offset="50%" style={{ stopColor: '#b026ff', stopOpacity: 1 }}></stop>
                                                <stop offset="100%" style={{ stopColor: '#00f0ff', stopOpacity: 1 }}></stop>
                                            </linearGradient>
                                            <filter height="140%" id="glow" width="140%" x="-20%" y="-20%">
                                                <feGaussianBlur result="coloredBlur" stdDeviation="2"></feGaussianBlur>
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur"></feMergeNode>
                                                    <feMergeNode in="SourceGraphic"></feMergeNode>
                                                </feMerge>
                                            </filter>
                                        </defs>

                                        <path d="M0,80 Q20,70 30,50 T60,40 T100,10" fill="none" filter="url(#glow)" stroke="url(#lineGradient)" strokeWidth="3"></path>
                                        <circle cx="100" cy="10" fill="#fff" filter="url(#glow)" r="4"></circle>
                                    </svg>
                                </div>

                                <div className="grid grid-cols-2 gap-4 layer-3">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_orange]"></div>
                                            <span className="text-xs text-slate-400 group-hover:text-white font-bold uppercase transition-colors">Bitcoin</span>
                                        </div>
                                        <p className="text-lg font-bold">$42,301</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 hover:border-secondary/30 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_blue]"></div>
                                            <span className="text-xs text-slate-400 group-hover:text-white font-bold uppercase transition-colors">Apple Inc.</span>
                                        </div>
                                        <p className="text-lg font-bold">$178.32</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -top-12 -right-8 w-20 h-20 glass-card-strong rounded-2xl flex items-center justify-center floating-medium transform translate-z-[80px] z-30 border border-primary/30">
                                <span className="material-symbols-outlined text-4xl bg-gradient-to-b from-yellow-300 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm">currency_bitcoin</span>
                            </div>

                            <div className="absolute bottom-20 -left-12 w-16 h-16 glass-card-strong rounded-2xl flex items-center justify-center floating-fast transform translate-z-[40px] z-30 border border-secondary/30">
                                <span className="material-symbols-outlined text-3xl bg-gradient-to-b from-secondary to-blue-600 bg-clip-text text-transparent">account_balance</span>
                            </div>

                            <div className="absolute -bottom-6 right-12 px-6 py-3 glass-card-strong rounded-xl flex items-center gap-3 floating-slow transform translate-z-[60px] z-30 border-t border-secondary/50 shadow-cyan-glow">
                                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]"></div>
                                <span className="text-sm font-bold text-white">Market Open</span>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 relative z-20 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 skew-y-[-2deg] transform origin-top-left scale-110 border-y border-white/5"></div>
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                        <div className="flex flex-col gap-2 shrink-0">
                            <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">Trusted by over</p>
                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-400">1M+ Traders</p>
                            <div className="flex gap-1 text-primary drop-shadow-[0_0_8px_rgba(176,38,255,0.5)]">
                                <span className="material-symbols-outlined fill-1 text-xl">star</span>
                                <span className="material-symbols-outlined fill-1 text-xl">star</span>
                                <span className="material-symbols-outlined fill-1 text-xl">star</span>
                                <span className="material-symbols-outlined fill-1 text-xl">star</span>
                                <span className="material-symbols-outlined fill-1 text-xl">star</span>
                            </div>
                        </div>

                        <div className="flex-1 w-full overflow-hidden mask-image-gradient">
                            <div className="flex gap-10 items-center whitespace-nowrap opacity-60 overflow-hidden">
                                <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer group">
                                    <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-secondary transition-colors">newspaper</span>
                                    <span className="text-xl font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white transition-colors">Bloomberg</span>
                                </div>
                                <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer group">
                                    <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-secondary transition-colors">feed</span>
                                    <span className="text-xl font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white transition-colors">Wall Street</span>
                                </div>
                                <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer group">
                                    <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-secondary transition-colors">query_stats</span>
                                    <span className="text-xl font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white transition-colors">Forbes</span>
                                </div>
                                <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer group">
                                    <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-secondary transition-colors">public</span>
                                    <span className="text-xl font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white transition-colors">TechCrunch</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-40 relative">
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-28">
                        <span className="text-secondary font-bold tracking-widest text-sm uppercase mb-4 block drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">Pro Features</span>
                        <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Built for Serious <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-purple-500">Investors</span></h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-xl leading-relaxed font-light">Institutional-grade tools available to everyone. Trade global markets with a unified, powerful interface.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="glass-card-strong p-10 rounded-[2rem] group hover:-translate-y-4 transition-all duration-500 relative overflow-hidden border border-white/5 hover:border-primary/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute -right-10 -top-10 bg-primary/20 w-32 h-32 blur-3xl group-hover:bg-primary/30 transition-all"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-10 shadow-lg group-hover:shadow-neon transition-shadow duration-500">
                                    <span className="material-symbols-outlined text-3xl metal-icon">public</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Global Access</h3>
                                <p className="text-slate-400 leading-relaxed">Access 50+ global stock exchanges and 3,000+ cryptocurrencies from a single unified account.</p>
                                <div className="mt-8 flex items-center text-white text-sm font-bold gap-2 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity">
                                    Explore Markets <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card-strong p-10 rounded-[2rem] group hover:-translate-y-4 transition-all duration-500 relative overflow-hidden border border-white/5 hover:border-secondary/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute -right-10 -top-10 bg-secondary/20 w-32 h-32 blur-3xl group-hover:bg-secondary/30 transition-all"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-10 shadow-lg group-hover:shadow-cyan-glow transition-shadow duration-500">
                                    <span className="material-symbols-outlined text-3xl metal-icon">analytics</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Real-time Analytics</h3>
                                <p className="text-slate-400 leading-relaxed">Lightning-fast charts and institutional-grade analytical tools to help you make informed decisions.</p>
                                <div className="mt-8 flex items-center text-white text-sm font-bold gap-2 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity">
                                    View Tools <span className="material-symbols-outlined text-secondary text-sm">arrow_forward</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card-strong p-10 rounded-[2rem] group hover:-translate-y-4 transition-all duration-500 relative overflow-hidden border border-white/5 hover:border-purple-400/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute -right-10 -top-10 bg-purple-500/20 w-32 h-32 blur-3xl group-hover:bg-purple-500/30 transition-all"></div>
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-10 shadow-lg group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-shadow duration-500">
                                    <span className="material-symbols-outlined text-3xl metal-icon">domain</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white">Indian Market Specialists</h3>
                                <p className="text-slate-400 leading-relaxed">Seamlessly trade on NSE/BSE with localized insights and dedicated relationship managers.</p>
                                <div className="mt-8 flex items-center text-white text-sm font-bold gap-2 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity">
                                    Start Local <span className="material-symbols-outlined text-purple-400 text-sm">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-40 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="relative rounded-[3rem] p-16 md:p-24 overflow-hidden text-center group">
                        <div className="absolute inset-0 bg-background-dark border border-primary/20"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/10 to-transparent opacity-50"></div>
                        <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] organic-shape opacity-30 blur-[100px]"></div>
                        <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-secondary rounded-full opacity-20 blur-[120px]"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                        <div className="relative z-10">
                            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight drop-shadow-2xl">
                                Ready to transform <br />your trading journey?
                            </h2>
                            <p className="text-xl font-light mb-12 text-slate-300 max-w-2xl mx-auto">
                                Join over a million traders who are already mastering their wealth with NexusTrade's premium tools.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <button className="bg-primary hover:bg-white text-white hover:text-black px-12 py-5 rounded-full font-black text-lg transition-all transform hover:scale-105 shadow-neon flex items-center gap-2">
                                    Get Started Now <span className="material-symbols-outlined text-xl">rocket_launch</span>
                                </button>
                                <button className="bg-transparent border border-white/20 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10 hover:border-secondary/50 hover:text-secondary transition-all backdrop-blur-sm">
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-24 border-t border-white/5 bg-black/40 backdrop-blur-xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
                        <div className="col-span-2">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-primary/10 border border-primary/30 p-2 rounded-xl">
                                    <span className="material-symbols-outlined text-primary font-bold">rocket_launch</span>
                                </div>
                                <h2 className="text-xl font-extrabold tracking-wide text-white uppercase">NexusTrade</h2>
                            </div>
                            <p className="text-slate-500 max-w-sm leading-relaxed mb-8 font-light">
                                The ultimate multi-asset trading platform for the modern investor. Regulated, secure, and lightning fast. Experience the future of finance.
                            </p>
                            <div className="flex gap-4">
                                <a className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-neon" href="#share">
                                    <span className="material-symbols-outlined text-sm">share</span>
                                </a>
                                <a className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-neon" href="#web">
                                    <span className="material-symbols-outlined text-sm">language</span>
                                </a>
                                <a className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-neon" href="#email">
                                    <span className="material-symbols-outlined text-sm">mail</span>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6 tracking-wide">Product</h4>
                            <ul className="space-y-4 text-slate-500 text-sm font-medium">
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Markets</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Trading Platform</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Crypto Wallet</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Mobile App</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-6 tracking-wide">Company</h4>
                            <ul className="space-y-4 text-slate-500 text-sm font-medium">
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">About Us</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Careers</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Legal &amp; Privacy</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-6 tracking-wide">Support</h4>
                            <ul className="space-y-4 text-slate-500 text-sm font-medium">
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Help Center</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">API Docs</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Community</a></li>
                                <li><a className="hover:text-primary transition-colors block hover:translate-x-1" href="#t">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 text-slate-600 text-xs font-medium">
                        <p>© 2026 NexusTrade Technologies. All rights reserved.</p>
                        <div className="flex gap-8 mt-4 md:mt-0">
                            <a className="hover:text-white transition-colors" href="/legal">Terms of Service</a>
                            <a className="hover:text-white transition-colors" href="/legal">Privacy Policy</a>
                            <a className="hover:text-white transition-colors" href="/legal">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
