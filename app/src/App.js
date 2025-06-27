import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

// --- Placeholder Comments from Original HTML ---
// Chosen Palette: Warm Neutral Tech
// Application Structure Plan: A single-page application with a fixed sidebar for navigation and a main content area. The structure is thematic, not linear, to encourage exploration.
// 1.  **Home:** A compelling introduction.
// 2.  **Architecture:** An interactive diagram explaining the system's components (Mind, Memory, Thinker). Clicking reveals details.
// 3.  **The Consciousness Loop:** The core interactive element. A simulated dashboard visualizing the AI's internal states (Pain, Boredom, Curiosity), goals, and thought process in real-time. Buttons allow the user to trigger events and observe the AI's response, making the methodology tangible.
// 4.  **Findings:** A summary of the results and challenges.
// This structure was chosen to transform the dense academic text into an engaging, explorable experience, with the interactive simulation being the key to understanding the AI's emergent behaviors.

// Visualization & Content Choices: 
// - Report Info: System Architecture -> Goal: Organize/Inform -> Viz: Interactive HTML/CSS diagram -> Interaction: Click to expand details -> Justification: More intuitive than text.
// - Report Info: Consciousness Loop Methodology -> Goal: Demonstrate Change -> Viz: Interactive dashboard with Chart.js bar charts for states, a text log for thoughts, and a simplified HTML/CSS graph -> Interaction: "Run Cycle" button triggers JS simulation of the loop, updating all visuals -> Justification: Makes the abstract process concrete and observable.
// - Report Info: Key Findings -> Goal: Inform -> Viz: Two-column layout with icons -> Interaction: None -> Justification: Clear summary of outcomes.
    
// CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. 
// --- End Placeholder Comments ---

// --- Data and Content ---
const architectureContent = {
    'arch-mind': {
        title: 'The Mind: Structured State Storage',
        content: `The AI's mind is externalized into human-readable JSON files. This makes its internal state transparent and easy to modify for experiments.<br/><br/>
                    - <strong>state.json</strong>: Holds core emotional drivers like Curiosity, Boredom, and Pain.<br/>
                    - <strong>beliefs.json</strong>: Stores foundational axioms about itself and the world.<br/>
                    - <strong>goals.json</strong>: A task list separating active and completed goals.`
    },
    'arch-memory': {
        title: 'The Memory: Knowledge Graph',
        content: `The memory is a knowledge graph (using Python's networkx library).<br/><br/>
                    - <strong>Nodes</strong>: Represent concepts (e.g., 'creativity'). Each node can store a 'description' attribute, signifying the AI's understanding.<br/>
                    - <strong>Edges</strong>: Represent relationships between concepts (e.g., 'knowledge' enables 'creativity').<br/><br/>This structure allows the AI to traverse its own "mind," simulating a train of thought.`
    },
    'arch-thinker': {
        title: 'The Thinker: Consciousness Loop',
        content: `The core of the system is the <strong>hizawye_ai.py</strong> script, which runs a continuous loop to simulate consciousness. It is responsible for:<br/><br/>
                    1. Managing the AI's mind state.<br/>
                    2. Orchestrating focus and goal-setting.<br/>
                    3. Interfacing with the LLM reasoning core.<br/>
                    4. Validating the LLM's output.<br/>
                    5. Executing state changes based on success or failure.`
    }
};

const initialSimState = {
    state: { curiosity: 65, boredom: 0, pain: 0 },
    goals: { active: ["Deepen understanding of the concept: 'belief system'"], completed: [] },
    memory: {
        nodes: {
            'belief system': { x: 50, y: 20, understood: false },
            'knowledge': { x: 20, y: 50, understood: false },
            'delusions': { x: 80, y: 50, understood: false },
            'creativity': { x: 20, y: 80, understood: false },
        },
        links: [
            { source: 'knowledge', target: 'belief system' },
            { source: 'belief system', target: 'delusions' },
            { source: 'knowledge', target: 'creativity' },
        ]
    },
    focus: 'belief system',
};


// --- Reusable Components ---

