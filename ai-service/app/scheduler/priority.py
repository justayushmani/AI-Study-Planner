from typing import List, Dict
from .models import TopicInput

class PriorityEngine:
    """
    Deterministic Priority Scoring Engine.
    Combines weakness, difficulty, syllabus importance, and prerequisite centrality.
    """

    # Tunable weights
    WEIGHT_WEAKNESS = 0.35
    WEIGHT_DIFFICULTY = 0.20
    WEIGHT_IMPORTANCE = 0.25
    WEIGHT_CENTRALITY = 0.20

    @classmethod
    def calculate_scores(
        cls,
        topics: List[TopicInput],
        centrality_map: Dict[str, int]
    ) -> Dict[str, float]:
        """
        Calculates normalized priority score (0.0 to 10.0) for each topic.
        """
        max_centrality = max(centrality_map.values(), default=1) or 1
        scores = {}

        for topic in topics:
            # 1. Weakness Score (1=Strong -> weakness 1; 1=Very Weak -> weakness 5)
            # Inverts confidence score 1..5 -> 5..1
            weakness_score = 6 - topic.user_confidence_score

            # 2. Difficulty Score (1 to 5)
            difficulty_score = topic.difficulty_level

            # 3. Topic Importance Score (1 to 5)
            importance_score = topic.importance_score

            # 4. Centrality (scaled to 1 to 5)
            raw_centrality = centrality_map.get(topic.id, 0)
            centrality_score = 1.0 + (raw_centrality / max_centrality) * 4.0

            # Weighted sum (range 1.0 to 5.0)
            composite_score = (
                cls.WEIGHT_WEAKNESS * weakness_score +
                cls.WEIGHT_DIFFICULTY * difficulty_score +
                cls.WEIGHT_IMPORTANCE * importance_score +
                cls.WEIGHT_CENTRALITY * centrality_score
            )

            # Scale to 1.0 - 10.0 for user clarity
            scores[topic.id] = round(composite_score * 2.0, 2)

        return scores
