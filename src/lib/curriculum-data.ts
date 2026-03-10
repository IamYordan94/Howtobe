export const categories: Record<string, { label: string; color: string }> = {
    core: { label: "Core Foundations", color: "#f0a500" },
    essential: { label: "Essential Academic", color: "#3ecfcf" },
    practical: { label: "Practical Life", color: "#7ed957" },
    humanities: { label: "Humanities & Arts", color: "#c47fff" },
    stem: { label: "STEM Electives", color: "#ff7043" },
    social: { label: "Social & Emotional", color: "#ff85a1" },
    specialized: { label: "Specialized", color: "#5cb8ff" },
    enrichment: { label: "Enrichment", color: "#ffd166" },
};

export interface SubjectItem {
    id: string;
    label: string;
    cat: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export const subjects: SubjectItem[] = [
    // Core
    { id: "reading", label: "Reading", cat: "core" },
    { id: "math", label: "Maths", cat: "core" },
    { id: "writing", label: "Writing", cat: "core" },
    { id: "critical", label: "Critical Thinking", cat: "core" },
    { id: "speaking", label: "Speaking", cat: "core" },
    // Essential
    { id: "biology", label: "Biology", cat: "essential" },
    { id: "chemistry", label: "Chemistry", cat: "essential" },
    { id: "physics", label: "Physics", cat: "essential" },
    { id: "world_history", label: "World History", cat: "essential" },
    { id: "nat_history", label: "National History", cat: "essential" },
    { id: "geography", label: "Geography", cat: "essential" },
    { id: "civics", label: "Civics", cat: "essential" },
    { id: "economics", label: "Economics", cat: "essential" },
    { id: "language", label: "Foreign Language", cat: "essential" },
    // Practical
    { id: "health", label: "Health", cat: "practical" },
    { id: "pe", label: "Phys. Ed", cat: "practical" },
    { id: "cooking", label: "Cooking", cat: "practical" },
    { id: "firstaid", label: "First Aid", cat: "practical" },
    { id: "digital", label: "Digital Literacy", cat: "practical" },
    { id: "coding", label: "Coding", cat: "practical" },
    // Humanities
    { id: "literature", label: "Literature", cat: "humanities" },
    { id: "philosophy", label: "Philosophy", cat: "humanities" },
    { id: "religion", label: "World Religions", cat: "humanities" },
    { id: "art_history", label: "Art History", cat: "humanities" },
    { id: "visual_art", label: "Visual Art", cat: "humanities" },
    { id: "music", label: "Music", cat: "humanities" },
    { id: "drama", label: "Drama", cat: "humanities" },
    // STEM
    { id: "environ", label: "Env. Science", cat: "stem" },
    { id: "astronomy", label: "Astronomy", cat: "stem" },
    { id: "statistics", label: "Statistics", cat: "stem" },
    { id: "logic", label: "Formal Logic", cat: "stem" },
    { id: "engineering", label: "Engineering", cat: "stem" },
    // Social
    { id: "psychology", label: "Psychology", cat: "social" },
    { id: "sociology", label: "Sociology", cat: "social" },
    { id: "emotional", label: "Emotional Intel.", cat: "social" },
    { id: "conflict", label: "Conflict Res.", cat: "social" },
    { id: "relationships", label: "Relationships", cat: "social" },
    // Specialized
    { id: "law", label: "Law", cat: "specialized" },
    { id: "media", label: "Media Literacy", cat: "specialized" },
    { id: "research", label: "Research Methods", cat: "specialized" },
    { id: "entrepreneur", label: "Entrepreneurship", cat: "specialized" },
    { id: "architecture", label: "Architecture", cat: "specialized" },
    { id: "gardening", label: "Gardening", cat: "specialized" },
    { id: "woodwork", label: "Woodworking", cat: "specialized" },
    { id: "sewing", label: "Sewing", cat: "specialized" },
    // Enrichment
    { id: "mythology", label: "Mythology", cat: "enrichment" },
    { id: "chess", label: "Chess", cat: "enrichment" },
    { id: "dance", label: "Dance", cat: "enrichment" },
    { id: "film", label: "Film Studies", cat: "enrichment" },
];

export const links: [string, string, string][] = [
    // Reading anchors
    ["reading", "writing", "Core Literacy — teach decoding & encoding together daily"],
    ["reading", "literature", "Read great books aloud; discuss story, theme, character"],
    ["reading", "world_history", "Use primary sources & historical fiction as reading material"],
    ["reading", "critical", "Comprehension = evaluate what you read"],
    ["reading", "media", "Analysing articles builds both skills simultaneously"],

    // Writing anchors
    ["writing", "literature", "Essays about books teach both craft and analysis"],
    ["writing", "world_history", "Historical essays, timelines, source analysis"],
    ["writing", "speaking", "Draft → speak; speech → revise into writing"],
    ["writing", "philosophy", "Philosophical essays sharpen argument structure"],
    ["writing", "research", "Research projects require formal written output"],

    // Math anchors
    ["math", "physics", "Physics IS applied maths — vectors, forces, calculus"],
    ["math", "chemistry", "Stoichiometry, molar ratios — pure applied maths"],
    ["math", "statistics", "Statistics is a branch of maths"],
    ["math", "economics", "Supply/demand curves, budgets, interest rates"],
    ["math", "logic", "Formal logic shares mathematical proof structure"],
    ["math", "coding", "Programming is applied logic and maths"],
    ["math", "engineering", "Engineering design relies on maths throughout"],
    ["math", "architecture", "Geometry, scale, structural load = maths"],
    ["math", "cooking", "Fractions, ratios, weight, temperature"],

    // Critical thinking
    ["critical", "philosophy", "Philosophy is formalised critical thinking"],
    ["critical", "media", "Media literacy demands critical evaluation"],
    ["critical", "law", "Legal reasoning is structured critical thinking"],
    ["critical", "logic", "Logic is the grammar of critical thinking"],
    ["critical", "research", "Research methods train systematic critical thought"],
    ["critical", "chess", "Chess builds forward planning & critical analysis"],
    ["critical", "economics", "Evaluating economic arguments requires critical thought"],

    // Speaking
    ["speaking", "drama", "Drama is speaking made physical & emotional"],
    ["speaking", "language", "Oral practice of a foreign language"],
    ["speaking", "conflict", "Conflict resolution relies on clear communication"],
    ["speaking", "relationships", "Healthy relationships need good communication"],
    ["speaking", "emotional", "Expressing emotions verbally"],

    // Science cluster
    ["biology", "chemistry", "Biochemistry — cell chemistry, metabolism"],
    ["biology", "health", "Body systems, nutrition, disease"],
    ["biology", "environ", "Ecosystems, species, conservation"],
    ["biology", "gardening", "Plant biology, soil science"],
    ["chemistry", "physics", "Thermodynamics, atomic structure"],
    ["chemistry", "cooking", "Cooking is applied chemistry — reactions, emulsions"],
    ["physics", "engineering", "Engineering applies physics principles"],
    ["physics", "astronomy", "Astrophysics, gravity, electromagnetic spectrum"],
    ["physics", "math", "See Math↔Physics above"],

    // History cluster
    ["world_history", "nat_history", "National story fits inside world events"],
    ["world_history", "geography", "History is shaped by geography"],
    ["world_history", "religion", "Religious movements shaped history deeply"],
    ["world_history", "art_history", "Art reflects the era in which it was made"],
    ["world_history", "literature", "Historical novels, epics from each era"],
    ["world_history", "philosophy", "Philosophical movements mirror historical moments"],
    ["world_history", "economics", "Economic systems drove empires and wars"],
    ["nat_history", "civics", "National history is the foundation of civics"],
    ["world_history", "mythology", "Myth is the oldest form of recorded history"],

    // Geography
    ["geography", "environ", "Physical geography = environmental science"],
    ["geography", "civics", "Borders, nations, political geography"],
    ["geography", "sociology", "Culture is partly shaped by place"],

    // Civics & Economics
    ["civics", "law", "Laws are the machinery of government"],
    ["civics", "economics", "Policy decisions are economic decisions"],
    ["civics", "media", "Understanding propaganda, bias in news"],
    ["economics", "entrepreneur", "Business basics ground economic theory"],
    ["economics", "math", "See Math↔Economics"],
    ["economics", "statistics", "Economic analysis is statistics-heavy"],

    // Language
    ["language", "literature", "Read literature in the original language"],
    ["language", "world_history", "Language reveals cultural history"],
    ["language", "mythology", "Myths exist in every language"],

    // Health & PE
    ["health", "pe", "Physical fitness is health in action"],
    ["health", "biology", "Body systems, nutrition science"],
    ["health", "cooking", "Nutrition and healthy meal planning"],
    ["health", "psychology", "Mental health is part of whole health"],
    ["health", "firstaid", "First aid is emergency health care"],
    ["pe", "dance", "Dance is joyful, structured physical education"],

    // Practical cluster
    ["cooking", "chemistry", "See Chemistry↔Cooking"],
    ["cooking", "math", "Ratios, measurement, scaling recipes"],
    ["cooking", "gardening", "Grow what you cook"],
    ["digital", "coding", "Digital literacy leads naturally into coding"],
    ["digital", "media", "Online safety and evaluating digital sources"],
    ["coding", "math", "See Math↔Coding"],
    ["coding", "logic", "See Logic↔Coding"],
    ["coding", "engineering", "Software is a form of engineering"],
    ["woodwork", "engineering", "Design, measure, build — same process"],
    ["woodwork", "math", "Measurement, angles, geometry"],
    ["sewing", "math", "Patterns use geometry and measurement"],
    ["sewing", "art_history", "Fashion as art through history"],
    ["gardening", "biology", "See Biology↔Gardening"],
    ["gardening", "environ", "Sustainability, soil, ecosystems"],
    ["architecture", "visual_art", "Design sense is shared across both"],
    ["architecture", "engineering", "Structural integrity = applied engineering"],
    ["architecture", "math", "See Math↔Architecture"],

    // Humanities cluster
    ["literature", "philosophy", "Great novels explore philosophical questions"],
    ["literature", "world_history", "Literature reflects its historical moment"],
    ["literature", "mythology", "Myths are the oldest literature"],
    ["literature", "film", "Film adapts literature; same narrative tools"],
    ["philosophy", "religion", "Philosophy of religion, moral theology"],
    ["philosophy", "critical", "See Critical↔Philosophy"],
    ["philosophy", "psychology", "Philosophy of mind, consciousness"],
    ["religion", "world_history", "See Religion↔History"],
    ["religion", "sociology", "Belief systems shape social structures"],
    ["religion", "mythology", "Mythology often IS religious narrative"],
    ["art_history", "visual_art", "Art history contextualises art-making"],
    ["art_history", "world_history", "See Art History↔World History"],
    ["visual_art", "architecture", "Spatial design, aesthetics"],
    ["visual_art", "film", "Cinematography is visual art in motion"],
    ["music", "math", "Time signatures, ratios, harmony theory"],
    ["music", "physics", "Acoustics — sound waves, resonance"],
    ["music", "world_history", "Music is a record of its time"],
    ["music", "dance", "Rhythm, movement, expression together"],
    ["drama", "literature", "Plays ARE literature; perform what you read"],
    ["drama", "emotional", "Acting demands emotional intelligence"],
    ["drama", "speaking", "See Speaking↔Drama"],

    // STEM electives
    ["environ", "geography", "See Geography↔Environ"],
    ["environ", "biology", "See Biology↔Environ"],
    ["astronomy", "physics", "See Physics↔Astronomy"],
    ["astronomy", "math", "Scale, distance, orbital mechanics"],
    ["astronomy", "mythology", "Constellations are named by myth"],
    ["statistics", "math", "See Math↔Statistics"],
    ["statistics", "research", "Research requires statistical analysis"],
    ["statistics", "economics", "See Economics↔Statistics"],
    ["logic", "coding", "See Coding↔Logic"],
    ["logic", "philosophy", "Formal logic is used in philosophical argument"],
    ["logic", "chess", "Chess is applied logic and strategy"],
    ["engineering", "math", "See Math↔Engineering"],
    ["engineering", "physics", "See Physics↔Engineering"],

    // Social cluster
    ["psychology", "sociology", "Individual behaviour vs group behaviour"],
    ["psychology", "health", "Mental health"],
    ["psychology", "emotional", "Emotional intelligence is applied psychology"],
    ["psychology", "relationships", "Understanding self helps understand others"],
    ["psychology", "drama", "Acting requires understanding human psychology"],
    ["sociology", "world_history", "History is shaped by social forces"],
    ["sociology", "civics", "How societies organise politically"],
    ["emotional", "conflict", "Emotional awareness enables conflict resolution"],
    ["emotional", "relationships", "EQ is the foundation of healthy relationships"],
    ["conflict", "law", "Formal dispute resolution is structured conflict res."],
    ["conflict", "speaking", "See Speaking↔Conflict"],

    // Specialized
    ["law", "civics", "See Civics↔Law"],
    ["law", "critical", "See Critical↔Law"],
    ["law", "writing", "Legal writing is a discipline in itself"],
    ["media", "digital", "See Digital↔Media"],
    ["media", "critical", "See Critical↔Media"],
    ["research", "writing", "See Writing↔Research"],
    ["research", "statistics", "See Statistics↔Research"],
    ["entrepreneur", "economics", "See Economics↔Entrepreneur"],
    ["entrepreneur", "math", "Business maths: profit, loss, interest"],

    // Enrichment
    ["mythology", "literature", "See Literature↔Mythology"],
    ["mythology", "world_history", "See Mythology↔History"],
    ["mythology", "religion", "See Religion↔Mythology"],
    ["chess", "critical", "See Critical↔Chess"],
    ["chess", "math", "Chess scoring, probability, combinatorics"],
    ["chess", "logic", "See Logic↔Chess"],
    ["dance", "pe", "See PE↔Dance"],
    ["dance", "music", "See Music↔Dance"],
    ["dance", "drama", "Expressive performance overlap"],
    ["film", "literature", "See Film↔Literature"],
    ["film", "art_history", "Cinema as 20th-century art form"],
    ["film", "world_history", "Film as historical document and propaganda"],
    ["film", "media", "Media literacy applied to moving image"],
];