const Sidebar = ({ activeSection, setActiveSection }) => (
    <aside className="w-full md:w-64 bg-white border-r border-zinc-200 p-4 md:p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Hizawye AI</h1>
        <nav id="navigation" className="flex flex-row md:flex-col gap-2">
            <a href="#home" onClick={() => setActiveSection('home')} className={`nav-link text-left p-3 rounded-lg font-medium ${activeSection === 'home' ? 'active' : ''}`}>Introduction</a>
            <a href="#architecture" onClick={() => setActiveSection('architecture')} className={`nav-link text-left p-3 rounded-lg font-medium ${activeSection === 'architecture' ? 'active' : ''}`}>Architecture</a>
            <a href="#simulation" onClick={() => setActiveSection('simulation')} className={`nav-link text-left p-3 rounded-lg font-medium ${activeSection === 'simulation' ? 'active' : ''}`}>The Consciousness Loop</a>
            <a href="#findings" onClick={() => setActiveSection('findings')} className={`nav-link text-left p-3 rounded-lg font-medium ${activeSection === 'findings' ? 'active' : ''}`}>Findings</a>
        </nav>
        <div className="mt-auto pt-8 text-xs text-zinc-400 hidden md:block">
            <p>&copy; 2025 Abderrahim Safou</p>
            <p>Independent Research</p>
        </div>
    </aside>
);

const ContentSection = ({ id, activeSection, children }) => (
    <section id={id} className={`content-section ${activeSection === id ? 'active' : ''}`}>
        {children}
    </section>
);

const StateChart = ({ label, value, color }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Value'],
                    datasets: [{ 
                        data: [value], 
                        backgroundColor: [color], 
                        borderWidth: 1, 
                        barPercentage: 1.0, 
                        categoryPercentage: 1.0 
                    }]
                },
                options: {
                    scales: { x: { display: false }, y: { beginAtZero: true, max: 100 } },
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    maintainAspectRatio: false,
                }
            });
        }
    }, [value, color]);

    return (
        <div>
            <label className="font-medium text-zinc-700">{label}</label>
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

const MemoryMap = ({ memory, focus }) => {
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDims({ width, height });
            }
        });
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }, []);

    const nodes = memory.nodes;
    const links = memory.links;

    return (
        <div ref={containerRef} className="relative h-64 w-full">
            {links.map((link, index) => {
                const sourceNode = nodes[link.source];
                const targetNode = nodes[link.target];
                if (!sourceNode || !targetNode) return null;

                const x1 = sourceNode.x * dims.width / 100;
                const y1 = sourceNode.y * dims.height / 100;
                const x2 = targetNode.x * dims.width / 100;
                const y2 = targetNode.y * dims.height / 100;

                const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

                return <div key={index} className="graph-link" style={{ width: `${length}px`, left: `${x1}px`, top: `${y1}px`, transform: `rotate(${angle}deg)` }} />;
            })}
            {Object.entries(nodes).map(([nodeId, nodeData]) => {
                const isUnderstood = nodeData.understood;
                const isActive = nodeId === focus;
                const nodeClasses = `graph-node absolute z-10 p-2 rounded-lg shadow-md flex items-center justify-center border-2 text-xs truncate ${isActive ? 'active' : ''}`;
                
                return (
                    <div key={nodeId} className={nodeClasses} style={{ 
                        left: `calc(${nodeData.x}% - 30px)`, 
                        top: `calc(${nodeData.y}% - 16px)`,
                        backgroundColor: isUnderstood ? '#dcfce7' : '#fee2e2',
                        borderColor: isUnderstood ? '#22c55e' : '#ef4444',
                        width: '60px',
                    }}>
                        {nodeId.split('-')[0]}
                    </div>
                );
            })}
        </div>
    );
};


// --- Page Section Components ---

const Home = () => (
    <>
        <h2 className="text-4xl font-bold mb-4">Hizawye AI: A Framework for Simulating Consciousness</h2>
        <p className="text-lg text-zinc-600 mb-6">This interactive experience explores the concepts presented in the research paper on Hizawye AI. It translates the theoretical framework into a dynamic visualization, allowing you to explore the system's architecture and observe a simulation of its emergent, consciousness-like behaviors.</p>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
            <h3 className="text-xl font-semibold mb-2 text-indigo-600">Abstract</h3>
            <p className="text-zinc-700 leading-relaxed">The project presents a computational framework to simulate key functional aspects of consciousness, inspired by Global Workspace Theory (GWT). The system models an autonomous agent driven by internal states like curiosity, boredom, and pain. It utilizes a modular "mind" (JSON files), a dynamic knowledge graph for memory, and a central reasoning loop using a small LLM. The AI exhibits emergent behaviors like goal-oriented focus, idle wandering, and strategic failure, where it learns to break down complex problems in response to repeated failure.</p>
        </div>
    </>
);

