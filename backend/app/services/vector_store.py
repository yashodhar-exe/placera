import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticVectorStore:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            token_pattern=r'(?u)\b[\w\+\#\.\-]+\b'
        )

    def normalize_skill(self, skill: str) -> str:
        s = skill.strip().lower()
        # common aliases
        aliases = {
            "js": "javascript",
            "ts": "typescript",
            "py": "python",
            "reactjs": "react",
            "react.js": "react",
            "nodejs": "node.js",
            "node": "node.js",
            "postgres": "postgresql",
            "k8s": "kubernetes",
            "ml": "machine learning",
            "ai": "artificial intelligence",
            "genai": "generative ai",
            "llm": "large language models",
            "dsa": "data structures and algorithms",
            "aws": "amazon web services",
            "gcp": "google cloud platform"
        }
        return aliases.get(s, s)

    def compute_similarity(self, target_text: str, candidate_texts: List[str]) -> List[float]:
        if not target_text or not candidate_texts:
            return [0.0] * len(candidate_texts)
        
        all_corpus = [target_text] + candidate_texts
        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_corpus)
            target_vector = tfidf_matrix[0:1]
            candidate_vectors = tfidf_matrix[1:]
            similarities = cosine_similarity(target_vector, candidate_vectors).flatten()
            return [float(np.clip(s, 0.0, 1.0)) for s in similarities]
        except Exception:
            return [0.5] * len(candidate_texts)

    def build_candidate_profile_text(self, student_data: Dict[str, Any]) -> str:
        skills = " ".join([self.normalize_skill(s.get("name", "")) for s in student_data.get("skills", [])])
        projects = " ".join([
            f"{p.get('title', '')} {' '.join(p.get('tech_stack', []))} {p.get('description', '')}"
            for p in student_data.get("projects", [])
        ])
        certs = " ".join([c.get("title", "") for c in student_data.get("certifications", [])])
        resume = student_data.get("resume_summary", "") or ""
        branch = student_data.get("branch", "")
        return f"{branch} {skills} {projects} {certs} {resume}"

    def build_jd_requirements_text(self, drive_data: Dict[str, Any]) -> str:
        req_skills = " ".join([self.normalize_skill(s) for s in drive_data.get("required_skills", [])])
        pref_skills = " ".join([self.normalize_skill(s) for s in drive_data.get("preferred_skills", [])])
        role = drive_data.get("role_title", "")
        desc = drive_data.get("job_description_raw", "") or ""
        return f"{role} {req_skills} {pref_skills} {desc}"

vector_store = SemanticVectorStore()
