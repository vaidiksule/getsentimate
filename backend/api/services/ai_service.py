import os
import json
import google.generativeai as genai
from typing import List, Dict, Optional
from django.conf import settings


class AIService:
    """Service for AI-powered comment analysis with Gemini Pro support"""

    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')

        # Initialize Gemini if available
        if self.gemini_api_key:
            os.environ["GOOGLE_API_KEY"] = self.gemini_api_key
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.gemini_model = None

        if not self.gemini_api_key:
            raise ValueError("Gemini API key not found in environment variables")

    def _call_gemini(self, prompt: str, system_prompt: str = None) -> str:
        """Call Gemini API"""
        try:
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"

            response = self.gemini_model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    def _call_ai_api(self, prompt: str, system_prompt: str = None, max_tokens: int = 150) -> str:
        """Call AI API with Gemini"""
        errors = []

        # Call Gemini
        if self.gemini_model:
            try:
                return self._call_gemini(prompt, system_prompt)
            except Exception as e:
                errors.append(f"Gemini failed: {str(e)}")

        # If Gemini fails, raise error
        raise Exception(f"Gemini service failed: {'; '.join(errors)}")

    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyze sentiment of a comment

        Returns:
            Dict with sentiment_score and sentiment_label
        """
        prompt = f"""
        Analyze the sentiment of the following text. Return a JSON response with:
        - sentiment_score: float between -1 (very negative) and 1 (very positive)
        - sentiment_label: one of \"positive\", \"negative\", \"neutral\"
        - confidence: float between 0 and 1

        Text: "{text}"

        Response format:
        {{
            \"sentiment_score\": 0.8,
            \"sentiment_label\": \"positive\",
            \"confidence\": 0.95
        }}
        """

        system_prompt = "You are a sentiment analysis expert. Return only valid JSON."

        try:
            result = self._call_ai_api(prompt, system_prompt, 150)
            return json.loads(result)

        except Exception as e:
            # Fallback to neutral sentiment
            return {
                "sentiment_score": 0.0,
                "sentiment_label": "neutral",
                "confidence": 0.0,
                "error": str(e)
            }

    def detect_toxicity(self, text: str) -> Dict:
        """
        Detect toxicity in a comment

        Returns:
            Dict with toxicity_score and toxicity_label
        """
        prompt = f"""
        Analyze the toxicity of the following text. Return a JSON response with:
        - toxicity_score: float between 0 (not toxic) and 1 (very toxic)
        - toxicity_label: one of \"toxic\", \"non-toxic\"
        - confidence: float between 0 and 1

        Consider factors like:
        - Hate speech
        - Harassment
        - Threats
        - Inappropriate language
        - Spam

        Text: "{text}"

        Response format:
        {{
            \"toxicity_score\": 0.1,
            \"toxicity_label\": \"non-toxic\",
            \"confidence\": 0.9
        }}
        """

        system_prompt = "You are a toxicity detection expert. Return only valid JSON."

        try:
            result = self._call_ai_api(prompt, system_prompt, 150)
            return json.loads(result)

        except Exception as e:
            # Fallback to non-toxic
            return {
                "toxicity_score": 0.0,
                "toxicity_label": "non-toxic",
                "confidence": 0.0,
                "error": str(e)
            }

    def summarize_comments(self, comments: List[str], max_length: int = 500) -> Dict:
        """
        Generate a summary of multiple comments

        Returns:
            Dict with summary and key insights
        """
        if not comments:
            return {"summary": "", "key_insights": []}

        # Combine comments for analysis
        combined_text = "\n".join([f"- {comment}" for comment in comments[:50]])  # Limit to 50 comments

        prompt = f"""
        Analyze the following comments and provide:
        1. A concise summary (max {max_length} characters)
        2. Key insights and themes
        3. Common suggestions or feedback
        4. Pain points mentioned

        Comments:
        {combined_text}

        Return a JSON response:
        {{
            \"summary\": \"Brief summary of the comments\",
            \"key_insights\": [\"insight1\", \"insight2\"],
            \"suggestions\": [\"suggestion1\", \"suggestion2\"],
            \"pain_points\": [\"pain_point1\", \"pain_point2\"]
        }}
        """

        system_prompt = "You are a comment analysis expert. Return only valid JSON."

        try:
            result = self._call_ai_api(prompt, system_prompt, 500)
            return json.loads(result)

        except Exception as e:
            return {
                "summary": "Unable to generate summary due to error",
                "key_insights": [],
                "suggestions": [],
                "pain_points": [],
                "error": str(e)
            }

    def extract_key_topics(self, comments: List[str], max_topics: int = 10) -> List[str]:
        """
        Extract key topics from comments

        Returns:
            List of key topics
        """
        if not comments:
            return []

        combined_text = "\n".join(comments[:50])

        prompt = f"""
        Extract the top {max_topics} key topics or themes from these comments.
        Return a JSON array of topic strings.

        Comments:
        {combined_text}

        Response format:
        [\"topic1\", \"topic2\", \"topic3\"]
        """

        system_prompt = "You are a topic extraction expert. Return only valid JSON array."

        try:
            result = self._call_ai_api(prompt, system_prompt, 200)
            return json.loads(result)

        except Exception as e:
            return []

    def analyze_transcript_context(self, transcript: str, comments: List[str]) -> Dict:
        """
        Analyze video transcript in context of comments for deeper insights

        Args:
            transcript: Video transcript text
            comments: List of comment texts

        Returns:
            Dict with transcript analysis and context insights
        """
        if not transcript:
            return {
                "error": "No transcript provided",
                "context_insights": [],
                "content_alignment": {},
                "audience_engagement": {}
            }

        # Prepare combined context for analysis
        context_text = f"""
        VIDEO TRANSCRIPT:
        {transcript[:2000]}...

        AUDIENCE COMMENTS (Sample):
        {chr(10).join([f"- {comment[:200]}..." for comment in comments[:20]])}
        """

        prompt = f"""
        Analyze the video transcript in context of audience comments to provide insights.

        Return a JSON response with:
        - content_summary: Brief summary of video content
        - key_topics_discussed: Main topics covered in video
        - audience_alignment: How well comments align with video content
        - engagement_insights: What aspects generated most engagement
        - content_gaps: Topics viewers wanted but weren't covered
        - recommendations: Suggestions for future content

        Context:
        {context_text}

        Response format:
        {{
            \"content_summary\": \"Brief summary\",
            \"key_topics_discussed\": [\"topic1\", \"topic2\"],
            \"audience_alignment\": \"high/medium/low\",
            \"engagement_insights\": [\"insight1\", \"insight2\"],
            \"content_gaps\": [\"gap1\", \"gap2\"],
            \"recommendations\": [\"rec1\", \"rec2\"]
        }}
        """

        system_prompt = "You are a content analysis expert specializing in video-audience alignment. Return only valid JSON."

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
        Analyze a batch of comments for sentiment and toxicity

        Returns:
            List of analysis results for each comment
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
                'confidence': min(sentiment.get('confidence', 0.0), toxicity.get('confidence', 0.0))
            })

        return results

    def get_service_status(self) -> Dict:
        """
        Get the status of available AI services

        Returns:
            Dict with service availability
        """
        return {
            "gemini_available": self.gemini_model is not None,
            "primary_service": "gemini" if self.gemini_model else "none"
        }
