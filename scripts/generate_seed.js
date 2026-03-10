const fs = require('fs');

try {
    const html = fs.readFileSync('C:/Users/veria/Desktop/AI STUFF DIFFERENT AGENTS/How to be a human/curriculum-map.html', 'utf-8');

    const sIdx = html.indexOf('const subjects = [');
    const sEnd = html.indexOf('];', sIdx) + 1;
    let ssStr = html.substring(sIdx, sEnd);
    ssStr = ssStr.replace('const subjects =', 'return');
    const subjects = new Function(ssStr)();

    const lIdx = html.indexOf('const links = [');
    const lEnd = html.indexOf('];', lIdx) + 1;
    let lsStr = html.substring(lIdx, lEnd);
    lsStr = lsStr.replace('const links =', 'return');
    const links = new Function(lsStr)();

    let sql = '';
    // Convert map data to INSERT statements
    for (let i = 0; i < subjects.length; i++) {
        let s = subjects[i];
        let safeLbl = s.label.replace(/'/g, "''");
        sql += `INSERT INTO subjects (id, label, category, description, is_published, coming_soon) VALUES ('${s.id}', '${safeLbl}', '${s.cat}', '', false, true) ON CONFLICT (id) DO NOTHING;\n`;
    }

    for (let j = 0; j < links.length; j++) {
        let l = links[j];
        let safeDesc = l[2].replace(/'/g, "''");
        sql += `INSERT INTO connections (subject_a, subject_b, description) VALUES ('${l[0]}', '${l[1]}', '${safeDesc}');\n`;
    }

    fs.writeFileSync('C:/Users/veria/Desktop/AI STUFF DIFFERENT AGENTS/How to be a human/how-to-be-human/seed.sql', sql);
    console.log('SQL generated successfully.');
} catch (e) {
    console.error("Error generating SQL:", e.message);
    process.exit(1);
}
