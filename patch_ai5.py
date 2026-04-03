with open('src/services/ai.js', 'r') as f:
    content = f.read()

search_block = """
            // 5. Content Filtering
            if (!this.isContentSafe(finalResponse)) {
                log(`Réponse IA bloquée par le filtre de contenu pour ${remoteJid}`, sessionId, { event: 'ai-content-filtered' }, 'WARN');
                finalResponse = "Désolé, je ne peux pas générer cette réponse car elle ne respecte pas nos consignes de sécurité.";
            }

            await this.sendAutoResponse(sock, remoteJid, finalResponse, sessionId);
"""

replace_block = """
            // 5. Content Filtering
            if (!this.isContentSafe(finalResponse)) {
                log(`Réponse IA bloquée par le filtre de contenu pour ${remoteJid}`, sessionId, { event: 'ai-content-filtered' }, 'WARN');
                finalResponse = "Désolé, je ne peux pas générer cette réponse car elle ne respecte pas nos consignes de sécurité.";
            }

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

content = content.replace(search_block.strip(), replace_block.strip())

with open('src/services/ai.js', 'w') as f:
    f.write(content)
