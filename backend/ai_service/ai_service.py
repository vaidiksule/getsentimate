from .services import AIService, CommentAnalyzer, InsightsGenerator, RealtimeAnalyzer

ai_service = AIService()
comment_analyzer = CommentAnalyzer(ai_service)
insights_generator = InsightsGenerator(ai_service)
realtime_analyzer = RealtimeAnalyzer(ai_service)

# Backward compatibility methods
def analyze_comments(comments, analysis_type='sentiment', include_toxicity=True):
    return comment_analyzer.analyze_comments(comments, analysis_type, include_toxicity)

def analyze_sentiment(text):
    return comment_analyzer.sentiment_analyzer.analyze_sentiment(text)

def detect_toxicity(text):
    return comment_analyzer.toxicity_detector.detect_toxicity(text)

# Attach to main instance
ai_service.analyze_comments = analyze_comments
ai_service.analyze_sentiment = analyze_sentiment
ai_service.detect_toxicity = detect_toxicity

__all__ = ['ai_service']