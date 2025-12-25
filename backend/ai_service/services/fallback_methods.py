"""
Fallback analysis methods when AI service is unavailable
"""

from typing import Dict, List
from django.utils import timezone


class FallbackAnalyzer:
    """Provides fallback analysis methods when AI service is unavailable"""
    
    def fallback_audience_insights(self, comments_data: List[Dict]) -> Dict:
        """Simple fallback audience insights"""
        return {
            'audience_insights': 'Fallback analysis: Basic insights based on comment patterns',
            'content_recommendations': 'Consider analyzing more comments for detailed recommendations',
            'engagement_trends': 'Engagement patterns available in detailed metrics',
            'key_findings': ['Analysis based on fallback methods', 'Limited insights available'],
            'model_used': 'fallback',
            'analysis_timestamp': timezone.now().isoformat()
        }
    
    def fallback_url_analysis_insights(self, comments_data: List[Dict]) -> Dict:
        """Fallback for URL analysis insights"""
        return {
            'total_comments': len(comments_data),
            'sentiment_summary': {'average_score': 0.0, 'distribution': {}},
            'toxicity_summary': {'average_score': 0.0, 'distribution': {}},
            'detailed_results': [],
            'analysis_type': 'fallback',
            'model_used': 'fallback'
        }