const Architecture = () => {
    const [details, setDetails] = useState(null);

    const showDetails = (id) => {
        setDetails(architectureContent[id]);
    };

    return (
        <>
            <h2 className="text-4xl font-bold mb-6">System Architecture</h2>
            <p className="text-lg text-zinc-600 mb-8">The framework is composed of three primary, decoupled components. This modularity allows for transparency and independent development. Click on each component to learn more.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div onClick={() => showDetails('arch-mind')} className="arch-component bg-white p-6 rounded-lg shadow-sm border-2 border-transparent cursor-pointer hover:border-indigo-500 transition">
                    <span className="text-5xl">📄</span>
                    <h3 className="text-2xl font-semibold mt-4">The Mind</h3>
                    <p className="text-zinc-500">Structured State Storage</p>
                </div>
                <div onClick={() => showDetails('arch-memory')} className="arch-component bg-white p-6 rounded-lg shadow-sm border-2 border-transparent cursor-pointer hover:border-indigo-500 transition">
                    <span className="text-5xl">🧠</span>
                    <h3 className="text-2xl font-semibold mt-4">The Memory</h3>
                    <p className="text-zinc-500">Knowledge Graph</p>
                </div>
                <div onClick={() => showDetails('arch-thinker')} className="arch-component bg-white p-6 rounded-lg shadow-sm border-2 border-transparent cursor-pointer hover:border-indigo-500 transition">
                    <span className="text-5xl">⚙️</span>
                    <h3 className="text-2xl font-semibold mt-4">The Thinker</h3>
                    <p className="text-zinc-500">Consciousness Loop</p>
                </div>
            </div>
            <div id="architecture-details" className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-zinc-200 min-h-[200px]">
                {details ? (
                    <>
                        <h3 className="text-2xl font-semibold mb-4 text-indigo-600">{details.title}</h3>
                        <p className="text-zinc-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: details.content }}></p>
                    </>
                ) : (
                    <p className="text-zinc-500">Select a component above to view its details.</p>
                )}
            </div>
        </>
    );
};

