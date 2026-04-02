const fs = require('fs');
const filepath = 'src/services/ai.js';
let content = fs.readFileSync(filepath, 'utf8');

// Inject prompt in callAI
content = content.replace(
`            // Inject timezone context
            let userTimezone = 'UTC';
            if (user.owner_email) {
                const owner = User.findByEmail(user.owner_email);
                if (owner && owner.timezone) {
                    userTimezone = owner.timezone;
                }
            } else if (user.timezone) {
                userTimezone = user.timezone; // fallback if passed directly
            }`,
`            // Inject timezone context
            let userTimezone = 'UTC';
            let calOwner = null;
            if (user.owner_email) {
                const owner = User.findByEmail(user.owner_email);
                if (owner) {
                    calOwner = owner;
                    if (owner.timezone) {
                        userTimezone = owner.timezone;
                    }
                }
            } else if (user.timezone) {
                userTimezone = user.timezone; // fallback if passed directly
            }

            // Inject Cal.com context
            if (calOwner && calOwner.ai_cal_enabled && calOwner.cal_access_token) {
                try {
                    const CalService = require('./CalService');
                    const eventTypes = await CalService.getEventTypes(calOwner.id);
                    if (Array.isArray(eventTypes) && eventTypes.length > 0) {
                        finalSystemPrompt += "\n\n[CALENDRIER ET RENDEZ-VOUS]\nTu es connecté à l'agenda Cal.com de l'utilisateur. Tu peux vérifier les disponibilités et prendre des rendez-vous.";
                        finalSystemPrompt += "\nTypes de rendez-vous disponibles :";
                        eventTypes.forEach(et => {
                            finalSystemPrompt += \`\n- "\${et.title}" (Durée: \${et.length} min) -> ID: \${et.id}\`;
                        });

                        finalSystemPrompt += "\n\nPour vérifier les disponibilités, utilise UNIQUEMENT cette syntaxe exacte dans ta réponse :";
                        finalSystemPrompt += "\n[CAL_CHECK:YYYY-MM-DD,ID_TYPE_RDV]";
                        finalSystemPrompt += "\nExemple : [CAL_CHECK:2024-05-01," + eventTypes[0].id + "]";

                        finalSystemPrompt += "\n\nPour prendre un rendez-vous, demande d'abord le nom, l'email et le motif (si applicable). Une fois que tu as toutes ces informations et qu'un créneau est choisi (par ex. 14:00), utilise UNIQUEMENT cette syntaxe exacte dans ta réponse :";
                        finalSystemPrompt += "\n[CAL_BOOK:YYYY-MM-DD HH:mm,Nom,Email,Motif,ID_TYPE_RDV]";
                        finalSystemPrompt += "\nExemple : [CAL_BOOK:2024-05-01 14:00,Jean Dupont,jean@email.com,Consultation," + eventTypes[0].id + "]";

                        finalSystemPrompt += "\n\nNOTE IMPORTANTE: Ne génère pas toi-même la réponse finale pour les disponibilités ou la confirmation du rendez-vous, retourne juste le tag [CAL_CHECK:...] ou [CAL_BOOK:...]. Le système interceptera le tag et l'exécutera.";
                    }
                } catch (err) {
                    log(\`Failed to inject Cal.com context: \${err.message}\`, user.id, { error: err.message }, 'WARN');
                }
            }`
);

