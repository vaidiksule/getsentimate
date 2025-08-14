import os
import json
import google.generativeai as genai
from typing import List, Dict
from django.conf import settings


class AIService:
    """Service for AI-powered comment analysis using Google's Gemini Pro API."""

    def __init__(self):
        """
        Initialize AI service.
        - Loads Gemini API key from environment variables.
        - Configures the Gemini API client if the key is available.
        - Raises an error if no API key is found.
        """
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')

        # Setup Gemini model if API key exists
        if self.gemini_api_key:
            os.environ["GOOGLE_API_KEY"] = self.gemini_api_key
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.gemini_model = None
            raise ValueError("Gemini API key not found in environment variables")

    def _call_gemini(self, prompt: str, system_prompt: str = None) -> str:
        """
        Send a prompt to the Gemini API and return its text output.
        
        Args:
            prompt: The main text prompt for the AI.
            system_prompt: Optional system-level instructions for guiding AI behavior.

        Returns:
            The AI's response as a plain text string.
        """
        try:
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"

            response = self.gemini_model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    def _call_ai_api(self, prompt: str, system_prompt: str = None, max_tokens: int = 150) -> str:
        """
        Generic method to call the AI API (currently Gemini).
        
        Args:
            prompt: The main prompt.
            system_prompt: Additional guiding context for the AI.
            max_tokens: (Unused here) max tokens for response.

        Returns:
            AI-generated string response.
        """
        errors = []

        # Try Gemini
        if self.gemini_model:
            try:
                return self._call_gemini(prompt, system_prompt)
            except Exception as e:
                errors.append(f"Gemini failed: {str(e)}")

        # If all models fail, raise an error
        raise Exception(f"Gemini service failed: {'; '.join(errors)}")

    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment for a given text comment.

        Returns:
            JSON-like dict with:
            - sentiment_score: float (-1 = very negative, 1 = very positive)
            - sentiment_label: 'positive', 'negative', 'neutral'
            - confidence: float (0-1)
        """
        prompt = f"""
        Analyze the sentiment of the following text. Return a JSON response with:
        - sentiment_score: float between -1 (very negative) and 1 (very positive)
        - sentiment_label: one of "positive", "negative", "neutral"
        - confidence: float between 0 and 1

        Text: "{text}"

        Response format:
        {{
            "sentiment_score": 0.8,
            "sentiment_label": "positive",
            "confidence": 0.95
        }}
        """

        system_prompt = "You are a sentiment analysis expert. Return only valid JSON."

        try:
            result = self._call_ai_api(prompt, system_prompt, 150)
            return json.loads(result)
        except Exception as e:
            # Fallback to neutral if analysis fails
            return {
                "sentiment_score": 0.0,
                "sentiment_label": "neutral",
                "confidence": 0.0,
                "error": str(e)
            }

    def detect_toxicity(self, text: str) -> Dict:
        """
        Detect whether a comment contains toxic content.
        
        Returns:
            Dict with toxicity_score, toxicity_label, and confidence.
        """
        prompt = f"""
        Analyze the toxicity of the following text. Return a JSON response with:
        - toxicity_score: float between 0 (not toxic) and 1 (very toxic)
        - toxicity_label: one of "toxic", "non-toxic"
        - confidence: float between 0 and 1

        Consider:
        - Hate speech
        - Harassment
        - Threats
        - Inappropriate language
        - Spam

        Text: "{text}"

        Response format:
        {{
            "toxicity_score": 0.1,
            "toxicity_label": "non-toxic",
            "confidence": 0.9
        }}
        """

        system_prompt = "You are a toxicity detection expert. Return only valid JSON."

        try:
            result = self._call_ai_api(prompt, system_prompt, 150)
            return json.loads(result)
        except Exception as e:
            return {
                "toxicity_score": 0.0,
                "toxicity_label": "non-toxic",
                "confidence": 0.0,
                "error": str(e)
            }

    def summarize_comments(self, comments: List[str], max_length: int = 500) -> Dict:
        """
        Generate a concise summary and insights from multiple comments.
        
        Returns:
            Dict with summary, key insights, suggestions, and pain points.
        """
        if not comments:
            return {"summary": "", "key_insights": []}

        combined_text = "\n".join([f"- {comment}" for comment in comments[:50]])  # Limit for efficiency

        prompt = f"""
        Analyze the following comments and provide:
        1. Summary (max {max_length} characters)
        2. Key insights/themes
        3. Common suggestions
        4. Pain points

        Comments:
        {combined_text}

        Return JSON:
        {{
            "summary": "Brief summary",
            "key_insights": ["insight1"],
            "suggestions": ["suggestion1"],
            "pain_points": ["pain_point1"]
        }}
        """

        system_prompt = "You are a comment analysis expert. Return only valid JSON."

        try:
            result = self._call_ai_api(prompt, system_prompt, 500)
            return json.loads(result)
        except Exception as e:
            return {
                "summary": "Unable to generate summary",
                "key_insights": [],
                "suggestions": [],
                "pain_points": [],
                "error": str(e)
            }

    def extract_key_topics(self, comments: List[str], max_topics: int = 10) -> List[str]:
        """
        Extract main discussion topics from comments.
        
        Returns:
            List of topic strings.
        """
        if not comments:
            return []

        combined_text = "\n".join(comments[:50])

        prompt = f"""
        Extract the top {max_topics} topics from these comments.
        Return a JSON array of strings.

        Comments:
        {combined_text}

        Response:
        ["topic1", "topic2"]
        """

        system_prompt = "You are a topic extraction expert. Return only a valid JSON array."

        try:
            result = self._call_ai_api(prompt, system_prompt, 200)
            return json.loads(result)
        except Exception:
            return []

    def analyze_transcript_context(self, transcript: str, comments: List[str]) -> Dict:
        """
        Analyze how a video's transcript relates to audience comments.
        
        Returns:
            Dict with content summary, alignment, engagement insights, content gaps, and recommendations.
        """
        if not transcript:
            return {
                "error": "No transcript provided",
                "context_insights": [],
                "content_alignment": {},
                "audience_engagement": {}
            }

        context_text = f"""
        VIDEO TRANSCRIPT:
        {transcript[:2000]}...

        AUDIENCE COMMENTS:
        {chr(10).join([f"- {comment[:200]}..." for comment in comments[:20]])}
        """

        prompt = f"""
        Analyze the transcript in context of comments.

        Return JSON:
        {{
            "content_summary": "Brief summary",
            "key_topics_discussed": ["topic1"],
            "audience_alignment": "high/medium/low",
            "engagement_insights": ["insight1"],
            "content_gaps": ["gap1"],
            "recommendations": ["rec1"]
        }}
        """

        system_prompt = "You are a content analysis expert. Return only valid JSON."

        try:
            result = self._call_ai_api(prompt, system_prompt, 800)
            return json.loads(result)
        except Exception as e:
            return {
                "error": f"Failed to analyze transcript context: {str(e)}",
                "content_summary": "Analysis failed",
                "key_topics_discussed": [],
                "audience_alignment": "unknown",
                "engagement_insights": [],
                "content_gaps": [],
                "recommendations": []
            }

    def analyze_comment_batch(self, comments: List[str]) -> List[Dict]:
        """
        Perform sentiment + toxicity analysis for multiple comments in batch.
        
        Returns:
            List of dict results for each comment.
        """
        results = []
        for comment in comments:
            sentiment = self.analyze_sentiment(comment)
            toxicity = self.detect_toxicity(comment)

            results.append({
                'text': comment,
                'sentiment_score': sentiment.get('sentiment_score', 0.0),
                'sentiment_label': sentiment.get('sentiment_label', 'neutral'),
                'toxicity_score': toxicity.get('toxicity_score', 0.0),
                'toxicity_label': toxicity.get('toxicity_label', 'non-toxic'),
                'confidence': min(
                    sentiment.get('confidence', 0.0),
                    toxicity.get('confidence', 0.0)
                )
            })
        return results

    def get_service_status(self) -> Dict:
        """
        Check AI service availability.
        
        Returns:
            Dict showing if Gemini is available and the primary service in use.
        """
        return {
            "gemini_available": self.gemini_model is not None,
            "primary_service": "gemini" if self.gemini_model else "none"
        }
