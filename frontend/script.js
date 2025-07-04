class TransferRumourChecker {
    constructor() {
        this.apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : ''; // Use relative path for production
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkForResults();
    }

    bindEvents() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const tweetInput = document.getElementById('tweetUrl');
        const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeTweet());
        }

        if (tweetInput) {
            tweetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.analyzeTweet();
                }
            });
        }

        if (analyzeAnotherBtn) {
            analyzeAnotherBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }

    checkForResults() {
        // Check if we're on results page and have data
        if (window.location.pathname.includes('results.html')) {
            const results = sessionStorage.getItem('analysisResults');
            if (results) {
                this.displayResults(JSON.parse(results));
            } else {
                // No results, redirect to main page
                window.location.href = 'index.html';
            }
        }
    }

    validateTwitterUrl(url) {
        const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
        return twitterRegex.test(url);
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    setLoadingState(isLoading) {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const tweetInput = document.getElementById('tweetUrl');
        
        if (analyzeBtn) {
            analyzeBtn.disabled = isLoading;
            analyzeBtn.classList.toggle('loading', isLoading);
        }
        
        if (tweetInput) {
            tweetInput.disabled = isLoading;
        }
    }

    async analyzeTweet() {
        const tweetInput = document.getElementById('tweetUrl');
        const tweetUrl = tweetInput.value.trim();

        if (!tweetUrl) {
            this.showError('Please enter a tweet URL');
            return;
        }

        if (!this.validateTwitterUrl(tweetUrl)) {
            this.showError('Please enter a valid Twitter/X URL');
            return;
        }

        this.setLoadingState(true);

        try {
            const response = await fetch(`${this.apiUrl}/api/analyze-tweet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tweetUrl })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            // Store results and redirect
            sessionStorage.setItem('analysisResults', JSON.stringify(data));
            window.location.href = 'results.html';

        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(error.message || 'Failed to analyze tweet. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    displayResults(results) {
        // Update tweet display
        const authorName = document.getElementById('authorName');
        const tweetContent = document.getElementById('tweetContent');
        
        if (authorName) {
            authorName.textContent = results.tweet.author || 'Unknown Author';
        }
        
        if (tweetContent) {
            tweetContent.textContent = results.tweet.text || 'Tweet content unavailable';
        }

        // Update reliability score
        const scoreNumber = document.getElementById('scoreNumber');
        const scoreCircle = document.getElementById('scoreCircle');
        const verdictText = document.getElementById('verdictText');
        const reasoningText = document.getElementById('reasoningText');

        if (scoreNumber) {
            scoreNumber.textContent = results.reliability_score || 0;
        }

        if (scoreCircle) {
            const angle = (results.reliability_score / 100) * 360;
            scoreCircle.style.setProperty('--score-angle', `${angle}deg`);
            
            // Set color based on score
            const score = results.reliability_score;
            let colorClass = 'score-terrible';
            if (score >= 90) colorClass = 'score-excellent';
            else if (score >= 70) colorClass = 'score-good';
            else if (score >= 50) colorClass = 'score-average';
            else if (score >= 30) colorClass = 'score-poor';
            
            scoreCircle.className = `score-circle ${colorClass}`;
        }

        if (verdictText) {
            verdictText.textContent = results.reliability_label || 'Unknown';
        }

        if (reasoningText) {
            reasoningText.textContent = results.reasoning || 'No reasoning available';
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TransferRumourChecker();
});