// Update [CAL_CHECK] regex and logic
content = content.replace(
`                // 1. [CAL_CHECK:YYYY-MM-DD]
                const checkMatch = finalResponse.match(/\\[CAL_CHECK:([\\d-]{10})\\]/);
                if (checkMatch) {
                    const date = checkMatch[1];
                    try {
                        const eventTypes = await CalService.getEventTypes(user.id);
                        if (Array.isArray(eventTypes) && eventTypes.length > 0) {
                            const eventTypeId = eventTypes[0].id; // Use first event type as default`,
`                // 1. [CAL_CHECK:YYYY-MM-DD,EVENT_TYPE_ID]
                const checkMatch = finalResponse.match(/\\[CAL_CHECK:([\\d-]{10})(?:,(\\d+))?\\]/);
                if (checkMatch) {
                    const date = checkMatch[1];
                    const requestedTypeId = checkMatch[2];
                    try {
                        const eventTypes = await CalService.getEventTypes(user.id);
                        if (Array.isArray(eventTypes) && eventTypes.length > 0) {
                            let eventTypeId = eventTypes[0].id; // Use first event type as default
                            if (requestedTypeId && eventTypes.some(et => et.id == requestedTypeId)) {
                                eventTypeId = parseInt(requestedTypeId, 10);
                            }`
);

content = content.replace(
`                            finalResponse = finalResponse.replace(/\\[CAL_CHECK:[\\d-]{10}\\]/, slotsText);
                        } else {
                            finalResponse = finalResponse.replace(/\\[CAL_CHECK:[\\d-]{10}\\]/, "Désolé, je n'ai pas pu vérifier les disponibilités. Il y a peut-être un problème de configuration de l'agenda.");
                        }
                    } catch (err) {
                        finalResponse = finalResponse.replace(/\\[CAL_CHECK:[\\d-]{10}\\]/, "Désolé, je n'ai pas pu vérifier les disponibilités. Il y a peut-être un problème de configuration de l'agenda.");
                    }`,
`                            finalResponse = finalResponse.replace(/\\[CAL_CHECK:[\\d-]{10}(?:,\\d+)?\\]/, slotsText);
                        } else {
                            finalResponse = finalResponse.replace(/\\[CAL_CHECK:[\\d-]{10}(?:,\\d+)?\\]/, "Désolé, je n'ai pas pu vérifier les disponibilités. Il y a peut-être un problème de configuration de l'agenda.");
                        }
                    } catch (err) {
                        finalResponse = finalResponse.replace(/\\[CAL_CHECK:[\\d-]{10}(?:,\\d+)?\\]/, "Désolé, je n'ai pas pu vérifier les disponibilités. Il y a peut-être un problème de configuration de l'agenda.");
                    }`
);


// Update [CAL_BOOK] regex and logic
content = content.replace(
`                // 2. [CAL_BOOK:YYYY-MM-DD HH:mm,Nom,Email,Motif]
                const bookMatch = finalResponse.match(/\\[CAL_BOOK:([^,]+),([^,]+),([^,]+),?([^\\]]*)\\]/);
                if (bookMatch) {
                    const [_, dateTime, name, email, notes] = bookMatch;
                    try {
                        const eventTypes = await CalService.getEventTypes(user.id);
                        if (Array.isArray(eventTypes) && eventTypes.length > 0) {
                            try {
                                const startTime = new Date(dateTime).toISOString();
                                const booking = await CalService.createBooking(user.id, {
                                    eventTypeId: eventTypes[0].id,`,
`                // 2. [CAL_BOOK:YYYY-MM-DD HH:mm,Nom,Email,Motif,EVENT_TYPE_ID]
                const bookMatch = finalResponse.match(/\\[CAL_BOOK:([^,]+),([^,]+),([^,]+),?([^,\\]]*)(?:,(\\d+))?\\]/);
                if (bookMatch) {
                    const [_, dateTime, name, email, notes, requestedTypeId] = bookMatch;
                    try {
                        const eventTypes = await CalService.getEventTypes(user.id);
                        if (Array.isArray(eventTypes) && eventTypes.length > 0) {
                            let eventTypeId = eventTypes[0].id;
                            if (requestedTypeId && eventTypes.some(et => et.id == requestedTypeId)) {
                                eventTypeId = parseInt(requestedTypeId, 10);
                            }
                            try {
                                const startTime = new Date(dateTime).toISOString();
                                const booking = await CalService.createBooking(user.id, {
                                    eventTypeId: eventTypeId,`
);

fs.writeFileSync(filepath, content);
