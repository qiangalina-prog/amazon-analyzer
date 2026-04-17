    async function callGeminiAPI(listingText, apiKey) {
        // 【注意】这里必须用反引号 ` 包裹网址，模型必须是 2.5
        const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `You are an aggressive Amazon CRO expert. Critique this listing. Output PURE JSON ONLY. 
        Format: { "score": 45, "issues": [ { "severity": "critical", "title": "...", "description": "..." } ] }
        Listing: "${listingText}"`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Internal Server Error");
        }

        const data = await response.json();
        const textContent = data.candidates[0].content.parts[0].text;
        const cleanJsonStr = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJsonStr);
    }
