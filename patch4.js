const fs = require('fs');
const filepath = 'src/services/ai.js';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(
    '            let calOwner = null;\n' +
    '            if (user.owner_email) {\n' +
    '                const owner = User.findByEmail(user.owner_email);\n' +
    '                if (owner) {\n' +
    '                    calOwner = owner;\n' +
    '                    if (owner.timezone) {\n' +
    '                        userTimezone = owner.timezone;\n' +
    '                    }\n' +
    '                }\n' +
    '            } else if (user.timezone) {\n' +
    '                userTimezone = user.timezone; // fallback if passed directly\n' +
    '            }',
    '            let calOwner = null;\n' +
    '            if (user.owner_email) {\n' +
    '                const owner = User.findByEmail(user.owner_email);\n' +
    '                if (owner) {\n' +
    '                    calOwner = owner;\n' +
    '                    if (owner.timezone) {\n' +
    '                        userTimezone = owner.timezone;\n' +
    '                    }\n' +
    '                }\n' +
    '            } else {\n' +
    '                calOwner = user; // fallback: the user is the owner\n' +
    '                if (user.timezone) {\n' +
    '                    userTimezone = user.timezone; \n' +
    '                }\n' +
    '            }'
);

content = content.replace(
    'Exemple : [CAL_CHECK:2024-05-01," + eventTypes[0].id + "]`;',
    'Exemple : [CAL_CHECK:2024-05-01,${eventTypes[0].id}]`;'
);

content = content.replace(
    'Exemple : [CAL_BOOK:2024-05-01 14:00,Jean Dupont,jean@email.com,Consultation," + eventTypes[0].id + "]`;',
    'Exemple : [CAL_BOOK:2024-05-01 14:00,Jean Dupont,jean@email.com,Consultation,${eventTypes[0].id}]`;'
);


// Now fix handleIncomingMessage calOwner issue
content = content.replace(
    '            // Intercept Cal.com commands\n' +
    '            let finalResponse = response;\n' +
    '            const user = session.owner_email ? User.findByEmail(session.owner_email) : null;\n' +
    '\n' +
    '            if (user && user.ai_cal_enabled && user.cal_access_token) {\n' +
    '                const CalService = require(\'./CalService\');\n' +
    '\n' +
    '                // 1. [CAL_CHECK:YYYY-MM-DD,EVENT_TYPE_ID]\n' +
    '                const checkMatch = finalResponse.match(/\\[CAL_CHECK:([\\d-]{10})(?:,(\\d+))?\\]/);\n' +
    '                if (checkMatch) {\n' +
    '                    const date = checkMatch[1];\n' +
    '                    const requestedTypeId = checkMatch[2];\n' +
    '                    try {\n' +
    '                        const eventTypes = await CalService.getEventTypes(user.id);',
    '            // Intercept Cal.com commands\n' +
    '            let finalResponse = response;\n' +
    '            let calOwner = null;\n' +
    '            if (session.owner_email) {\n' +
    '                calOwner = User.findByEmail(session.owner_email);\n' +
    '            } else {\n' +
    '                calOwner = User.findById(sessionId);\n' +
    '            }\n' +
    '\n' +
    '            if (calOwner && calOwner.ai_cal_enabled && calOwner.cal_access_token) {\n' +
    '                const CalService = require(\'./CalService\');\n' +
    '\n' +
    '                // 1. [CAL_CHECK:YYYY-MM-DD,EVENT_TYPE_ID]\n' +
    '                const checkMatch = finalResponse.match(/\\[CAL_CHECK:([\\d-]{10})(?:,(\\d+))?\\]/);\n' +
    '                if (checkMatch) {\n' +
    '                    const date = checkMatch[1];\n' +
    '                    const requestedTypeId = checkMatch[2];\n' +
    '                    try {\n' +
    '                        const eventTypes = await CalService.getEventTypes(calOwner.id);'
);

content = content.replace(
    '                            let eventTypeId = eventTypes[0].id; // Use first event type as default\n' +
    '                            if (requestedTypeId && eventTypes.some(et => et.id == requestedTypeId)) {\n' +
    '                                eventTypeId = parseInt(requestedTypeId, 10);\n' +
    '                            }\n' +
    '                            const startTime = `${date}T00:00:00Z`;\n' +
    '                            const endTime = `${date}T23:59:59Z`;\n' +
    '                            const slots = await CalService.getAvailability(user.id, eventTypeId, startTime, endTime);',
    '                            let eventTypeId = eventTypes[0].id; // Use first event type as default\n' +
    '                            if (requestedTypeId && eventTypes.some(et => et.id == requestedTypeId)) {\n' +
    '                                eventTypeId = parseInt(requestedTypeId, 10);\n' +
    '                            }\n' +
    '                            const startTime = `${date}T00:00:00Z`;\n' +
    '                            const endTime = `${date}T23:59:59Z`;\n' +
    '                            const slots = await CalService.getAvailability(calOwner.id, eventTypeId, startTime, endTime);'
);


content = content.replace(
    '                // 2. [CAL_BOOK:YYYY-MM-DD HH:mm,Nom,Email,Motif,EVENT_TYPE_ID]\n' +
    '                const bookMatch = finalResponse.match(/\\[CAL_BOOK:([^,]+),([^,]+),([^,]+),?([^,\\]]*)(?:,(\\d+))?\\]/);\n' +
    '                if (bookMatch) {\n' +
    '                    const [_, dateTime, name, email, notes, requestedTypeId] = bookMatch;\n' +
    '                    try {\n' +
    '                        const eventTypes = await CalService.getEventTypes(user.id);',
    '                // 2. [CAL_BOOK:YYYY-MM-DD HH:mm,Nom,Email,Motif,EVENT_TYPE_ID]\n' +
    '                const bookMatch = finalResponse.match(/\\[CAL_BOOK:([^,]+),([^,]+),([^,]+),?([^,\\]]*)(?:,(\\d+))?\\]/);\n' +
    '                if (bookMatch) {\n' +
    '                    const [_, dateTime, name, email, notes, requestedTypeId] = bookMatch;\n' +
    '                    try {\n' +
    '                        const eventTypes = await CalService.getEventTypes(calOwner.id);'
);

content = content.replace(
    '                            try {\n' +
    '                                const startTime = new Date(dateTime).toISOString();\n' +
    '                                const booking = await CalService.createBooking(user.id, {\n' +
    '                                    eventTypeId: eventTypeId,',
    '                            try {\n' +
    '                                const startTime = new Date(dateTime).toISOString();\n' +
    '                                const booking = await CalService.createBooking(calOwner.id, {\n' +
    '                                    eventTypeId: eventTypeId,'
);

fs.writeFileSync(filepath, content);
