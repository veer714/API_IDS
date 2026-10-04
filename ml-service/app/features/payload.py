"""
Payload Feature Extraction & NLP Pipeline
Part of API Sentinel ML Service

Extracts character-level n-gram TF-IDF representations and lexical information-theoretic
metrics (Shannon entropy, syntax dispersion) to identify injection, traversal, and tampering patterns.
Does NOT rely on brittle exact string matching.
"""

import math
import re
import urllib.parse
from collections import Counter
from typing import Dict, List, Any, Tuple

import numpy as np
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler


SPECIAL_CHARS_REGEX = re.compile(r"['\"<>;|&/\\%$()={}\[\]\*\+\-`!~^@#]")
DIGITS_REGEX = re.compile(r"\d+")


def normalize_payload(text: str) -> str:
    """Decodes URL encoding and normalizes numbers to prevent overfitting to specific IDs."""
    if not text:
        return ""
    try:
        decoded = urllib.parse.unquote_plus(text)
    except Exception:
        decoded = text
    # Replace long digit sequences with generic token <NUM>
    normalized = DIGITS_REGEX.sub("<NUM>", decoded.lower().strip())
    return normalized


def calculate_entropy(text: str) -> float:
    """Calculates Shannon entropy to detect encoded, packed, or random payloads."""
    if not text:
        return 0.0
    length = len(text)
    counts = Counter(text)
    entropy = -sum((cnt / length) * math.log2(cnt / length) for cnt in counts.values())
    return round(entropy, 4)


class PayloadFeatureExtractor:
    """
    Extracts statistical lexical features and character n-gram TF-IDF features.
    """

    LEXICAL_NAMES = [
        "payload_length",
        "shannon_entropy",
        "special_char_count",
        "special_char_ratio",
        "digit_ratio",
        "has_sql_tokens",
        "has_script_tokens",
        "has_traversal_tokens",
        "has_command_tokens",
    ]

    SQL_PATTERNS = re.compile(r"(union|select|insert|update|delete|drop|table|--|or\s+<num>=<num>|or\s+['\"]|<num>=<num>)", re.I)
    XSS_PATTERNS = re.compile(r"(<script|alert\(|onerror=|onload=|javascript:|<svg|<iframe)", re.I)
    TRAVERSAL_PATTERNS = re.compile(r"(\.\./|\.\.\\|%2e%2e|etc/passwd|windows/win\.ini)", re.I)
    COMMAND_PATTERNS = re.compile(r"(;\s*(cat|ls|dir|ping|whoami|id)|\|\s*whoami|`id`|\$\(id\))", re.I)

    def __init__(self, max_tfidf_features: int = 2500):
        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            max_features=max_tfidf_features,
            min_df=2,
            sublinear_tf=True,
        )
        self.lexical_scaler = StandardScaler()
        self.is_fitted = False

    def _extract_lexical_row(self, raw_text: str) -> List[float]:
        text = str(raw_text or "")
        norm = normalize_payload(text)
        length = float(len(text))

        entropy = calculate_entropy(text)
        specials = len(SPECIAL_CHARS_REGEX.findall(text))
        special_ratio = specials / max(1.0, length)
        digits = sum(c.isdigit() for c in text)
        digit_ratio = digits / max(1.0, length)

        has_sql = 1.0 if self.SQL_PATTERNS.search(norm) else 0.0
        has_xss = 1.0 if self.XSS_PATTERNS.search(norm) else 0.0
        has_trav = 1.0 if self.TRAVERSAL_PATTERNS.search(norm) else 0.0
        has_cmd = 1.0 if self.COMMAND_PATTERNS.search(norm) else 0.0

        return [
            math.log1p(length),
            entropy,
            float(specials),
            special_ratio,
            digit_ratio,
            has_sql,
            has_xss,
            has_trav,
            has_cmd,
        ]

    def fit(self, texts: List[str]) -> "PayloadFeatureExtractor":
        normalized_texts = [normalize_payload(t) for t in texts]
        self.vectorizer.fit(normalized_texts)

        lexical_matrix = np.array([self._extract_lexical_row(t) for t in texts], dtype=np.float32)
        self.lexical_scaler.fit(lexical_matrix)

        self.is_fitted = True
        return self

    def transform(self, texts: List[str], combine_sparse: bool = True):
        if not self.is_fitted:
            raise RuntimeError("PayloadFeatureExtractor must be fitted before transform().")

        normalized_texts = [normalize_payload(t) for t in texts]
        tfidf_sparse = self.vectorizer.transform(normalized_texts)

        lexical_matrix = np.array([self._extract_lexical_row(t) for t in texts], dtype=np.float32)
        lexical_scaled = self.lexical_scaler.transform(lexical_matrix)
        lexical_sparse = csr_matrix(lexical_scaled)

        if combine_sparse:
            return hstack([lexical_sparse, tfidf_sparse], format="csr")
        return tfidf_sparse, lexical_scaled

    def fit_transform(self, texts: List[str]):
        return self.fit(texts).transform(texts)
