with open('src/services/ai.js', 'r') as f:
    content = f.read()

# Add a check for off-topic response
search_block = """
            // 6. Confidence Check (LOW_CONFIDENCE marker)
            if (finalResponse.includes("[LOW_CONFIDENCE]")) {
                log(`Faible confiance détectée dans la réponse pour ${remoteJid}`, sessionId, { event: 'ai-low-confidence' }, 'WARN');
                // Remove the marker
                finalResponse = finalResponse.replace("[LOW_CONFIDENCE]", "").trim();
                // Optionally override the response or let it pass with the marker removed.
                // Depending on the requirement, we could abstain:
                // finalResponse = "Désolé, je ne suis pas certain de la réponse. Veuillez contacter un humain.";
            }

            await this.sendAutoResponse(sock, remoteJid, finalResponse, sessionId);
"""

replace_block = """
            // 6. Confidence Check (LOW_CONFIDENCE marker)
            if (finalResponse.includes("[LOW_CONFIDENCE]")) {
                log(`Faible confiance détectée dans la réponse pour ${remoteJid}`, sessionId, { event: 'ai-low-confidence' }, 'WARN');
                // Remove the marker
                finalResponse = finalResponse.replace("[LOW_CONFIDENCE]", "").trim();
                // Optionally override the response or let it pass with the marker removed.
                // Depending on the requirement, we could abstain:
                // finalResponse = "Désolé, je ne suis pas certain de la réponse. Veuillez contacter un humain.";
            }

            // 7. Off-Topic Check
            if (finalResponse.includes("Je ne suis pas programmé pour répondre à cela.")) {
                log(`Message hors-sujet détecté pour ${remoteJid}`, sessionId, { event: 'ai-off-topic' }, 'INFO');
                // It will send the off-topic message naturally.
            }

            await this.sendAutoResponse(sock, remoteJid, finalResponse, sessionId);
"""

content = content.replace(search_block.strip(), replace_block.strip())

with open('src/services/ai.js', 'w') as f:
    f.write(content)
