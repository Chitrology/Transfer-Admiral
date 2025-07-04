# Transfer Rumour Checker

A full-stack web application that analyzes the reliability of football transfer rumors from Twitter/X using AI.

## Features

- **Tweet Analysis**: Extracts content from Twitter/X URLs using free oEmbed API
- **AI-Powered Assessment**: Uses Claude AI to analyze journalist credibility and claim reliability
- **Reliability Scoring**: Provides 0-100 reliability scores with detailed reasoning
- **Responsive Design**: Clean, modern interface that works on all devices
- **Real-time Processing**: Fast analysis with loading states and error handling

## Tech Stack

**Frontend:**
- Vanilla JavaScript, HTML5, CSS3
- Responsive design with CSS Grid/Flexbox
- Modern UI with glassmorphism effects

**Backend:**
- Node.js with Express.js
- Anthropic Claude API for AI analysis
- Twitter oEmbed API for tweet extraction
- Cheerio for fallback web scraping

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd transfer-rumour-checker