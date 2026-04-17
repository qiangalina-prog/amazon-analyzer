document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    const reportSection = document.getElementById('diagnosis-result');
    const textarea = document.getElementById('listing-input');
    const apiKeyInput = document.getElementById('api-key');
    const issuesContainer = document.getElementById('issues-list');
    const scoreValue = document.getElementById('score-value');

    analyzeBtn.addEventListener('click', async () => {
        const inputVal = textarea.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!inputVal) {
            flashError(textarea);
            return;
        }

        if (!apiKey) {
            alert("Please provide a Gemini API Key to run the diagnosis.");
            flashError(apiKeyInput);
            return;
        }

        analyzeBtn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        reportSection.classList.add('hidden');
        issuesContainer.innerHTML = '';

        try {
            const diagnosis = await callGeminiAPI(inputVal, apiKey);
            renderDiagnosis(diagnosis);
        } catch (e) {
            alert("Error calling AI: " + e.message);
            analyzeBtn.disabled = false;
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    });

    function flashError(element) {
        element.style.borderColor = '#EF4444';
        setTimeout(() => {
            element.style.borderColor = '';
        }, 1000);
    }

    async function callGeminiAPI(listingText, apiKey) {
        // 使用 2026 年最新的 Gemini 2.5 Flash 稳定接口
        const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `You are an aggressive, brutally honest Amazon eCommerce Conversion Rate Optimization (CRO) expert. \n
Critique the following Amazon product listing. You are extremely harsh on features vs benefits, keyword missing, and poor readability.
Do NOT rewrite the listing for them. Only provide a devastating diagnosis.
Output your response as PURE JSON without any markdown formatting wrappers. 

Format exactly as:
{
    "score": 45, 
    "issues": [
        {
            "severity": "critical", 
            "title": "Short title",
            "description": "Brutal explanation."
        }
    ]
}

Ensure there are exactly 2 issues in the list (1 critical, 1 warning).

Here is the listing:
"${listingText}"`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500
            }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Unknown API Error");
        }

        const data = await response.json();
        const textContent = data.candidates[0].content.parts[0].text;
        const cleanJsonStr = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJsonStr);
    }

    function renderDiagnosis(diagnosis) {
        analyzeBtn.disabled = false;
        btnText.classList.remove('hidden');
        loader.classList.add('hidden');

        scoreValue.textContent = diagnosis.score + '/100';
        scoreValue.className = 'score-value ' + (diagnosis.score < 60 ? 'error' : 'warning');

        diagnosis.issues.forEach(issue => {
            const isCritical = issue.severity === 'critical';
            const icon = isCritical ? '🔴' : '🟡';
            const cardClass = isCritical ? 'critical' : 'warning';
            
            const cardHtml = `
                <div class="issue-card ${cardClass}">
                    <div class="issue-icon">${icon}</div>
                    <div class="issue-content">
                        <h3>${issue.title}</h3>
                        <p>${issue.description}</p>
                    </div>
                </div>
            `;
            issuesContainer.insertAdjacentHTML('beforeend', cardHtml);
        });

        reportSection.classList.remove('hidden');
        reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = "https://qiangalina.gumroad.com/l/amazon-listing-pro";
        });
    }
});
