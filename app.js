document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnText = document.querySelector('.btn-text');
    const loader = document.querySelector('.loader');
    const reportSection = document.getElementById('diagnosis-result');
    const textarea = document.getElementById('listing-input');
    const apiKeyInput = document.getElementById('api-key');
    const issuesContainer = document.getElementById('issues-list');
    const scoreValue = document.getElementById('score-value');

    function setLoading(isLoading) {
        analyzeBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
            reportSection.classList.add('hidden');
        } else {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }

    analyzeBtn.addEventListener('click', async () => {
        const inputVal = textarea.value.trim();
        const apiKey = apiKeyInput.value.trim();
        if (!inputVal) return flashError(textarea);
        if (!apiKey) {
            alert("Please provide a Gemini API Key.");
            return flashError(apiKeyInput);
        }
        setLoading(true);
        issuesContainer.innerHTML = ''; 
        try {
            const diagnosis = await callGeminiAPI(inputVal, apiKey);
            renderDiagnosis(diagnosis);
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setLoading(false);
        }
    });

    function flashError(el) {
        el.style.borderColor = '#EF4444';
        setTimeout(() => el.style.borderColor = '', 1000);
    }

    async function callGeminiAPI(listingText, apiKey) {
        // [普通单引号版] 绝对不会出错！
        var endpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + apiKey;
        var prompt = 'You are a brutal Amazon optimization expert. Critique this listing. Output PURE JSON ONLY. Format: { "score": 45, "issues": [ { "severity": "critical", "title": "Problem", "description": "Why it fails" } ] } Listing: ' + listingText;
        var response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) {
            var err = await response.json();
            throw new Error(err.error ? err.error.message : "API Error");
        }
        var data = await response.json();
        var textContent = data.candidates[0].content.parts[0].text;
        var cleanJsonStr = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJsonStr);
    }

    function renderDiagnosis(diagnosis) {
        scoreValue.textContent = diagnosis.score + '/100';
        scoreValue.className = 'score-value ' + (diagnosis.score < 60 ? 'error' : 'warning');
        diagnosis.issues.forEach(function(issue) {
            var isCritical = issue.severity === 'critical';
            var icon = isCritical ? '🔴' : '🟡';
            var cardClass = isCritical ? 'critical' : 'warning';
            var cardHtml = '<div class="issue-card ' + cardClass + '"><div class="issue-icon">' + icon + '</div><div class="issue-content"><h3>' + issue.title + '</h3><p>' + issue.description + '</p></div></div>';
            issuesContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
        reportSection.classList.remove('hidden');
        reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    if (document.querySelector('.checkout-btn')) {
        document.querySelector('.checkout-btn').addEventListener('click', function() {
            window.location.href = "https://qiangalina.gumroad.com/l/amazon-listing-pro";
        });
    }
});
