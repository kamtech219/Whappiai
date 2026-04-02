const fs = require('fs');
const filepath = 'src/services/ai.js';
let content = fs.readFileSync(filepath, 'utf8');
content = content.replace(
    'finalSystemPrompt += `\\n\\nIMPORTANT : Utilise les informations du CONTEXTE DE CONNAISSANCES ci-dessus pour répondre de manière précise. Si l\\'information n\\'est pas dans le contexte, réponds avec tes connaissances générales ou demande plus de précisions.";',
    'finalSystemPrompt += "\\n\\nIMPORTANT : Utilise les informations du CONTEXTE DE CONNAISSANCES ci-dessus pour répondre de manière précise. Si l\\'information n\\'est pas dans le contexte, réponds avec tes connaissances générales ou demande plus de précisions.";'
);
fs.writeFileSync(filepath, content);
