with open('src/services/ai.js', 'r') as f:
    content = f.read()

# Fix 1: Pass messageText to isLoopDetected
content = content.replace("if (this.isLoopDetected(sessionId, remoteJid)) {", "if (this.isLoopDetected(sessionId, remoteJid, messageText)) {")

# Fix 2: Handle LOW_CONFIDENCE properly
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
"""

replace_block = """
            // 6. Confidence Check (LOW_CONFIDENCE marker)
            if (finalResponse.includes("[LOW_CONFIDENCE]")) {
                log(`Faible confiance détectée dans la réponse pour ${remoteJid}`, sessionId, { event: 'ai-low-confidence' }, 'WARN');
                finalResponse = "Désolé, je ne suis pas certain de la réponse. Veuillez contacter un humain.";
            }
"""

content = content.replace(search_block.strip(), replace_block.strip())

with open('src/services/ai.js', 'w') as f:
    f.write(content)
