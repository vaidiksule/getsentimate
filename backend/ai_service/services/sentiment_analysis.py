"""
Sentiment analysis functionality
"""

import json
from django.utils import timezone
from .core import AIService


class SentimentAnalyzer:
    """Handles sentiment analysis using AI or fallback methods"""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
    
    def analyze_sentiment(self, text: str) -> dict:
        """Analyze sentiment of a single comment"""
        if not self.ai_service.is_available:
            return self._fallback_sentiment_analysis(text)
        
        try:
            prompt = f"""
            Analyze the sentiment of this YouTube comment and return a JSON response with:
            - sentiment_score: float between -1.0 (very negative) and 1.0 (very positive)
            - sentiment_label: one of "very_negative", "negative", "neutral", "positive", "very_positive"
            - confidence: float between 0.0 and 1.0
            - reasoning: brief explanation of the sentiment analysis
            
            Comment: "{text}"
            
            Return only valid JSON, no other text.
            """
            
            response = self.ai_service.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'sentiment_score': result.get('sentiment_score', 0.0),
                'sentiment_label': result.get('sentiment_label', 'neutral'),
                'confidence': result.get('confidence', 0.0),
                'reasoning': result.get('reasoning', ''),
                'model_used': self.ai_service.model_name
            }
        except Exception as e:
            print(f"AI sentiment analysis failed: {e}")
            return self._fallback_sentiment_analysis(text)
    
    def _fallback_sentiment_analysis(self, text: str) -> dict:
        """Simple fallback sentiment analysis"""
        text_lower = text.lower()
        positive_words = ['good', 'great', 'awesome', 'love', 'amazing', 'excellent', 'fantastic']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disgusting']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment_label = 'positive'
            sentiment_score = 0.6
        elif negative_count > positive_count:
            sentiment_label = 'negative'
            sentiment_score = -0.6
        else:
            sentiment_label = 'neutral'
            sentiment_score = 0.0
        
        return {
            'sentiment_score': sentiment_score,
            'sentiment_label': sentiment_label,
            'confidence': 0.5,
            'reasoning': 'Fallback analysis based on keyword matching',
            'model_used': 'fallback'
        }