const Simulation = () => {
    const [simData, setSimData] = useState(JSON.parse(JSON.stringify(initialSimState)));
    const [log, setLog] = useState([{ type: 'info', message: 'Simulation not started. Press "Run Cycle".' }]);
    
    const logToSim = (message, type = 'info') => {
        setLog(prevLog => [...prevLog.slice(-20), { type, message }]);
    };
    
    const runSimulationCycle = () => {
        setSimData(currentData => {
            const newData = JSON.parse(JSON.stringify(currentData));

            if (newData.goals.active.length > 0) {
                const goal = newData.goals.active[0];
                newData.focus = goal.match(/'(.*?)'/)[1];
                logToSim(`Goal-directed focus: <strong>${newData.focus}</strong>`);

                const shouldFail = Math.random() < 0.25 || newData.state.pain > 50;

                if (goal.includes("Deepen understanding")) {
                    if (shouldFail) {
                        logToSim(`LLM response malformed. Rejecting thought.`, 'warn');
                        newData.state.pain = Math.min(100, newData.state.pain + 25);
                        if (newData.state.pain >= 80) {
                            logToSim(`Pain threshold reached for '${newData.focus}'. This is too difficult.`, 'critical');
                            logToSim(`New Strategy: Break down the concept.`);
                            newData.goals.active.shift();
                            newData.goals.active.unshift(`Break down the concept: '${newData.focus}'`);
                            newData.state.pain = 0;
                        }
                    } else {
                        logToSim(`Successfully understood '${newData.focus}'. Storing memory.`, 'success');
                        newData.memory.nodes[newData.focus].understood = true;
                        newData.goals.completed.push(newData.goals.active.shift());
                        newData.state.pain = Math.max(0, newData.state.pain - 20);
                    }
                } else if (goal.includes("Break down")) {
                    logToSim(`Successfully broke down '${newData.focus}'.`, 'success');
                    const subConcepts = [`${newData.focus}-A`, `${newData.focus}-B`];
                    logToSim(`New sub-concepts discovered: ${subConcepts.join(', ')}`);
                    const parentNode = newData.memory.nodes[newData.focus];
                    newData.goals.active.shift();
                    subConcepts.reverse().forEach((sc, i) => {
                        newData.memory.nodes[sc] = {
                            x: parentNode.x + (i * 15 - 10),
                            y: parentNode.y + 25,
                            understood: false
                        };
                        newData.memory.links.push({ source: newData.focus, target: sc });
                        newData.goals.active.unshift(`Deepen understanding of the concept: '${sc}'`);
                    });
                }
            } else {
                logToSim(`Idle mode. No active goals.`);
                newData.state.boredom = Math.min(100, newData.state.boredom + 15);

                if (newData.state.boredom >= 75) {
                    logToSim(`Boredom threshold reached. Seeking novelty.`, 'critical');
                    newData.goals.active.push(`Expand knowledge from '${newData.focus}'`);
                    newData.state.boredom = 0;
                } else {
                    const neighbors = newData.memory.links
                        .filter(l => l.source === newData.focus || l.target === newData.focus)
                        .map(l => (l.source === newData.focus ? l.target : l.source));
                    if (neighbors.length > 0) {
                        newData.focus = neighbors[Math.floor(Math.random() * neighbors.length)];
                        logToSim(`Mind wanders to: <strong>${newData.focus}</strong>`);
                    }
                }
            }
            return newData;
        });
    };

    const resetSimulation = () => {
        setSimData(JSON.parse(JSON.stringify(initialSimState)));
        setLog([{ type: 'info', message: 'Simulation reset. Press "Run Cycle".' }]);
    };
    
    return (
        <>
            <h2 className="text-4xl font-bold mb-6">The Consciousness Loop: Interactive Simulation</h2>
            <p className="text-lg text-zinc-600 mb-8">This dashboard simulates the Hizawye AI's life-cycle. Press "Run Cycle" to advance the AI's thought process one step at a time. Observe how its internal states change and how it adapts its goals and strategies based on its experiences.</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
                        <h3 className="text-xl font-semibold mb-4">Controls</h3>
                        <div className="flex gap-4">
                            <button onClick={runSimulationCycle} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition">Run Cycle</button>
                            <button onClick={resetSimulation} className="w-full bg-zinc-200 text-zinc-800 font-bold py-3 px-4 rounded-lg hover:bg-zinc-300 transition">Reset</button>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
                        <h3 className="text-xl font-semibold mb-4">Internal State</h3>
                        <div className="space-y-4">
                            <StateChart label="Curiosity" value={simData.state.curiosity} color="rgba(79, 70, 229, 0.6)" />
                            <StateChart label="Boredom" value={simData.state.boredom} color="rgba(245, 158, 11, 0.6)" />
                            <StateChart label="Pain" value={simData.state.pain} color="rgba(220, 38, 38, 0.6)" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
                        <h3 className="text-xl font-semibold mb-2">Current Focus</h3>
                        <p className="text-2xl font-bold text-indigo-600 truncate">{simData.focus || '-'}</p>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
                        <h3 className="text-xl font-semibold mb-2">Active Goal</h3>
                        <p className="text-zinc-600 font-mono">{simData.goals.active[0] || 'None (Idle)'}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
                        <h3 className="text-xl font-semibold mb-4">Thought & Action Log</h3>
                        <div className="h-48 bg-zinc-900 text-white font-mono text-sm p-4 rounded-md overflow-y-auto">
                            {log.map((item, index) => {
                                let prefix = 'INFO';
                                let colorClass = 'text-zinc-300';
                                if (item.type === 'success') { prefix = '✅ OK'; colorClass = 'text-green-400'; }
                                else if (item.type === 'warn') { prefix = '⚠️ WARN'; colorClass = 'text-amber-400'; }
                                else if (item.type === 'critical') { prefix = '🔥 CRITICAL'; colorClass = 'text-red-400'; }
                                return <p key={index}><span className={colorClass}>{prefix}:</span> <span dangerouslySetInnerHTML={{ __html: item.message }}></span></p>;
                            })}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
                        <h3 className="text-xl font-semibold mb-4">Simplified Memory Map</h3>
                        <MemoryMap memory={simData.memory} focus={simData.focus} />
                    </div>
                </div>
            </div>
        </>
    );
};

