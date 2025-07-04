const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAnalyzer {
    constructor() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }
        
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
    }

    async analyzeWithClaude(tweetData) {
        try {
            const prompt = this.buildAnalysisPrompt(tweetData);
            
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                temperature: 0.1,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const analysisText = response.content[0].text;
            
            // Debug logging
            console.log('=== CLAUDE RAW RESPONSE START ===');
            console.log(analysisText);
            console.log('=== CLAUDE RAW RESPONSE END ===');
            
            return this.parseAnalysisResponse(analysisText);

        } catch (error) {
            console.error('Claude analysis error:', error);
            throw new Error('Failed to analyze tweet with AI: ' + error.message);
        }
    }

    buildAnalysisPrompt(tweetData) {
        return `You are a football transfer reliability analyzer. Analyze this tweet and respond with ONLY a valid JSON object in the exact format shown below.

Tweet: "${tweetData.text}"
Author: "${tweetData.author}"

JOURNALIST TIERS:
- Tier 1 (Base Score 85-100): Fabrizio Romano, David Ornstein, Gianluca Di Marzio, James Pearce, Paul Joyce, Ben Jacobs, Matteo Moretto
- Tier 2 (Base Score 65-85): Reliable club journalists, Sky Sports News, BBC Sport, The Athletic reporters
- Tier 3 (Base Score 45-65): Decent sources with mixed records, regional newspapers
- Tier 4 (Base Score 25-45): Aggregators, questionable sources, fan accounts
- Tier 5 (Base Score 0-25): Unreliable, fake accounts, clickbait

LANGUAGE INDICATORS:
- "HERE WE GO", "DONE DEAL", "CONFIRMED", "OFFICIAL" = +10-15 points
- Specific details (fees, contract length, medical dates) = +5-10 points
- "Could", "might", "interested", "monitoring" = -5-10 points

CITATION ANALYSIS (VERY IMPORTANT):
Look for these patterns and apply score bonuses:

OFFICIAL SOURCES (+20-30 points):
- "@clubname official", "club confirms", "official announcement"
- Verified club accounts, player accounts, agent accounts
- Official websites, press conferences

TIER 1 CITATIONS (+15-25 points):
- "according to @FabrizioRomano", "reports @David_Ornstein"
- "via Romano", "per Di Marzio", "Sky Sports reports"
- Any mention of Tier 1 journalists as sources

TIER 2 CITATIONS (+10-15 points):
- "BBC reports", "The Athletic says", "Sky Sports News"
- Local reliable journalists, club journalists

NEWS OUTLET CITATIONS (+5-15 points):
- "ESPN reports", "Goal.com", "Transfer Guru", major sports outlets

CITATION VERIFICATION NOTES:
- If citing sources, add verification reminder in reasoning
- Distinguish between first-hand reporting vs. citing others
- Note if original source should be checked

SCORING FORMULA:
Final Score = Base Score (author tier) + Language Bonus + Citation Bonus + Context Factors

CONTEXT FACTORS:
- Transfer window timing (+/- 5 points)
- Logical fit for club/player (+/- 5 points)
- Contradicts reliable sources (-10 points)

Respond with ONLY this JSON format (no other text):

{
  "journalist_tier": "Tier X",
  "language_confidence": "High/Medium/Low",
  "source_quality": "Excellent/Good/Fair/Poor",
  "reliability_score": 95,
  "citation_bonus": 15,
  "citations_found": ["@FabrizioRomano", "Club Official"],
  "reasoning": "Detailed explanation including: 1) Author credibility, 2) Language analysis, 3) Citation analysis with verification notes, 4) Final assessment"
}`;
    }

    parseAnalysisResponse(analysisText) {
        try {
            // Clean the response text
            let cleanText = analysisText.trim();
            
            // Remove any markdown code blocks
            cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            // Find JSON object
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                console.log('Attempting to parse JSON:', jsonStr);
                
                const parsed = JSON.parse(jsonStr);
                
                const result = {
                    journalist_tier: parsed.journalist_tier || 'Unknown',
                    language_confidence: parsed.language_confidence || 'Unknown',
                    source_quality: parsed.source_quality || 'Unknown',
                    reliability_score: this.validateScore(parsed.reliability_score || 50),
                    citation_bonus: parsed.citation_bonus || 0,
                    citations_found: parsed.citations_found || [],
                    reasoning: parsed.reasoning || 'Analysis completed but limited reasoning provided.'
                };
                
                console.log('Successfully parsed result:', result);
                return result;
            }

            // If no JSON found, try manual parsing
            console.log('No JSON found, attempting manual parsing...');
            return this.parseManually(analysisText);

        } catch (error) {
            console.error('JSON parsing error:', error);
            console.log('Falling back to manual parsing...');
            return this.parseManually(analysisText);
        }
    }

    parseManually(text) {
        console.log('Manual parsing of text:', text);
        
        // Try to extract key information manually
        let score = 50;
        let reasoning = text;
        let tier = 'Unknown';
        let confidence = 'Unknown';
        let quality = 'Unknown';

        // Extract score
        const scorePatterns = [
            /reliability_score['":\s]*(\d+)/i,
            /score['":\s]*(\d+)/i,
            /(\d+)\/100/,
            /(\d+)\s*points?/i,
            /rate.*?(\d+)/i
        ];

        for (const pattern of scorePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                score = parseInt(match[1]);
                console.log(`Found score ${score} using pattern ${pattern}`);
                break;
            }
        }

        // Extract tier information
        const tierMatch = text.match(/tier\s*(\d+|one|two|three|four|five)/i);
        if (tierMatch) {
            tier = `Tier ${tierMatch[1]}`;
        }

        // Check for citation indicators and boost score accordingly
        const citationPatterns = [
            // Official sources
            { pattern: /@\w+\s*(official|confirms?|announces?)/i, boost: 25, type: 'Official Source' },
            { pattern: /official[ly]?\s+(announcement|confirmation)/i, boost: 25, type: 'Official Announcement' },
            
            // Tier 1 journalists
            { pattern: /(according to|reports?|via|per)\s*@?fabrizio\s*romano/i, boost: 20, type: 'Fabrizio Romano' },
            { pattern: /(according to|reports?|via|per)\s*@?david[\s_]ornstein/i, boost: 20, type: 'David Ornstein' },
            { pattern: /(according to|reports?|via|per)\s*@?di\s*marzio/i, boost: 20, type: 'Di Marzio' },
            
            // News outlets
            { pattern: /(sky sports?|bbc sport|the athletic)\s*(reports?|says?|confirms?)/i, boost: 15, type: 'Major Outlet' },
            { pattern: /(espn|goal\.com|transfer guru)\s*(reports?|says?)/i, boost: 10, type: 'Sports Outlet' },
            
            // Direct quotes/sources
            { pattern: /sources?\s+(confirm|tell|say)/i, boost: 10, type: 'Source Citation' },
            { pattern: /(breaking|exclusive):/i, boost: 5, type: 'Breaking News' }
        ];

        let totalBoost = 0;
        const foundCitations = [];

        for (const citation of citationPatterns) {
            if (citation.pattern.test(text)) {
                totalBoost += citation.boost;
                foundCitations.push(citation.type);
                console.log(`Found citation: ${citation.type}, boost: +${citation.boost}`);
            }
        }

        // Apply citation boost to score
        if (totalBoost > 0) {
            score = Math.min(score + totalBoost, 100);
            console.log(`Applied citation boost: +${totalBoost}, new score: ${score}`);
        }

        // Determine quality based on score
        if (score >= 90) quality = 'Excellent';
        else if (score >= 70) quality = 'Good';
        else if (score >= 50) quality = 'Fair';
        else quality = 'Poor';

        const result = {
            journalist_tier: tier,
            language_confidence: confidence,
            source_quality: quality,
            reliability_score: this.validateScore(score),
            citation_bonus: totalBoost,
            citations_found: foundCitations,
            reasoning: reasoning || 'Manual analysis completed with extracted information.'
        };

        console.log('Manual parsing result:', result);
        return result;
    }

    validateScore(score) {
        const numScore = parseInt(score);
        if (isNaN(numScore) || numScore < 0) return 0;
        if (numScore > 100) return 100;
        return numScore;
    }
}

module.exports = {
    analyzeWithClaude: (tweetData) => new ClaudeAnalyzer().analyzeWithClaude(tweetData)
};