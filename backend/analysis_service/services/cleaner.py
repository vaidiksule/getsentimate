import re
from typing import List, Dict, Any


class CommentCleaner:
    def clean_comments(self, comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Clean, deduplicate, and filter comments.
        """
        seen_texts = set()
        cleaned = []

        for c in comments:
            text = c.get("text", "")
            if not text:
                continue

            # 1. Deduplication
            # Normalize for dedup (lowercase, strip)
            norm_text = text.strip().lower()
            if norm_text in seen_texts:
                continue
            seen_texts.add(norm_text)

            # 2. Filter empty/short
            if (
                len(norm_text) < 5
            ):  # "lol", "first" -> maybe keep? User said "Remove empty". Let's say < 3 chars is noise.
                continue

            # 3. URL-only spam detection
            # If text is basically just a URL
            if re.match(r"^https?://\S+$", text.strip()):
                continue

            # 4. Truncate very long comments (e.g. max 500 chars for LLM efficiency)
            if len(text) > 800:
                text = text[:800] + "..."

            # Update text in dict
            c["text"] = text
            cleaned.append(c)

        return cleaned
