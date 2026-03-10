/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import { categories, subjects, links, SubjectItem } from "@/lib/curriculum-data";

export default function CurriculumMap({ activeCategory }: { activeCategory?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const router = useRouter();

    const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

    useEffect(() => {
        if (!containerRef.current || !svgRef.current) return;

        // Filter subjects by active category if set
        const filteredSubjects = activeCategory
            ? subjects.filter((s) => s.cat === activeCategory)
            : subjects;

        const filteredIds = new Set(filteredSubjects.map((s) => s.id));
        const filteredLinks = activeCategory
            ? links.filter(([s, t]) => filteredIds.has(s) && filteredIds.has(t))
            : links;

        // Build node map and adjacency lists
        const nodeMap: Record<string, SubjectItem> = {};
        filteredSubjects.forEach((s) => (nodeMap[s.id] = s));

        const adjacency: Record<string, string[]> = {};
        const combos: Record<string, Record<string, string>> = {};

        filteredSubjects.forEach((s) => {
            adjacency[s.id] = [];
            combos[s.id] = {};
        });

        filteredLinks.forEach(([s, t, desc]) => {
            if (adjacency[s] && adjacency[t]) {
                adjacency[s].push(t);
                adjacency[t].push(s);
                combos[s][t] = desc;
                combos[t][s] = desc;
            }
        });

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g");

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.3, 3])
            .on("zoom", (e) => g.attr("transform", e.transform));

        svg.call(zoom);

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const simulation = d3
            .forceSimulation(filteredSubjects as unknown as d3.SimulationNodeDatum[])
            .force(
                "link",
                d3.forceLink(
                    filteredLinks
                        .filter(([s, t]) => filteredIds.has(s) && filteredIds.has(t))
                        .map(([s, t, d]) => ({ source: s, target: t, desc: d }))
                )
                    .id((d: any) => d.id)
                    .distance(90)
            )
            .force("charge", d3.forceManyBody().strength(-280))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(30));

        const linkData = filteredLinks
            .filter(([s, t]) => filteredIds.has(s) && filteredIds.has(t))
            .map(([s, t, d]) => ({ source: s, target: t, desc: d }));

        const linkSel = g
            .append("g")
            .selectAll("line")
            .data(linkData)
            .enter()
            .append("line")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.35)
            .attr("stroke", (d: any) => {
                const srcId = typeof d.source === "object" ? d.source.id : d.source;
                return categories[nodeMap[srcId]?.cat]?.color || "#555";
            });

        const nodeSel = g
            .append("g")
            .selectAll(".node")
            .data(filteredSubjects as unknown as d3.SimulationNodeDatum[])
            .enter()
            .append("g")
            .attr("class", "cursor-pointer")
            .call(
                d3.drag<any, any>()
                    .on("start", (e, d) => {
                        if (!e.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on("drag", (e, d) => {
                        d.fx = e.x;
                        d.fy = e.y;
                    })
                    .on("end", (e, d) => {
                        if (!e.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    })
            )
            .on("click", (_e, d: any) => {
                handleNodeClick(d);
            });

        nodeSel
            .append("circle")
            .attr("r", (d: any) => 10 + (adjacency[d.id]?.length || 0) * 1.4)
            .attr("fill", (d: any) => categories[d.cat].color + "22")
            .attr("stroke", (d: any) => categories[d.cat].color)
            .attr("stroke-width", 2)
            .attr("class", "transition-all duration-150 hover:brightness-125");

        nodeSel
            .append("text")
            .text((d: any) => d.label)
            .attr("dy", (d: any) => 14 + (adjacency[d.id]?.length || 0) * 1.4)
            .style("font-size", "9px")
            .attr("fill", "#ccc")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .style("pointer-events", "none")
            .style("font-family", "var(--font-dm-mono), monospace");

        simulation.on("tick", () => {
            linkSel
                .attr("x1", (d: any) => d.source.x ?? 0)
                .attr("y1", (d: any) => d.source.y ?? 0)
                .attr("x2", (d: any) => d.target.x ?? 0)
                .attr("y2", (d: any) => d.target.y ?? 0);
            nodeSel.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
        });

        let currentSelected: string | null = null;

        function handleNodeClick(d: any) {
            if (currentSelected === d.id) {
                currentSelected = null;
                setSelectedSubject(null);
                nodeSel.attr("opacity", 1);
                nodeSel.select("circle").attr("stroke-width", 2);
                linkSel.attr("stroke-opacity", 0.35).attr("stroke-width", 1.5);
                return;
            }

            currentSelected = d.id;
            const neighbours = new Set(adjacency[d.id] || []);
            neighbours.add(d.id);

            nodeSel.attr("opacity", (n: any) => (neighbours.has(n.id) ? 1 : 0.15));
            nodeSel.select("circle").attr("stroke-width", (n: any) => (n.id === d.id ? 3 : 2));

            linkSel
                .attr("stroke-opacity", (l: any) => (l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.05))
                .attr("stroke-width", (l: any) => (l.source.id === d.id || l.target.id === d.id ? 2.5 : 1.5));

            setSelectedSubject(nodeMap[d.id]);
        }

        const handleResize = () => {
            if (!containerRef.current) return;
            simulation.force("center", d3.forceCenter(containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2));
            simulation.alpha(0.1).restart();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            simulation.stop();
        };
    }, [activeCategory]);

    const getNeighbours = (subjectId: string) => {
        return links
            .filter(([s, t]) => s === subjectId || t === subjectId)
            .map(([s, t, desc]) => {
                const targetId = s === subjectId ? t : s;
                return {
                    target: subjects.find((sub) => sub.id === targetId)!,
                    desc,
                };
            });
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-130px)] min-h-[500px]">
            <div id="graph-container" ref={containerRef} className="relative flex-1 overflow-hidden bg-[var(--bg)] cursor-grab active:cursor-grabbing">
                <svg id="graph" ref={svgRef} className="w-full h-full"></svg>
                <div className="absolute bottom-4 left-0 right-0 text-center text-[0.65rem] text-[var(--muted)] pointer-events-none">
                    Drag to pan · Scroll to zoom
                </div>
            </div>

            <div className="w-full md:w-[340px] bg-[var(--surface)] border-t md:border-t-0 md:border-l border-[var(--border)] flex flex-col overflow-hidden transition-all">
                <div className="p-4 border-b border-[var(--border)] text-[0.7rem] uppercase tracking-widest text-[var(--muted)] shrink-0">
                    Subject Details
                </div>
                <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                    {!selectedSubject ? (
                        <div className="text-[var(--muted)] text-[0.75rem] leading-relaxed mt-4">
                            <p>← Select any node on the graph to explore how subjects connect and combine into combined lessons.</p>
                            <p className="mt-4">Subjects that share a strong connection will light up together.</p>
                        </div>
                    ) : (
                        <div>
                            <div
                                className="font-serif text-2xl leading-tight mb-1"
                                style={{ color: categories[selectedSubject.cat].color }}
                            >
                                {selectedSubject.label}
                            </div>
                            <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-4 pb-4 border-b border-[var(--border)]">
                                {categories[selectedSubject.cat].label} · {getNeighbours(selectedSubject.id).length} connections
                            </div>

                            <button
                                onClick={() => router.push(`/subject/${selectedSubject.id}`)}
                                className="w-full mb-6 py-2 px-4 bg-white/5 hover:bg-white/10 border border-[var(--border)] rounded text-sm transition-colors text-white"
                            >
                                Go to Subject →
                            </button>

                            <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-3">
                                Combines naturally with
                            </div>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {getNeighbours(selectedSubject.id).map(({ target }) => (
                                    <span
                                        key={target.id}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[0.68rem] cursor-pointer border bg-[var(--bg)] text-[var(--text)] hover:brightness-125 transition-all"
                                        style={{ borderColor: categories[target.cat].color + "44" }}
                                        onClick={() => router.push(`/subject/${target.id}`)}
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ background: categories[target.cat].color }}
                                        />
                                        {target.label}
                                    </span>
                                ))}
                            </div>

                            <div className="pt-5 border-t border-[var(--border)]">
                                <div className="text-[0.65rem] uppercase tracking-widest text-[var(--muted)] mb-3">
                                    Combination ideas
                                </div>
                                {getNeighbours(selectedSubject.id).map(({ target, desc }) => (
                                    <div key={target.id} className="bg-[var(--bg)] border border-[var(--border)] rounded-sm p-3 mb-2.5">
                                        <div
                                            className="text-[0.72rem] font-medium mb-1"
                                            style={{ color: categories[target.cat].color }}
                                        >
                                            {selectedSubject.label} + {target.label}
                                        </div>
                                        <div className="text-[0.65rem] text-[var(--muted)] leading-relaxed">
                                            {desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