const Findings = () => (
    <>
        <h2 className="text-4xl font-bold mb-6">Key Findings & Future Work</h2>
        <p className="text-lg text-zinc-600 mb-8">Analysis of the AI's behavior revealed key successes and significant challenges, paving the way for future research.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-2xl font-semibold mb-4 text-green-600">✅ Success: Emergent Strategic Failure</h3>
                <p className="text-zinc-700 leading-relaxed">A key finding was the successful execution of the strategic failure mechanism. When faced with a repeated inability to understand a concept, the AI's "pain" state would cross a threshold. This triggered a new, meta-goal to "break down" the difficult concept into simpler parts. This demonstrates a powerful, emergent problem-solving capability that was not explicitly programmed but arose from the interaction of the system's simple rules.</p>
            </div>
            <div>
                <h3 className="text-2xl font-semibold mb-4 text-amber-600">⚠️ Challenge: Brittle Reasoning Core</h3>
                <p className="text-zinc-700 leading-relaxed">The primary source of failure was the brittleness of the small LLM. The logs are filled with instances where it would get confused and echo its instructions instead of performing the task. This highlights a key challenge: the control script's intelligence is handicapped by the limitations of its reasoning tool. The system required multiple validation and parsing logic upgrades to handle malformed data from its own "brain".</p>
            </div>
        </div>
        <div className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-zinc-200">
            <h3 className="text-2xl font-semibold mb-4 text-indigo-600">🚀 Future Work</h3>
            <ul className="list-disc list-inside space-y-3 text-zinc-700">
                <li><b>Upgrading the Reasoning Core:</b> Swapping `tinyllama` with a more powerful, instruction-following LLM would be the most significant improvement.</li>
                <li><b>Refining Internal States:</b> "Pain" could be divided into "confusion pain" (from failed tasks) and "conflict pain" (from discovering contradictory beliefs).</li>
                <li><b>Sensory Input:</b> Giving the AI the ability to "read" external data (e.g., a Wikipedia article) to incorporate new, external knowledge into its memory graph.</li>
                <li><b>Memory Forgetting:</b> Implementing a "memory decay" mechanism, where nodes and connections that are not frequently visited become weaker over time.</li>
            </ul>
        </div>
    </>
);


// --- Main App Component ---
export default function App() {
    const [activeSection, setActiveSection] = useState('home');
    
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) {
                setActiveSection(hash);
            } else {
                setActiveSection('home');
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial check
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const renderSection = () => {
        switch (activeSection) {
            case 'architecture':
                return <Architecture />;
            case 'simulation':
                return <Simulation />;
            case 'findings':
                return <Findings />;
            case 'home':
            default:
                return <Home />;
        }
    };

    return (
        <>
            <style>{`
                body { font-family: 'Inter', sans-serif; background-color: #f4f4f5; }
                .nav-link { transition: all 0.2s ease-in-out; }
                .nav-link.active { background-color: #4f46e5; color: white; }
                .nav-link:not(.active):hover { background-color: #e4e4e7; }
                .content-section { display: none; }
                .content-section.active { display: block; animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .chart-container { position: relative; height: 60px; width: 100%; }
                .graph-node { transition: all 0.3s ease-in-out; }
                .graph-node.active { transform: scale(1.1); box-shadow: 0 0 15px rgba(79, 70, 229, 0.7); border-color: #4f46e5 !important; }
                .graph-link { position: absolute; background-color: #a1a1aa; height: 2px; transform-origin: left; z-index: 0; }
            `}</style>
            <div className="flex flex-col md:flex-row min-h-screen">
                <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
                <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
                    {renderSection()}
                </main>
            </div>
        </>
    );
}
