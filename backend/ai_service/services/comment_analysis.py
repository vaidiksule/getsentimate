"""
Comment analysis and batch processing
"""

import json
import re
from typing import Dict, List
from django.utils import timezone
from .core import AIService
from .sentiment_analysis import SentimentAnalyzer
from .toxicity_detection import ToxicityDetector


class CommentAnalyzer:
    """Handles comprehensive comment analysis"""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
        self.sentiment_analyzer = SentimentAnalyzer(ai_service)
        self.toxicity_detector = ToxicityDetector(ai_service)
    
    def analyze_comments(self, comments: List[str], analysis_type: str = 'sentiment', include_toxicity: bool = True) -> Dict:
        """
        Analyze comments for sentiment and toxicity
        
        Args:
            comments: List of comment texts to analyze
            analysis_type: Type of analysis ('sentiment', 'toxicity', 'comprehensive')
            include_toxicity: Whether to include toxicity analysis
            
        Returns:
            Dictionary with analysis results
        """
        if not comments:
            return {
                'total_comments': 0,
                'sentiment_summary': {},
                'toxicity_summary': {},
                'detailed_results': []
            }
        
        try:
            if self.ai_service.is_available and analysis_type == 'comprehensive':
                # Use comprehensive analysis for each comment
                detailed_results = []
                for comment in comments:
                    result = self.analyze_single_comment_comprehensive(comment)
                    detailed_results.append(result)
                
                # Aggregate results
                return self._aggregate_comprehensive_results(detailed_results)
            else:
                # Use batch analysis for sentiment and toxicity
                batch_results = self.analyze_comment_batch(comments)
                
                # Aggregate sentiment results
                sentiment_scores = [r['sentiment']['sentiment_score'] for r in batch_results]
                sentiment_labels = [r['sentiment']['sentiment_label'] for r in batch_results]
                
                # Aggregate toxicity results if requested
                toxicity_summary = {}
                if include_toxicity:
                    toxicity_scores = [r['toxicity']['toxicity_score'] for r in batch_results]
                    toxicity_labels = [r['toxicity']['toxicity_label'] for r in batch_results]
                    
                    toxicity_summary = {
                        'average_score': sum(toxicity_scores) / len(toxicity_scores) if toxicity_scores else 0,
                        'distribution': {
                            label: toxicity_labels.count(label) for label in set(toxicity_labels)
                        }
                    }
                
                # Calculate sentiment summary
                sentiment_summary = {
                    'average_score': sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0,
                    'distribution': {
                        label: sentiment_labels.count(label) for label in set(sentiment_labels)
                    }
                }
                
                return {
                    'total_comments': len(comments),
                    'sentiment_summary': sentiment_summary,
                    'toxicity_summary': toxicity_summary,
                    'detailed_results': batch_results,
                    'analysis_type': analysis_type,
                    'model_used': self.ai_service.model_name if self.ai_service.is_available else 'fallback'
                }
                
        except Exception as e:
            print(f"Error in analyze_comments: {e}")
            return self._fallback_analyze_comments(comments, analysis_type, include_toxicity)
    
    def analyze_comment_batch(self, comments: List[str]) -> List[Dict]:
        """Analyze a batch of comments for sentiment and toxicity"""
        results = []
        
        for comment in comments:
            sentiment = self.sentiment_analyzer.analyze_sentiment(comment)
            toxicity = self.toxicity_detector.detect_toxicity(comment)
            
            results.append({
                'text': comment,
                'sentiment': sentiment,
                'toxicity': toxicity,
                'analysis_timestamp': timezone.now().isoformat()
            })
        
        return results
    
    def analyze_single_comment_comprehensive(self, comment_text: str) -> Dict:
        """Comprehensive analysis of a single comment with enhanced insights"""
        if not self.ai_service.is_available:
            return self._fallback_comprehensive_analysis(comment_text)
        
        try:
            # Clean and prepare text
            cleaned_text = comment_text.strip()[:1000]
            
            prompt = f"""
            Perform a comprehensive analysis of this YouTube comment and return a JSON response with:
            
            {{
                "sentiment_analysis": {{
                    "sentiment_score": float between -1.0 (very negative) and 1.0 (very positive),
                    "sentiment_label": one of ["very_negative", "negative", "neutral", "positive", "very_positive"],
                    "confidence": float between 0.0 and 1.0,
                    "reasoning": "brief explanation of sentiment"
                }},
                "toxicity_analysis": {{
                    "toxicity_score": float between 0.0 (not toxic) and 1.0 (highly toxic),
                    "toxicity_label": one of ["not_toxic", "slightly_toxic", "moderately_toxic", "highly_toxic"],
                    "categories": ["list of toxicity categories if any"],
                    "confidence": float between 0.0 and 1.0
                }},
                "engagement_analysis": {{
                    "engagement_score": float between 0.0 and 1.0,
                    "engagement_type": one of ["question", "appreciation", "criticism", "suggestion", "conversation", "other"],
                    "requires_response": boolean,
                    "priority_level": one of ["low", "medium", "high"]
                }},
                "content_quality": {{
                    "quality_score": float between 0.0 and 1.0,
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
            
            # Validate and normalize results
            validated_result = self._validate_comprehensive_analysis(result)
            
            return {
                **validated_result,
                'model_used': self.ai_service.model_name,
                'text_analyzed': cleaned_text[:100] + '...' if len(cleaned_text) > 100 else cleaned_text,
                'analysis_timestamp': timezone.now().isoformat()
            }
            
        except Exception as e:
            print(f"Comprehensive comment analysis failed: {e}")
            return self._fallback_comprehensive_analysis(comment_text)
    
    def _validate_comprehensive_analysis(self, result: Dict) -> Dict:
        """Validate and normalize comprehensive analysis results"""
        try:
            # Validate sentiment analysis
            sentiment = result.get('sentiment_analysis', {})
            sentiment_score = float(sentiment.get('sentiment_score', 0.0))
            sentiment_score = max(-1.0, min(1.0, sentiment_score))
            
            sentiment_label = sentiment.get('sentiment_label', 'neutral')
            valid_sentiments = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']
            if sentiment_label not in valid_sentiments:
                sentiment_label = 'neutral'
            
            # Validate toxicity analysis
            toxicity = result.get('toxicity_analysis', {})
            toxicity_score = float(toxicity.get('toxicity_score', 0.0))
            toxicity_score = max(0.0, min(1.0, toxicity_score))
            
            toxicity_label = toxicity.get('toxicity_label', 'not_toxic')
            valid_toxicity = ['not_toxic', 'slightly_toxic', 'moderately_toxic', 'highly_toxic']
            if toxicity_label not in valid_toxicity:
                toxicity_label = 'not_toxic'
            
            # Validate engagement analysis
            engagement = result.get('engagement_analysis', {})
            engagement_score = float(engagement.get('engagement_score', 0.0))
            engagement_score = max(0.0, min(1.0, engagement_score))
            
            engagement_type = engagement.get('engagement_type', 'other')
            valid_engagement_types = ['question', 'appreciation', 'criticism', 'suggestion', 'conversation', 'other']
            if engagement_type not in valid_engagement_types:
                engagement_type = 'other'
            
            # Validate content quality
            quality = result.get('content_quality', {})
            quality_score = float(quality.get('quality_score', 0.0))
            quality_score = max(0.0, min(1.0, quality_score))
            
            return {
                'sentiment_analysis': {
                    'sentiment_score': sentiment_score,
                    'sentiment_label': sentiment_label,
                    'confidence': float(sentiment.get('confidence', 0.0)),
                    'reasoning': sentiment.get('reasoning', '')
                },
                'toxicity_analysis': {
                    'toxicity_score': toxicity_score,
                    'toxicity_label': toxicity_label,
                    'categories': toxicity.get('categories', []),
                    'confidence': float(toxicity.get('confidence', 0.0))
                },
                'engagement_analysis': {
                    'engagement_score': engagement_score,
                    'engagement_type': engagement_type,
                    'requires_response': bool(engagement.get('requires_response', False)),
                    'priority_level': engagement.get('priority_level', 'low')
                },
                'content_quality': {
                    'quality_score': quality_score,
                    'constructive': bool(quality.get('constructive', False)),
                    'spam_likelihood': float(quality.get('spam_likelihood', 0.0))
                }
            }
            
        except Exception as e:
            print(f"Error validating comprehensive analysis: {e}")
            return self._fallback_comprehensive_analysis("")['sentiment_analysis']
    
    def _aggregate_comprehensive_results(self, detailed_results: List[Dict]) -> Dict:
        """Aggregate comprehensive analysis results"""
        if not detailed_results:
            return {
                'total_comments': 0,
                'sentiment_summary': {},
                'toxicity_summary': {},
                'detailed_results': []
            }
        
        # Extract sentiment data
        sentiment_scores = []
        sentiment_labels = []
        toxicity_scores = []
        toxicity_labels = []
        
        for result in detailed_results:
            if 'sentiment_analysis' in result:
                sentiment_scores.append(result['sentiment_analysis'].get('sentiment_score', 0))
                sentiment_labels.append(result['sentiment_analysis'].get('sentiment_label', 'neutral'))
            
            if 'toxicity_analysis' in result:
                toxicity_scores.append(result['toxicity_analysis'].get('toxicity_score', 0))
                toxicity_labels.append(result['toxicity_analysis'].get('toxicity_label', 'not_toxic'))
        
        # Calculate summaries
        sentiment_summary = {
            'average_score': sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0,
            'distribution': {label: sentiment_labels.count(label) for label in set(sentiment_labels)}
        }
        
        toxicity_summary = {
            'average_score': sum(toxicity_scores) / len(toxicity_scores) if toxicity_scores else 0,
            'distribution': {label: toxicity_labels.count(label) for label in set(toxicity_labels)}
        }
        
        return {
            'total_comments': len(detailed_results),
            'sentiment_summary': sentiment_summary,
            'toxicity_summary': toxicity_summary,
            'detailed_results': detailed_results,
            'analysis_type': 'comprehensive',
            'model_used': self.ai_service.model_name if self.ai_service.is_available else 'fallback'
        }
    
    def _fallback_analyze_comments(self, comments: List[str], analysis_type: str, include_toxicity: bool) -> Dict:
        """Fallback analysis when AI service is unavailable"""
        batch_results = self.analyze_comment_batch(comments)
        
        sentiment_scores = [r['sentiment']['sentiment_score'] for r in batch_results]
        sentiment_labels = [r['sentiment']['sentiment_label'] for r in batch_results]
        
        toxicity_summary = {}
        if include_toxicity:
            toxicity_scores = [r['toxicity']['toxicity_score'] for r in batch_results]
            toxicity_labels = [r['toxicity']['toxicity_label'] for r in batch_results]
            
            toxicity_summary = {
                'average_score': sum(toxicity_scores) / len(toxicity_scores) if toxicity_scores else 0,
                'distribution': {label: toxicity_labels.count(label) for label in set(toxicity_labels)}
            }
        
        sentiment_summary = {
            'average_score': sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0,
            'distribution': {label: sentiment_labels.count(label) for label in set(sentiment_labels)}
        }
        
        return {
            'total_comments': len(comments),
            'sentiment_summary': sentiment_summary,
            'toxicity_summary': toxicity_summary,
            'detailed_results': batch_results,
            'analysis_type': analysis_type,
            'model_used': 'fallback'
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
