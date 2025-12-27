import logging
import json
import google.generativeai as genai
from django.conf import settings
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self):
        # Configure Gemini
        api_key = getattr(settings, "GOOGLE_API_KEY", None)
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not configured")
        genai.configure(api_key=api_key)
        self.model_name = "gemini-2.0-flash"
        self.model = genai.GenerativeModel(self.model_name)

        # Tracking for debug info
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.num_api_calls = 0

    def analyze(
        self, video_data: Dict[str, Any], comments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Main analysis flow:
        1. Batch comments
        2. Analyze batches (Map)
        3. Aggregate (Reduce)
        4. Final Insight (Summary)
        """
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.num_api_calls = 0

        BATCH_SIZE = 50
        batches = [
            comments[i : i + BATCH_SIZE] for i in range(0, len(comments), BATCH_SIZE)
        ]

        batch_results = []
        for i, batch in enumerate(batches):
            logger.info(f"Processing batch {i + 1}/{len(batches)}")
            try:
                res = self._analyze_batch(batch)
                batch_results.append(res)
            except Exception as e:
                logger.error(f"Batch {i} failed: {e}")

        # Aggregate
        aggregated = self._aggregate_results(batch_results)

        # Final Summary
        final_insight = self._generate_executive_summary(
            aggregated, video_data, comments[:10]
        )

        # Calculate Cost (Gemini 2.0 Flash: $0.10 / 1M input, $0.40 / 1M output)
        input_cost = (self.total_input_tokens / 1_000_000) * 0.10
        output_cost = (self.total_output_tokens / 1_000_000) * 0.40
        total_cost = input_cost + output_cost

        # Add Debug Info
        final_insight["debug_info"] = {
            "num_comments": len(comments),
            "total_tokens": self.total_input_tokens + self.total_output_tokens,
            "input_tokens": self.total_input_tokens,
            "output_tokens": self.total_output_tokens,
            "estimated_cost_usd": round(total_cost, 6),
            "model_used": self.model_name,
            "api_calls": self.num_api_calls,
        }

        return final_insight

    def _analyze_batch(self, comments: List[Dict[str, Any]]) -> Dict[str, Any]:
        comment_texts = [f"- {c['text']}" for c in comments]
        text_block = "\n".join(comment_texts)

        prompt = f"""
        Analyze these YouTube comments. Return JSON ONLY. No markdown.
        
        Comments:
        {text_block}
        
        Output format:
        {{
            "sentiment": {{ "positive": int, "neutral": int, "negative": int }},
            "topics": ["topic1", "topic2"],
            "intents": {{ "praise": int, "complaint": int, "question": int, "suggestion": int }},
            "notable_points": ["short phrase 1", "short phrase 2"],
            "toxic_count": int
        }}
        """

        try:
            self.num_api_calls += 1
            response = self.model.generate_content(prompt)

            # Track tokens
            if response.usage_metadata:
                self.total_input_tokens += response.usage_metadata.prompt_token_count
                self.total_output_tokens += (
                    response.usage_metadata.candidates_token_count
                )

            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except Exception as e:
            logger.error(f"LLM Batch Error: {e}")
            return {}  # Return empty to ignore this batch

    def _aggregate_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        agg = {
            "sentiment": {"positive": 0, "neutral": 0, "negative": 0},
            "topics": [],
            "intents": {"praise": 0, "complaint": 0, "question": 0, "suggestion": 0},
            "notable_points": [],
            "toxic_count": 0,
        }

        for res in results:
            if not res:
                continue

            # Sum sentiments
            s = res.get("sentiment", {})
            agg["sentiment"]["positive"] += s.get("positive", 0)
            agg["sentiment"]["neutral"] += s.get("neutral", 0)
            agg["sentiment"]["negative"] += s.get("negative", 0)

            # Collect topics (dedup later or just list)
            agg["topics"].extend(res.get("topics", []))

            # Sum intents
            i = res.get("intents", {})
            agg["intents"]["praise"] += i.get("praise", 0)
            agg["intents"]["complaint"] += i.get("complaint", 0)
            agg["intents"]["question"] += i.get("question", 0)
            agg["intents"]["suggestion"] += i.get("suggestion", 0)

            # Collect points
            agg["notable_points"].extend(res.get("notable_points", []))

            # Sum toxicity
            agg["toxic_count"] += res.get("toxic_count", 0)

        return agg

    def _generate_executive_summary(
        self, agg_stats: Dict, video_meta: Dict, top_comments: List[Dict]
    ) -> Dict[str, Any]:
        """Final Pass"""

        # Prepare context
        stats_summary = json.dumps(agg_stats, indent=2)
        top_comments_text = "\n".join(
            [f"- {c['text']} (Likes: {c.get('likes', 0)})" for c in top_comments]
        )

        prompt = f"""
        You are an expert video analyst. Generate a final executive summary.
        
        Video Encoutered: {video_meta.get("title")}
        
        Aggregated Stats from all comments:
        {stats_summary}
        
        Representative Top Comments:
        {top_comments_text}
        
        Return JSON ONLY. No markdown. Structure:
        {{
          "overall_summary": "1-2 sentence high level summary of audience reaction.",
          "what_users_love": ["point 1", "point 2", "point 3"],
          "areas_for_improvement": ["point 1", "point 2"],
          "creator_actions": [
            {{ "action": "specific action", "impact": "High/Medium", "effort": "Low/Medium" }}
          ],
          "video_ideas": ["idea 1", "idea 2"],
          "sentiment_breakdown": {{ "positive": int, "neutral": int, "negative": int }}, 
          "key_topics": ["topic 1", "topic 2", "topic 3"]
        }}
        
        Use the stats to fill sentiment_breakdown. Pick top 5 recurring topics for key_topics.
        """

        try:
            self.num_api_calls += 1
            response = self.model.generate_content(prompt)

            # Track tokens
            if response.usage_metadata:
                self.total_input_tokens += response.usage_metadata.prompt_token_count
                self.total_output_tokens += (
                    response.usage_metadata.candidates_token_count
                )

            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_text)

            # Merge some stat data back if LLM hallucinated numbers, but usually LLM is better at synthesizing
            # Let's ensure sentiment breakdown comes from our hard stats if possible, or trust LLM to copy it?
            # Better to trust our aggregation for numbers.
            result["sentiment_breakdown"] = agg_stats["sentiment"]
            result["total_comments_analyzed"] = sum(agg_stats["sentiment"].values())
            result["toxic_count"] = agg_stats["toxic_count"]

            return result
        except Exception as e:
            logger.error(f"Executive Summary Error: {e}")
            raise ValueError("Failed to generate summary analysis")
