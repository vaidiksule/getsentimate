"""
Core AI Service class and initialization
"""

import os
import google.generativeai as genai
from django.conf import settings


class AIService:
    """Service for AI-powered analysis using Google Gemini"""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model_name = 'gemini-2.0-flash-exp'
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
    
    def get_service_status(self) -> dict:
        """Get current AI service status"""
        return {
            'is_available': self.is_available,
            'model_name': self.model_name,
            'fallback_model': self.fallback_model,
            'api_key_configured': bool(self.api_key)
        }
