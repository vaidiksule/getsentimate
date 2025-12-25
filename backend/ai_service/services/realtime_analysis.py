"""
Real-time analysis functionality
"""

import json
import re
from typing import Dict
from django.utils import timezone
from .core import AIService
from .sentiment_analysis import SentimentAnalyzer
from .toxicity_detection import ToxicityDetector


class RealtimeAnalyzer:
    """Handles real-time analysis of comments"""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        self.sentiment_analyzer = SentimentAnalyzer(ai_service)
        self.toxicity_detector = ToxicityDetector(ai_service)
    
    def analyze_comment_realtime(self, comment_text: str, comment_id: str = None) -> Dict:
        """Real-time analysis of a single comment with progress tracking"""
        if not self.ai_service.is_available:
            return self._fallback_comprehensive_analysis(comment_text)
        
        try:
            # Clean and prepare text
            cleaned_text = comment_text.strip()[:1000]
            
            prompt = f"""
            Analyze this YouTube comment in real-time and return a JSON response with:
            
            {{
                "sentiment": {{
                    "score": float between -1.0 (very negative) and 1.0 (very positive),
                    "label": one of ["very_negative", "negative", "neutral", "positive", "very_positive"],
                    "confidence": float between 0.0 and 1.0
                }},
                "toxicity": {{
                    "score": float between 0.0 (not toxic) and 1.0 (highly toxic),
                    "label": one of ["not_toxic", "slightly_toxic", "moderately_toxic", "highly_toxic"],
                    "categories": ["list of toxicity categories if any"]
                }},
                "engagement": {{
                    "score": float between 0.0 and 1.0,
                    "type": one of ["question", "appreciation", "criticism", "suggestion", "conversation", "other"],
                    "requires_response": boolean,
                    "priority": one of ["low", "medium", "high"]
                }},
                "quality": {{
                    "score": float between 0.0 and 1.0,
                    "constructive": boolean,
                    "spam_likelihood": float between 0.0 and 1.0
                }}
            }}
            
            Comment: "{cleaned_text}"
            
            Return only valid JSON, no other text.
            """
            
            response = self.ai_service.model.generate_content(prompt)
            
            # Parse response with error handling
            try:
                result = json.loads(response.text)
            except json.JSONDecodeError:
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    raise ValueError("Could not extract JSON from AI response")
            
            # Add metadata
            analysis_result = {
                'comment_id': comment_id,
                'text_analyzed': cleaned_text[:100] + '...' if len(cleaned_text) > 100 else cleaned_text,
                'sentiment_score': result.get('sentiment', {}).get('score', 0.0),
                'sentiment_label': result.get('sentiment', {}).get('label', 'neutral'),
                'sentiment_confidence': result.get('sentiment', {}).get('confidence', 0.0),
                'toxicity_score': result.get('toxicity', {}).get('score', 0.0),
                'toxicity_label': result.get('toxicity', {}).get('label', 'not_toxic'),
                'toxicity_categories': result.get('toxicity', {}).get('categories', []),
                'engagement_score': result.get('engagement', {}).get('score', 0.0),
                'engagement_type': result.get('engagement', {}).get('type', 'other'),
                'requires_response': result.get('engagement', {}).get('requires_response', False),
                'priority_level': result.get('engagement', {}).get('priority', 'low'),
                'quality_score': result.get('quality', {}).get('score', 0.0),
                'is_constructive': result.get('quality', {}).get('constructive', True),
                'spam_likelihood': result.get('quality', {}).get('spam_likelihood', 0.0),
                'model_used': self.ai_service.model_name,
                'analysis_timestamp': timezone.now().isoformat(),
                'status': 'completed'
            }
            
            return analysis_result
            
        except Exception as e:
            print(f"Real-time comment analysis failed: {e}")
            return {
                'comment_id': comment_id,
                'text_analyzed': comment_text[:100] + '...' if len(comment_text) > 100 else comment_text,
                'status': 'failed',
                'error': str(e),
                'analysis_timestamp': timezone.now().isoformat()
            }
    
    def _fallback_comprehensive_analysis(self, text: str) -> Dict:
        """Fallback comprehensive analysis when AI service is unavailable"""
        # Use existing fallback methods
        sentiment = self.sentiment_analyzer._fallback_sentiment_analysis(text)
        toxicity = self.toxicity_detector._fallback_toxicity_detection(text)
        
        # Simple engagement analysis
        text_lower = text.lower()
        question_words = ['what', 'when', 'where', 'why', 'how', '?']
        appreciation_words = ['great', 'awesome', 'amazing', 'love', 'thank']
        criticism_words = ['bad', 'terrible', 'awful', 'hate', 'worst']
        
        has_question = any(word in text_lower for word in question_words)
        has_appreciation = any(word in text_lower for word in appreciation_words)
        has_criticism = any(word in text_lower for word in criticism_words)
        
        if has_question:
            engagement_type = 'question'
            requires_response = True
            priority_level = 'high'
        elif has_appreciation:
            engagement_type = 'appreciation'
            requires_response = False
            priority_level = 'low'
        elif has_criticism:
            engagement_type = 'criticism'
            requires_response = True
            priority_level = 'medium'
        else:
            engagement_type = 'conversation'
            requires_response = False
            priority_level = 'low'
        
        return {
            'sentiment_analysis': sentiment,
            'toxicity_analysis': toxicity,
            'engagement_analysis': {
                'engagement_score': 0.5,
                'engagement_type': engagement_type,
                'requires_response': requires_response,
                'priority_level': priority_level
            },
            'content_quality': {
                'quality_score': 0.6,
                'constructive': not has_criticism,
                'spam_likelihood': 0.1
            }
        }
