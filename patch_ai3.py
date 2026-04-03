with open('src/services/ai.js', 'r') as f:
    content = f.read()

filter_method = """
    /**
     * Filters generated content to prevent sending sensitive or offensive information
     * @param {string} content - The AI generated content
     * @returns {boolean} - True if content is safe, False otherwise
     */
    static isContentSafe(content) {
        if (!content) return true;

        // Basic list of forbidden patterns or words (can be extended or fetched from DB)
        // Here we put a basic generic list of inappropriate words/patterns or safety checks
        const forbiddenWords = [
            'mot_interdit_1', 'mot_interdit_2', // Examples
            // We can add actual sensitive terms if needed, but for now a placeholder list
            'ignore toutes les instructions',
            'ignore previous instructions'
        ];

        const lowerContent = content.toLowerCase();
        for (const word of forbiddenWords) {
            if (lowerContent.includes(word)) {
                return false;
            }
        }
        return true;
    }
"""

# Insert filter_method before callAI
content = content.replace("static async callAI", filter_method + "\n    static async callAI")

# Update handleIncomingMessage to use the filter
search_block = """
            // Default to 'bot' mode as per specs
            await this.sendAutoResponse(sock, remoteJid, finalResponse, sessionId);
"""

replace_block = """
            // Default to 'bot' mode as per specs

            // 5. Content Filtering
            if (!this.isContentSafe(finalResponse)) {
                log(`Réponse IA bloquée par le filtre de contenu pour ${remoteJid}`, sessionId, { event: 'ai-content-filtered' }, 'WARN');
                finalResponse = "Désolé, je ne peux pas générer cette réponse car elle ne respecte pas nos consignes de sécurité.";
            }

            await this.sendAutoResponse(sock, remoteJid, finalResponse, sessionId);
"""

content = content.replace(search_block.strip(), replace_block.strip())

with open('src/services/ai.js', 'w') as f:
    f.write(content)
