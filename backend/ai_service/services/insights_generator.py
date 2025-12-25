"""
Insights generation and comprehensive analysis functionality
"""

import json
from typing import Dict, List
from datetime import datetime
from django.utils import timezone
from .core import AIService


class InsightsGenerator:
    """Handles insights generation and comprehensive analysis"""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
    
    def generate_audience_insights(self, comments_data: List[Dict]) -> Dict:
        """Generate comprehensive audience insights from analyzed comments"""
        if not self.ai_service.is_available:
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
            
            response = self.ai_service.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'audience_insights': result.get('audience_insights', ''),
                'content_recommendations': result.get('content_recommendations', ''),
                'engagement_trends': result.get('engagement_trends', ''),
                'key_findings': result.get('key_findings', []),
                'model_used': self.ai_service.model_name,
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
            if self.ai_service.is_available:
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
                'model_used': self.ai_service.model_name if self.ai_service.is_available else 'fallback'
            }
            
        except Exception as e:
            print(f"Error aggregating video insights: {e}")
            return self._fallback_audience_insights(comments_data)
    
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
                    "Emerging trends in audience engagement",
                    "Popular topics or themes",
                    "Engagement patterns"
                ]
            }}
            
            Comments: {combined_text}
            
            Return only valid JSON, no other text.
            """
            
            response = self.ai_service.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return result
            
        except Exception as e:
            print(f"AI insights generation failed: {e}")
            return self._generate_fallback_insights(comments_data)
    
    def _generate_fallback_insights(self, comments_data: List[Dict]) -> Dict:
        """Generate fallback insights without AI"""
        return {
            'key_findings': [
                'Analysis based on comment patterns',
                'Limited insights due to AI service unavailability',
                'Consider manual review for detailed insights'
            ],
            'trends': [
                'Basic sentiment patterns detected',
                'Engagement metrics available'
            ]
        }
    
    def _calculate_engagement_score(self, comments_data: List[Dict]) -> float:
        """Calculate overall engagement score"""
        if not comments_data:
            return 0.0
        
        total_score = 0.0
        for comment in comments_data:
            # Simple scoring based on sentiment and toxicity
            sentiment_score = comment.get('sentiment_score', 0)
            toxicity_score = comment.get('toxicity_score', 0)
            
            # Higher score for positive sentiment, lower for toxicity
            comment_score = (sentiment_score + 1) / 2 * 0.7 + (1 - toxicity_score) * 0.3
            total_score += comment_score
        
        return total_score / len(comments_data)
    
    def _generate_content_recommendations(self, comments_data: List[Dict], insights: Dict) -> List[str]:
        """Generate content recommendations based on analysis"""
        recommendations = []
        
        # Add recommendations based on sentiment
        positive_ratio = len([c for c in comments_data if c.get('sentiment_score', 0) > 0]) / len(comments_data)
        if positive_ratio < 0.5:
            recommendations.append("Consider improving content quality based on negative feedback")
        
        # Add recommendations based on toxicity
        high_toxicity_count = len([c for c in comments_data if c.get('toxicity_score', 0) > 0.7])
        if high_toxicity_count > len(comments_data) * 0.1:
            recommendations.append("Monitor and moderate toxic comments to improve community engagement")
        
        return recommendations
    
    def _generate_audience_insights(self, comments_data: List[Dict], insights: Dict) -> str:
        """Generate audience insights summary"""
        total_comments = len(comments_data)
        positive_comments = len([c for c in comments_data if c.get('sentiment_score', 0) > 0])
        
        insight_summary = f"Audience analysis based on {total_comments} comments. "
        insight_summary += f"{positive_comments} comments were positive. "
        insight_summary += "Key findings: " + ", ".join(insights.get('key_findings', [])[:3])
        
        return insight_summary
