import re

with open('src/services/ai.js', 'r') as f:
    content = f.read()

# Update sendAutoResponse to pass the text
content = content.replace("this.recordAIResponse(sessionId, jid);", "this.recordAIResponse(sessionId, jid, text);")

with open('src/services/ai.js', 'w') as f:
    f.write(content)
