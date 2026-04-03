with open('src/services/ai.js', 'r') as f:
    content = f.read()

# 1. Update the finalSystemPrompt to ask the AI to include a confidence marker and off-topic handler

confidence_prompt = """
[ÉVALUATION DE LA CONFIANCE ET HORS SUJET]
Tu dois évaluer ta confiance dans ta réponse et vérifier si la question est dans ton domaine.
1. Si la question est complètement hors de ton domaine de compétence (ex: programmation si tu es un bot de vente), tu DOIS répondre EXACTEMENT par : "Je ne suis pas programmé pour répondre à cela. Veuillez contacter un humain pour cette question."
2. Si tu n'es pas sûr de ta réponse (confiance faible, manque de données), commence ta réponse par "[LOW_CONFIDENCE]" puis donne ta meilleure réponse.
"""

# Insert this after RAG and Constraints but before messages array
content = content.replace("            if (ragContext) {", "            finalSystemPrompt += `\\n\\n" + confidence_prompt.strip() + "`;\n\n            if (ragContext) {")

with open('src/services/ai.js', 'w') as f:
    f.write(content)
