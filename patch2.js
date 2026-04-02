const fs = require('fs');
const filepath = 'src/services/ai.js';
let content = fs.readFileSync(filepath, 'utf8');

// Use string literals without the actual backticks or quote marks inside strings. We will construct finalSystemPrompt cleanly.
content = content.replace(
`                        finalSystemPrompt += "\\n\\n[CALENDRIER ET RENDEZ-VOUS]\\nTu es connecté à l'agenda Cal.com de l'utilisateur. Tu peux vérifier les disponibilités et prendre des rendez-vous.";
                        finalSystemPrompt += "\\nTypes de rendez-vous disponibles :";
                        eventTypes.forEach(et => {
                            finalSystemPrompt += \\\`\\n- "\\\${et.title}" (Durée: \\\${et.length} min) -> ID: \\\${et.id}\\\`;
                        });

                        finalSystemPrompt += "\\n\\nPour vérifier les disponibilités, utilise UNIQUEMENT cette syntaxe exacte dans ta réponse :";
                        finalSystemPrompt += "\\n[CAL_CHECK:YYYY-MM-DD,ID_TYPE_RDV]";
                        finalSystemPrompt += "\\nExemple : [CAL_CHECK:2024-05-01," + eventTypes[0].id + "]";

                        finalSystemPrompt += "\\n\\nPour prendre un rendez-vous, demande d'abord le nom, l'email et le motif (si applicable). Une fois que tu as toutes ces informations et qu'un créneau est choisi (par ex. 14:00), utilise UNIQUEMENT cette syntaxe exacte dans ta réponse :";
                        finalSystemPrompt += "\\n[CAL_BOOK:YYYY-MM-DD HH:mm,Nom,Email,Motif,ID_TYPE_RDV]";
                        finalSystemPrompt += "\\nExemple : [CAL_BOOK:2024-05-01 14:00,Jean Dupont,jean@email.com,Consultation," + eventTypes[0].id + "]";

                        finalSystemPrompt += "\\n\\nNOTE IMPORTANTE: Ne génère pas toi-même la réponse finale pour les disponibilités ou la confirmation du rendez-vous, retourne juste le tag [CAL_CHECK:...] ou [CAL_BOOK:...]. Le système interceptera le tag et l'exécutera.";
`,
`                        finalSystemPrompt += "\\n\\n[CALENDRIER ET RENDEZ-VOUS]\\nTu es connecté à l'agenda Cal.com de l'utilisateur. Tu peux vérifier les disponibilités et prendre des rendez-vous.";
                        finalSystemPrompt += "\\nTypes de rendez-vous disponibles :";
                        eventTypes.forEach(et => {
                            finalSystemPrompt += \`\\n- "\${et.title}" (Durée: \${et.length} min) -> ID: \${et.id}\`;
                        });

                        finalSystemPrompt += "\\n\\nPour vérifier les disponibilités, utilise UNIQUEMENT cette syntaxe exacte dans ta réponse :\\n[CAL_CHECK:YYYY-MM-DD,ID_TYPE_RDV]\\nExemple : [CAL_CHECK:2024-05-01," + eventTypes[0].id + "]";
                        finalSystemPrompt += "\\n\\nPour prendre un rendez-vous, demande d'abord le nom, l'email et le motif (si applicable). Une fois que tu as toutes ces informations et qu'un créneau est choisi (par ex. 14:00), utilise UNIQUEMENT cette syntaxe exacte dans ta réponse :\\n[CAL_BOOK:YYYY-MM-DD HH:mm,Nom,Email,Motif,ID_TYPE_RDV]\\nExemple : [CAL_BOOK:2024-05-01 14:00,Jean Dupont,jean@email.com,Consultation," + eventTypes[0].id + "]";
                        finalSystemPrompt += "\\n\\nNOTE IMPORTANTE: Ne génère pas toi-même la réponse finale pour les disponibilités ou la confirmation du rendez-vous, retourne juste le tag [CAL_CHECK:...] ou [CAL_BOOK:...]. Le système interceptera le tag et l'exécutera.";
`
);

fs.writeFileSync(filepath, content);
