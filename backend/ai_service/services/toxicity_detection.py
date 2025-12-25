"""
Toxicity detection functionality
"""

import json
from .core import AIService


class ToxicityDetector:
    """Handles toxicity detection using AI or fallback methods"""
    
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
    
    def detect_toxicity(self, text: str) -> dict:
        """Detect toxicity in a single comment"""
        if not self.ai_service.is_available:
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
            
            response = self.ai_service.model.generate_content(prompt)
            result = json.loads(response.text)
            
            return {
                'toxicity_score': result.get('toxicity_score', 0.0),
                'toxicity_label': result.get('toxicity_label', 'not_toxic'),
                'categories': result.get('categories', []),
                'confidence': result.get('confidence', 0.0),
                'model_used': self.ai_service.model_name
            }
        except Exception as e:
            print(f"AI toxicity detection failed: {e}")
            return self._fallback_toxicity_detection(text)
    
    def _fallback_toxicity_detection(self, text: str) -> dict:
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
