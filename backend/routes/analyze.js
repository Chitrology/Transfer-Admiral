const express = require('express');
const { extractTweetContent } = require('../utils/tweetExtractor');
const { analyzeWithClaude } = require('../utils/claudeAnalyzer');

const router = express.Router();

router.post('/analyze-tweet', async (req, res) => {
    try {
        const { tweetUrl } = req.body;

        if (!tweetUrl) {
            return res.status(400).json({ error: 'Tweet URL is required' });
        }

        // Validate Twitter URL format
        const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
        if (!twitterRegex.test(tweetUrl)) {
            return res.status(400).json({ error: 'Invalid Twitter/X URL format' });
        }

        console.log('Analyzing tweet:', tweetUrl);

        // Extract tweet content
        const tweetData = await extractTweetContent(tweetUrl);
        console.log('Tweet extracted:', tweetData);

        // Analyze with Claude
        const analysis = await analyzeWithClaude(tweetData);
        console.log('Analysis complete:', analysis);

        // Determine reliability label
        const getReliabilityLabel = (score) => {
            if (score >= 90) return 'Highly Reliable';
            if (score >= 70) return 'Reliable';
            if (score >= 50) return 'Partially Reliable';
            if (score >= 30) return 'Not Reliable';
            return 'Garbage';
        };

        const response = {
            tweet: tweetData,
            reliability_score: analysis.reliability_score,
            reliability_label: getReliabilityLabel(analysis.reliability_score),
            reasoning: analysis.reasoning
        };

        res.json(response);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to analyze tweet' 
        });
    }
});

module.exports = router;