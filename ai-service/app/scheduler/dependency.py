from typing import List, Dict, Set, Tuple
import networkx as nx
from .models import TopicInput

class DependencyResolver:
    """
    DAG-based dependency resolution for study topics.
    Enforces prerequisites, detects cycles, and calculates centrality.
    """

    def __init__(self, topics: List[TopicInput]):
        self.topics = {t.id: t for t in topics}
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        for topic_id in self.topics:
            self.graph.add_node(topic_id)

        for topic in self.topics.values():
            for prereq_id in topic.prerequisites:
                if prereq_id in self.topics:
                    # Edge from prerequisite -> topic (prereq must happen before topic)
                    self.graph.add_edge(prereq_id, topic.id)

    def validate_acyclic(self) -> Tuple[bool, List[List[str]]]:
        """
        Validates that there are no circular dependencies.
        Returns (is_acyclic, list_of_cycles)
        """
        try:
            cycles = list(nx.simple_cycles(self.graph))
            return len(cycles) == 0, cycles
        except Exception:
            return False, []

    def get_topological_order(self) -> List[str]:
        """
        Returns a topological sort of topics respecting prerequisite order.
        """
        is_acyclic, cycles = self.validate_acyclic()
        if not is_acyclic:
            raise ValueError(f"Circular dependency detected in syllabus: {cycles}")
        return list(nx.topological_sort(self.graph))

    def get_prerequisite_centrality(self) -> Dict[str, int]:
        """
        Calculates how many topics downstream depend on this topic (transitive descendants).
        Higher centrality means this topic is a major bottleneck prerequisite.
        """
        centrality = {}
        for node in self.graph.nodes:
            # All downstream descendants reachable from node
            descendants = nx.descendants(self.graph, node)
            centrality[node] = len(descendants)
        return centrality

    def get_prerequisites_for(self, topic_id: str) -> Set[str]:
        """All direct and indirect prerequisites for a topic"""
        if topic_id in self.graph:
            return nx.ancestors(self.graph, topic_id)
        return set()
