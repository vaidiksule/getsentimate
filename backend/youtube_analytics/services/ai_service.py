import os
import json
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import google.generativeai as genai
from django.conf import settings
from django.utils import timezone


class AIService:
    """Service for AI-powered analysis using Google Gemini"""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = 'gemini-1.5-pro'
        self.fallback_model = 'gemini-1.5-flash'
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize Gemini API service"""
        try:
            if self.api_key:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                self.fallback_model_instance = genai.GenerativeModel(self.fallback_model)
                self.is_available = True
            else:
                self.is_available = False
                print("Warning: GEMINI_API_KEY not found")
        except Exception as e:
            self.is_available = False
            print(f"Failed to initialize AI service: {e}")
    
    def get_service_status(self) -> Dict:
        """Get current AI service status"""
        return {
            'is_available': self.is_available,
            'model_name': self.model_name,
            'fallback_model': self.fallback_model,
            'api_key_configured': bool(self.api_key)
        }
    
    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of a single comment"""
        if not self.is_available:
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
            
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'sentiment_score': result.get('sentiment_score', 0.0),
                'sentiment_label': result.get('sentiment_label', 'neutral'),
                'confidence': result.get('confidence', 0.0),
                'reasoning': result.get('reasoning', ''),
                'model_used': self.model_name
            }
        except Exception as e:
            print(f"AI sentiment analysis failed: {e}")
            return self._fallback_sentiment_analysis(text)
    
    def detect_toxicity(self, text: str) -> Dict:
        """Detect toxicity in a single comment"""
        if not self.is_available:
            return self._fallback_toxicity_detection(text)
        
        try:
            prompt = f"""
            Analyze the toxicity level of this YouTube comment and return a JSON response with:
            - toxicity_score: float between 0.0 (not toxic) and 1.0 (highly toxic)
            - toxicity_label: one of "not_toxic", "slightly_toxic", "moderately_toxic", "highly_toxic"
            - categories: list of toxicity categories (e.g., ["hate_speech", "harassment", "profanity"])
            - confidence: float between 0.0 and 1.0
            
            Comment: "{text}"
            
            Return only valid JSON, no other text.
            """
            
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'toxicity_score': result.get('toxicity_score', 0.0),
                'toxicity_label': result.get('toxicity_label', 'not_toxic'),
                'categories': result.get('categories', []),
                'confidence': result.get('confidence', 0.0),
                'model_used': self.model_name
            }
        except Exception as e:
            print(f"AI toxicity detection failed: {e}")
            return self._fallback_toxicity_detection(text)
    
    def analyze_comment_batch(self, comments: List[str]) -> List[Dict]:
        """Analyze a batch of comments for sentiment and toxicity"""
        results = []
        
        for comment in comments:
            sentiment = self.analyze_sentiment(comment)
            toxicity = self.detect_toxicity(comment)
            
            results.append({
                'text': comment,
                'sentiment': sentiment,
                'toxicity': toxicity,
                'analysis_timestamp': timezone.now().isoformat()
            })
        
        return results
    
    def analyze_comment_realtime(self, comment_text: str, comment_id: str = None) -> Dict:
        """Real-time analysis of a single comment with progress tracking"""
        if not self.is_available:
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
            
            response = self.model.generate_content(prompt)
            
            # Parse response with error handling
            try:
                result = json.loads(response.text)
            except json.JSONDecodeError:
                import re
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
                'model_used': self.model_name,
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
    
    def analyze_single_comment_comprehensive(self, comment_text: str) -> Dict:
        """Comprehensive analysis of a single comment with enhanced insights"""
        if not self.is_available:
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
            
            response = self.model.generate_content(prompt)
            
            # Parse response with error handling
            try:
                result = json.loads(response.text)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    raise ValueError("Could not extract JSON from AI response")
            
            # Validate and normalize results
            validated_result = self._validate_comprehensive_analysis(result)
            
            return {
                **validated_result,
                'model_used': self.model_name,
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
    
    def generate_audience_insights(self, comments_data: List[Dict]) -> Dict:
        """Generate comprehensive audience insights from analyzed comments"""
        if not self.is_available:
            return self._fallback_audience_insights(comments_data)
        
        try:
            # Prepare data for analysis
            analysis_summary = {
                'total_comments': len(comments_data),
                'sentiment_distribution': {},
                'toxicity_distribution': {},
                'sample_comments': [c['text'][:100] for c in comments_data[:10]]  # First 10 comments, truncated
            }
            
            # Count sentiment and toxicity distributions
            for comment in comments_data:
                sentiment_label = comment['sentiment']['sentiment_label']
                toxicity_label = comment['toxicity']['toxicity_label']
                
                analysis_summary['sentiment_distribution'][sentiment_label] = \
                    analysis_summary['sentiment_distribution'].get(sentiment_label, 0) + 1
                analysis_summary['toxicity_distribution'][toxicity_label] = \
                    analysis_summary['toxicity_distribution'].get(toxicity_label, 0) + 1
            
            prompt = f"""
            Based on this YouTube video comment analysis, provide audience insights in JSON format:
            
            Analysis Summary: {json.dumps(analysis_summary, indent=2)}
            
            Return a JSON response with:
            - audience_insights: detailed analysis of audience behavior and preferences
            - content_recommendations: suggestions for improving content based on audience feedback
            - engagement_trends: patterns in audience engagement and interaction
            - key_findings: 3-5 main insights about the audience
            
            Return only valid JSON, no other text.
            """
            
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'audience_insights': result.get('audience_insights', ''),
                'content_recommendations': result.get('content_recommendations', ''),
                'engagement_trends': result.get('engagement_trends', ''),
                'key_findings': result.get('key_findings', []),
                'model_used': self.model_name,
                'analysis_timestamp': timezone.now().isoformat()
            }
        except Exception as e:
            print(f"AI audience insights generation failed: {e}")
            return self._fallback_audience_insights(comments_data)
    
    def calculate_engagement_metrics(self, comments_data: List[Dict]) -> Dict:
        """Calculate engagement metrics from analyzed comments"""
        if not comments_data:
            return {
                'total_comments': 0,
                'positive_sentiment_ratio': 0.0,
                'negative_sentiment_ratio': 0.0,
                'neutral_sentiment_ratio': 0.0,
                'average_toxicity_score': 0.0,
                'engagement_score': 0.0
            }
        
        total_comments = len(comments_data)
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        total_toxicity = 0.0
        
        for comment in comments_data:
            sentiment_label = comment['sentiment']['sentiment_label']
            toxicity_score = comment['toxicity']['toxicity_score']
            
            if 'positive' in sentiment_label:
                positive_count += 1
            elif 'negative' in sentiment_label:
                negative_count += 1
            else:
                neutral_count += 1
            
            total_toxicity += toxicity_score
        
        # Calculate ratios
        positive_ratio = positive_count / total_comments
        negative_ratio = negative_count / total_comments
        neutral_ratio = neutral_count / total_comments
        average_toxicity = total_toxicity / total_comments
        
        # Calculate engagement score (0-100)
        # Higher score for more positive sentiment and lower toxicity
        engagement_score = (
            (positive_ratio * 40) +  # Positive comments contribute positively
            (neutral_ratio * 20) +   # Neutral comments contribute moderately
            ((1 - average_toxicity) * 40)  # Lower toxicity contributes positively
        )
        
        return {
            'total_comments': total_comments,
            'positive_sentiment_ratio': round(positive_ratio, 3),
            'negative_sentiment_ratio': round(negative_ratio, 3),
            'neutral_sentiment_ratio': round(neutral_ratio, 3),
            'average_toxicity_score': round(average_toxicity, 3),
            'engagement_score': round(engagement_score, 1)
        }
    
    # Fallback methods for when AI service is unavailable
    def _fallback_sentiment_analysis(self, text: str) -> Dict:
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
    
    def _fallback_toxicity_detection(self, text: str) -> Dict:
        """Simple fallback toxicity detection"""
        text_lower = text.lower()
        toxic_words = ['hate', 'kill', 'stupid', 'idiot', 'moron', 'fuck', 'shit']
        
        toxic_count = sum(1 for word in toxic_words if word in text_lower)
        toxicity_score = min(toxic_count * 0.3, 1.0)
        
        if toxicity_score > 0.7:
            toxicity_label = 'highly_toxic'
        elif toxicity_score > 0.4:
            toxicity_label = 'moderately_toxic'
        elif toxicity_score > 0.1:
            toxicity_label = 'slightly_toxic'
        else:
            toxicity_label = 'not_toxic'
        
        return {
            'toxicity_score': round(toxicity_score, 3),
            'toxicity_label': toxicity_label,
            'categories': ['profanity'] if toxic_count > 0 else [],
            'confidence': 0.5,
            'model_used': 'fallback'
        }
    
    def _fallback_audience_insights(self, comments_data: List[Dict]) -> Dict:
        """Simple fallback audience insights"""
        return {
            'audience_insights': 'Fallback analysis: Basic insights based on comment patterns',
            'content_recommendations': 'Consider analyzing more comments for detailed recommendations',
            'engagement_trends': 'Engagement patterns available in detailed metrics',
            'key_findings': ['Analysis based on fallback methods', 'Limited insights available'],
            'model_used': 'fallback',
            'analysis_timestamp': timezone.now().isoformat()
        }
    
    def _fallback_comprehensive_analysis(self, text: str) -> Dict:
        """Fallback comprehensive analysis when AI service is unavailable"""
        # Use existing fallback methods
        sentiment = self._fallback_sentiment_analysis(text)
        toxicity = self._fallback_toxicity_detection(text)
        
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

    def aggregate_video_insights(self, comments_data: List[Dict]) -> Dict:
        """
        Aggregate individual comment analysis into comprehensive video-level insights
        
        Args:
            comments_data: List of comment analysis results
            
        Returns:
            Dictionary with aggregated insights, metrics, and recommendations
        """
        if not comments_data:
            return self._fallback_audience_insights(comments_data)
        
        try:
            # Calculate basic metrics
            total_comments = len(comments_data)
            analyzed_comments = len([c for c in comments_data if c.get('is_analyzed', False)])
            
            # Sentiment analysis aggregation
            sentiment_scores = [c.get('sentiment_score', 0) for c in comments_data if c.get('sentiment_score') is not None]
            sentiment_labels = [c.get('sentiment_label', 'neutral') for c in comments_data if c.get('sentiment_label')]
            
            # Toxicity analysis aggregation
            toxicity_scores = [c.get('toxicity_score', 0) for c in comments_data if c.get('toxicity_score') is not None]
            toxicity_labels = [c.get('toxicity_label', 'not_toxic') for c in comments_data if c.get('toxicity_label')]
            
            # Calculate ratios and averages
            positive_sentiment_ratio = len([s for s in sentiment_labels if s in ['positive', 'very_positive']]) / len(sentiment_labels) if sentiment_labels else 0
            negative_sentiment_ratio = len([s for s in sentiment_labels if s in ['negative', 'very_negative']]) / len(sentiment_labels) if sentiment_labels else 0
            neutral_sentiment_ratio = len([s for s in sentiment_labels if s == 'neutral']) / len(sentiment_labels) if sentiment_labels else 0
            
            average_sentiment_score = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
            average_toxicity_score = sum(toxicity_scores) / len(toxicity_scores) if toxicity_scores else 0
            
            # Generate insights using AI if available
            if self.is_available:
                insights = self._generate_ai_insights(comments_data)
            else:
                insights = self._generate_fallback_insights(comments_data)
            
            # Calculate engagement metrics
            engagement_score = self._calculate_engagement_score(comments_data)
            
            # Generate content recommendations
            content_recommendations = self._generate_content_recommendations(comments_data, insights)
            
            # Generate audience insights
            audience_insights = self._generate_audience_insights(comments_data, insights)
            
            return {
                'total_comments': total_comments,
                'analyzed_comments': analyzed_comments,
                'analysis_coverage': analyzed_comments / total_comments if total_comments > 0 else 0,
                
                # Sentiment metrics
                'sentiment_metrics': {
                    'positive_ratio': round(positive_sentiment_ratio, 3),
                    'negative_ratio': round(negative_sentiment_ratio, 3),
                    'neutral_ratio': round(neutral_sentiment_ratio, 3),
                    'average_score': round(average_sentiment_score, 3),
                    'distribution': {
                        'very_positive': len([s for s in sentiment_labels if s == 'very_positive']),
                        'positive': len([s for s in sentiment_labels if s == 'positive']),
                        'neutral': len([s for s in sentiment_labels if s == 'neutral']),
                        'negative': len([s for s in sentiment_labels if s == 'negative']),
                        'very_negative': len([s for s in sentiment_labels if s == 'very_negative'])
                    }
                },
                
                # Toxicity metrics
                'toxicity_metrics': {
                    'average_score': round(average_toxicity_score, 3),
                    'distribution': {
                        'not_toxic': len([t for t in toxicity_labels if t == 'not_toxic']),
                        'slightly_toxic': len([t for t in toxicity_labels if t == 'slightly_toxic']),
                        'moderately_toxic': len([t for t in toxicity_labels if t == 'moderately_toxic']),
                        'highly_toxic': len([t for t in toxicity_labels if t == 'highly_toxic'])
                    }
                },
                
                # Engagement metrics
                'engagement_metrics': {
                    'overall_score': round(engagement_score, 3),
                    'high_engagement_comments': len([c for c in comments_data if c.get('sentiment_score', 0) > 0.5]),
                    'low_engagement_comments': len([c for c in comments_data if c.get('sentiment_score', 0) < -0.5])
                },
                
                # AI-generated insights
                'audience_insights': audience_insights,
                'content_recommendations': content_recommendations,
                'key_findings': insights.get('key_findings', []),
                'trends': insights.get('trends', []),
                
                # Metadata
                'analysis_timestamp': datetime.now().isoformat(),
                'model_used': self.model_name if self.is_available else 'fallback'
            }
            
        except Exception as e:
            print(f"Error aggregating video insights: {e}")
            return self._fallback_audience_insights(comments_data)
    
    def analyze_url_comments(self, comments_data: List[Dict], video_title: str = "", video_description: str = "") -> Dict:
        """
        Analyze raw comments from URL analysis and generate comprehensive insights
        
        Args:
            comments_data: List of raw comment data from URL analysis
            video_title: Title of the video being analyzed
            video_description: Description of the video being analyzed
            
        Returns:
            Dictionary with comprehensive insights, engagement analysis, and recommendations
        """
        if not comments_data:
            return self._fallback_url_analysis_insights(comments_data)
        
        try:
            # Prepare comments for analysis
            comment_texts = [comment.get('text', '') for comment in comments_data if comment.get('text')]
            
            if not comment_texts:
                return self._fallback_url_analysis_insights(comments_data)
            
            # Generate comprehensive AI insights
            if self.is_available:
                insights = self._generate_url_analysis_insights(comment_texts, video_title, video_description)
            else:
                insights = self._generate_fallback_url_insights(comment_texts)
            
            # Calculate engagement metrics
            engagement_metrics = self._calculate_url_engagement_metrics(comments_data)
            
            # Generate sentiment analysis
            sentiment_analysis = self._analyze_url_sentiment(comment_texts)
            
            # Generate content recommendations
            content_recommendations = self._generate_url_content_recommendations(comment_texts, video_title, insights)
            
            # Generate audience insights
            audience_insights = self._generate_url_audience_insights(comment_texts, insights)
            
            return {
                'total_comments': len(comments_data),
                'analyzed_comments': len(comment_texts),
                'analysis_coverage': len(comment_texts) / len(comments_data) if comments_data else 0,
                
                # Sentiment analysis
                'sentiment_analysis': sentiment_analysis,
                
                # Engagement metrics
                'engagement_metrics': engagement_metrics,
                
                # AI-generated insights
                'audience_insights': audience_insights,
                'content_recommendations': content_recommendations,
                'key_findings': insights.get('key_findings', []),
                'user_suggestions': insights.get('user_suggestions', []),
                'what_users_like': insights.get('what_users_like', []),
                'what_users_dislike': insights.get('what_users_dislike', []),
                'video_requests': insights.get('video_requests', []),
                'engagement_level': insights.get('engagement_level', 'medium'),
                
                # Metadata
                'analysis_timestamp': datetime.now().isoformat(),
                'model_used': self.model_name if self.is_available else 'fallback'
            }
            
        except Exception as e:
            print(f"Error analyzing URL comments: {e}")
            return self._fallback_url_analysis_insights(comments_data)
    
    def _generate_ai_insights(self, comments_data: List[Dict]) -> Dict:
        """Generate insights using AI analysis"""
        try:
            # Prepare comment text for AI analysis
            comment_texts = [c.get('text', '')[:200] for c in comments_data if c.get('text')]
            combined_text = " ".join(comment_texts[:50])  # Limit to first 50 comments to avoid token limits
            
            prompt = f"""
            Analyze these YouTube video comments and provide audience insights. Return a JSON response with:
            
            {{
                "key_findings": [
                    "3-5 key insights about what the audience thinks",
                    "What they liked most",
                    "What they disliked or complained about",
                    "Common themes or patterns"
                ],
                "trends": [
                    "2-3 trends in audience sentiment",
                    "What's working well",
                    "What could be improved"
                ],
                "audience_mood": "overall mood description",
                "content_strengths": ["list of what's working"],
                "improvement_areas": ["list of what could be better"]
            }}
            
            Comments: {combined_text}
            
            Return only valid JSON, no other text.
            """
            
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'key_findings': result.get('key_findings', []),
                'trends': result.get('trends', []),
                'audience_mood': result.get('audience_mood', 'mixed'),
                'content_strengths': result.get('content_strengths', []),
                'improvement_areas': result.get('improvement_areas', [])
            }
            
        except Exception as e:
            print(f"AI insight generation failed: {e}")
            return self._generate_fallback_insights(comments_data)
    
    def _generate_fallback_insights(self, comments_data: List[Dict]) -> Dict:
        """Generate insights using fallback methods when AI is unavailable"""
        # Analyze sentiment patterns
        positive_comments = [c for c in comments_data if c.get('sentiment_score', 0) > 0.3]
        negative_comments = [c for c in comments_data if c.get('sentiment_score', 0) < -0.3]
        neutral_comments = [c for c in comments_data if -0.3 <= c.get('sentiment_score', 0) <= 0.3]
        
        # Generate basic insights
        insights = []
        if positive_comments:
            insights.append(f"{len(positive_comments)} users expressed positive sentiment")
        if negative_comments:
            insights.append(f"{len(negative_comments)} users expressed negative sentiment")
        if neutral_comments:
            insights.append(f"{len(neutral_comments)} users had neutral reactions")
        
        # Add toxicity insights
        toxic_comments = [c for c in comments_data if c.get('toxicity_score', 0) > 0.5]
        if toxic_comments:
            insights.append(f"{len(toxic_comments)} comments showed concerning toxicity levels")
        
        return {
            'key_findings': insights,
            'trends': ['Analysis based on fallback methods'],
            'audience_mood': 'mixed' if len(positive_comments) == len(negative_comments) else 'positive' if len(positive_comments) > len(negative_comments) else 'negative',
            'content_strengths': ['Positive engagement detected'] if positive_comments else [],
            'improvement_areas': ['Address negative feedback'] if negative_comments else []
        }
    
    def _calculate_engagement_score(self, comments_data: List[Dict]) -> float:
        """Calculate overall engagement score from comments"""
        if not comments_data:
            return 0.0
        
        # Consider sentiment, toxicity, and comment characteristics
        scores = []
        for comment in comments_data:
            score = 0.0
            
            # Sentiment contribution
            sentiment_score = comment.get('sentiment_score', 0)
            score += (sentiment_score + 1) * 0.4  # Convert -1 to 1 range to 0 to 2, then scale
            
            # Toxicity penalty
            toxicity_score = comment.get('toxicity_score', 0)
            score -= toxicity_score * 0.3
            
            # Engagement boost for extreme sentiments (both positive and negative)
            if abs(sentiment_score) > 0.7:
                score += 0.2
            
            scores.append(max(0, min(1, score)))  # Clamp between 0 and 1
        
        return sum(scores) / len(scores) if scores else 0.0
    
    def _generate_content_recommendations(self, comments_data: List[Dict], insights: Dict) -> List[str]:
        """Generate content recommendations based on analysis"""
        recommendations = []
        
        # Sentiment-based recommendations
        positive_ratio = len([c for c in comments_data if c.get('sentiment_score', 0) > 0.3]) / len(comments_data) if comments_data else 0
        
        if positive_ratio > 0.7:
            recommendations.append("Continue with current content style - audience is highly engaged")
        elif positive_ratio < 0.3:
            recommendations.append("Consider content strategy adjustments based on negative feedback")
        
        # Toxicity-based recommendations
        toxic_ratio = len([c for c in comments_data if c.get('toxicity_score', 0) > 0.5]) / len(comments_data) if comments_data else 0
        
        if toxic_ratio > 0.2:
            recommendations.append("Monitor comment section for community guidelines violations")
        
        # Add AI-generated recommendations if available
        if insights.get('improvement_areas'):
            recommendations.extend(insights['improvement_areas'])
        
        return recommendations[:5]  # Limit to top 5 recommendations
    
    def _generate_audience_insights(self, comments_data: List[Dict], insights: Dict) -> str:
        """Generate a summary of audience insights"""
        total_comments = len(comments_data)
        if total_comments == 0:
            return "No comments available for analysis"
        
        positive_count = len([c for c in comments_data if c.get('sentiment_score', 0) > 0.3])
        negative_count = len([c for c in comments_data if c.get('sentiment_score', 0) < -0.3])
        
        if positive_count > negative_count * 2:
            mood = "overwhelmingly positive"
        elif positive_count > negative_count:
            mood = "generally positive"
        elif negative_count > positive_count * 2:
            mood = "generally negative"
        elif negative_count > positive_count:
            mood = "generally negative"
        else:
            mood = "mixed"
        
        # Use AI insights if available, otherwise generate basic summary
        if insights.get('key_findings'):
            key_points = insights['key_findings'][:3]  # Top 3 insights
            return f"Audience reaction is {mood}. Key findings: {'; '.join(key_points)}"
        else:
            return f"Audience reaction is {mood}. {positive_count} positive, {negative_count} negative, {total_comments - positive_count - negative_count} neutral comments."


    def _generate_url_analysis_insights(self, comment_texts: List[str], video_title: str, video_description: str) -> Dict:
        """Generate comprehensive insights for URL analysis using AI"""
        try:
            comments_text = "\n".join([f"Comment {i+1}: {text}" for i, text in enumerate(comment_texts[:50])])  # Limit to 50 comments
            
            prompt = f"""
            Analyze these YouTube video comments and provide comprehensive insights. The video is titled "{video_title}".

            Comments to analyze:
            {comments_text}

            Please provide a detailed analysis in JSON format with the following structure:
            {{
                "engagement_level": "low/medium/high",
                "key_findings": [
                    "Key insight 1",
                    "Key insight 2",
                    "Key insight 3"
                ],
                "user_suggestions": [
                    "Suggestion 1",
                    "Suggestion 2",
                    "Suggestion 3"
                ],
                "what_users_like": [
                    "What users appreciate 1",
                    "What users appreciate 2",
                    "What users appreciate 3"
                ],
                "what_users_dislike": [
                    "What users don't like 1",
                    "What users don't like 2",
                    "What users don't like 3"
                ],
                "video_requests": [
                    "Video topic request 1",
                    "Video topic request 2",
                    "Video topic request 3"
                ],
                "audience_insights": "Detailed analysis of the audience's interests, concerns, and engagement patterns",
                "content_recommendations": "Specific recommendations for improving future content based on comment analysis",
                "overall_sentiment": "positive/negative/neutral",
                "main_themes": [
                    "Theme 1",
                    "Theme 2",
                    "Theme 3"
                ]
            }}

            Focus on:
            1. What users are saying about the video content
            2. Their suggestions for improvement
            3. What they like and dislike
            4. Requests for future videos
            5. Overall engagement level
            6. Audience interests and concerns
            7. Actionable recommendations for content creators

            Return only valid JSON.
            """
            
            response = self.model.generate_content(prompt)
            insights_text = response.text.strip()
            
            # Clean up the response
            if insights_text.startswith('```json'):
                insights_text = insights_text[7:]
            if insights_text.endswith('```'):
                insights_text = insights_text[:-3]
            
            insights = json.loads(insights_text)
            return insights
            
        except Exception as e:
            print(f"Error generating URL analysis insights: {e}")
            return self._generate_fallback_url_insights(comment_texts)
    
    def _analyze_url_sentiment(self, comment_texts: List[str]) -> Dict:
        """Analyze sentiment of comments for URL analysis"""
        try:
            if not self.is_available:
                return self._fallback_sentiment_analysis(" ".join(comment_texts))
            
            # Use bulk sentiment analysis instead of individual comments
            try:
                # Analyze all comments together for better accuracy
                combined_text = " ".join(comment_texts[:50])  # Limit to 50 comments
                sentiment_result = self.analyze_sentiment(combined_text)
                
                # Extract sentiment from the result
                sentiment_label = sentiment_result.get('sentiment_label', 'neutral')
                sentiment_score = sentiment_result.get('sentiment_score', 0)
                
                # Determine overall sentiment
                if sentiment_score > 0.2:
                    overall_sentiment = 'positive'
                    positive_ratio = 0.6
                    negative_ratio = 0.2
                    neutral_ratio = 0.2
                elif sentiment_score < -0.2:
                    overall_sentiment = 'negative'
                    positive_ratio = 0.2
                    negative_ratio = 0.6
                    neutral_ratio = 0.2
                else:
                    overall_sentiment = 'neutral'
                    positive_ratio = 0.3
                    negative_ratio = 0.3
                    neutral_ratio = 0.4
                
                return {
                    'overall_sentiment': overall_sentiment,
                    'positive_ratio': positive_ratio,
                    'negative_ratio': negative_ratio,
                    'neutral_ratio': neutral_ratio,
                    'total_analyzed': len(comment_texts),
                    'sentiment_score': sentiment_score
                }
                
            except Exception as e:
                print(f"Bulk sentiment analysis failed: {e}")
                return self._fallback_sentiment_analysis(" ".join(comment_texts))
            
        except Exception as e:
            print(f"Error analyzing URL sentiment: {e}")
            return self._fallback_sentiment_analysis(" ".join(comment_texts))
    
    def _calculate_url_engagement_metrics(self, comments_data: List[Dict]) -> Dict:
        """Calculate engagement metrics for URL analysis"""
        try:
            total_comments = len(comments_data)
            if total_comments == 0:
                return {'overall_score': 0, 'engagement_level': 'low'}
            
            # Calculate engagement based on comment characteristics
            engagement_score = 0
            
            # Factor 1: Comment length (longer comments = more engagement)
            avg_length = sum(len(comment.get('text', '')) for comment in comments_data) / total_comments
            if avg_length > 100:
                engagement_score += 0.3
            elif avg_length > 50:
                engagement_score += 0.2
            else:
                engagement_score += 0.1
            
            # Factor 2: Like counts (if available)
            like_counts = [comment.get('like_count', 0) for comment in comments_data if isinstance(comment.get('like_count', 0), (int, float))]
            avg_likes = sum(like_counts) / total_comments if like_counts else 0
            if avg_likes > 10:
                engagement_score += 0.4
            elif avg_likes > 5:
                engagement_score += 0.3
            elif avg_likes > 0:
                engagement_score += 0.2
            
            # Factor 3: Comment diversity (more unique authors = more engagement)
            authors = set(comment.get('author_name', '') for comment in comments_data)
            author_diversity = len(authors) / total_comments
            engagement_score += author_diversity * 0.3
            
            # Determine engagement level
            if engagement_score > 0.7:
                engagement_level = 'high'
            elif engagement_score > 0.4:
                engagement_level = 'medium'
            else:
                engagement_level = 'low'
            
            return {
                'overall_score': round(engagement_score, 3),
                'engagement_level': engagement_level,
                'average_comment_length': round(avg_length, 1),
                'average_likes': round(avg_likes, 1),
                'unique_authors': len(authors),
                'author_diversity': round(author_diversity, 3)
            }
            
        except Exception as e:
            print(f"Error calculating URL engagement metrics: {e}")
            return {'overall_score': 0, 'engagement_level': 'low'}
    
    def _generate_url_content_recommendations(self, comment_texts: List[str], video_title: str, insights: Dict) -> str:
        """Generate content recommendations based on URL analysis"""
        try:
            if not self.is_available:
                return "Based on comment analysis, consider addressing user concerns and incorporating their suggestions."
            
            prompt = f"""
            Based on the analysis of comments for the video "{video_title}", provide specific content recommendations for the creator.

            Key insights from comments:
            - What users like: {insights.get('what_users_like', [])}
            - What users dislike: {insights.get('what_users_dislike', [])}
            - User suggestions: {insights.get('user_suggestions', [])}
            - Video requests: {insights.get('video_requests', [])}

            Provide 3-5 specific, actionable recommendations for improving future content. Focus on:
            1. Addressing user concerns
            2. Incorporating popular suggestions
            3. Creating requested content
            4. Improving engagement

            Keep recommendations concise and actionable.
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating URL content recommendations: {e}")
            return "Consider addressing user concerns and incorporating their suggestions for better engagement."
    
    def _generate_url_audience_insights(self, comment_texts: List[str], insights: Dict) -> str:
        """Generate audience insights based on URL analysis"""
        try:
            if not self.is_available:
                return "Audience shows interest in the content with various suggestions and feedback."
            
            prompt = f"""
            Based on the comment analysis, provide insights about the audience for this video.

            Key findings: {insights.get('key_findings', [])}
            Main themes: {insights.get('main_themes', [])}
            Overall sentiment: {insights.get('overall_sentiment', 'neutral')}

            Provide insights about:
            1. Audience interests and concerns
            2. Engagement patterns
            3. Demographics hints
            4. Content preferences
            5. Community dynamics

            Keep insights concise and actionable.
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating URL audience insights: {e}")
            return "Audience shows interest in the content with various suggestions and feedback."
    
    def _generate_fallback_url_insights(self, comment_texts: List[str]) -> Dict:
        """Generate fallback insights when AI is not available"""
        return {
            'engagement_level': 'medium',
            'key_findings': [
                'Comments show active engagement with the content',
                'Users are providing feedback and suggestions',
                'Mixed sentiment across comments'
            ],
            'user_suggestions': [
                'Consider user feedback for content improvement',
                'Address common concerns mentioned in comments'
            ],
            'what_users_like': [
                'Content quality and information',
                'Creators approach and style'
            ],
            'what_users_dislike': [
                'Some aspects need improvement',
                'Areas for better explanation'
            ],
            'video_requests': [
                'More content on similar topics',
                'Follow-up videos requested'
            ],
            'overall_sentiment': 'neutral',
            'main_themes': [
                'Content feedback',
                'Engagement and discussion',
                'Suggestions for improvement'
            ]
        }
    
    def _fallback_url_analysis_insights(self, comments_data: List[Dict]) -> Dict:
        """Fallback insights when analysis fails"""
        return {
            'total_comments': len(comments_data),
            'analyzed_comments': 0,
            'analysis_coverage': 0,
            'sentiment_analysis': {'overall_sentiment': 'neutral', 'positive_ratio': 0, 'negative_ratio': 0, 'neutral_ratio': 1},
            'engagement_metrics': {'overall_score': 0, 'engagement_level': 'low'},
            'audience_insights': 'Unable to analyze comments at this time.',
            'content_recommendations': 'Consider analyzing comments manually for insights.',
            'key_findings': [],
            'user_suggestions': [],
            'what_users_like': [],
            'what_users_dislike': [],
            'video_requests': [],
            'engagement_level': 'low',
            'analysis_timestamp': timezone.now().isoformat(),
            'model_used': 'fallback'
        }


# Global instance
ai_service = AIService()
