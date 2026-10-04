"""
Model Explainability Engine
Part of API Sentinel ML Service

Generates interpretable, feature-grounded rationales for security decisions.
Rules strictly inspect actual input metrics and model activations (zero fabricated reasons).
"""

from typing import Dict, List, Any


class PredictionExplainer:
    """
    Grounds threat predictions in concrete telemetry and model signals.
    """

    @staticmethod
    def explain(
        record: Dict[str, Any],
        risk_score: float,
        anomaly_score: float,
        payload_score: float,
        predicted_attack: str,
    ) -> List[str]:
        reasons: List[str] = []

        rpm = float(record.get("requests_per_minute", 1) or 1)
        fails = float(record.get("failed_requests", 0) or 0)
        unique_eps = float(record.get("unique_endpoints", 1) or 1)
        status_code = int(record.get("status_code", 200) or 200)
        auth_status = str(record.get("authentication_status", "")).upper()
        endpoint = str(record.get("endpoint", "")).lower()
        payload = str(record.get("payload", "") or "")

        # 1. Behavioral & Rate reasons
        if rpm >= 30:
            reasons.append(f"Elevated request rate velocity ({int(rpm)} req/min exceeds standard baseline)")
        if fails >= 3:
            reasons.append(f"Elevated error frequency ({int(fails)} 4xx/5xx responses in sliding window)")
        if unique_eps >= 6:
            reasons.append(f"High endpoint dispersion ({int(unique_eps)} distinct routes probed, characteristic of enumeration)")

        # 2. Authentication & Status reasons
        if auth_status == "FAILED" or status_code in [401, 403]:
            reasons.append("Authentication failure or unauthorized access violation")
        if any(kw in endpoint for kw in ["/.env", "/actuator", "/admin", "/wp-", "/config", "/backup", "/pprof"]):
            reasons.append(f"Targeted sensitive administrative or configuration path ('{endpoint}')")

        # 3. Payload-specific reasons
        if payload:
            from app.features.payload import calculate_entropy, SPECIAL_CHARS_REGEX
            entropy = calculate_entropy(payload)
            specials = len(SPECIAL_CHARS_REGEX.findall(payload))

            if "UNION" in payload.upper() or "' OR '" in payload or "--" in payload:
                reasons.append("Payload contains SQL dialect structure (tautology or UNION injection tokens)")
            if "<script" in payload.lower() or "onerror=" in payload.lower() or "javascript:" in payload.lower():
                reasons.append("Payload contains browser executable script tokens or DOM event handlers")
            if "../" in payload or "..\\" in payload or "%2e%2e" in payload.lower():
                reasons.append("Payload contains relative path directory traversal sequences")
            if any(op in payload for op in ["; cat", "| whoami", "& dir", "`whoami`", "$(id)"]):
                reasons.append("Payload contains operating system command chaining operators")
            if entropy >= 4.2 and len(payload) > 25:
                reasons.append(f"Elevated Shannon entropy ({entropy:.2f}) indicates potential encoding or obfuscation")
            elif specials >= 6 and payload_score >= 0.5:
                reasons.append("Abnormally high density of syntax delimiters and special characters")

        # 4. Model anomaly reasons
        if anomaly_score >= 0.65:
            reasons.append(f"Behavioral telemetry significantly deviates from normal client baseline (anomaly score: {anomaly_score:.2f})")
        if payload_score >= 0.70 and not any("Payload" in r for r in reasons):
            reasons.append(f"Payload n-gram distribution exhibits high maliciousness probability ({payload_score:.2f})")

        # Fallback for benign traffic
        if not reasons:
            if risk_score < 0.35:
                reasons = [
                    "Request rate and temporal velocity conform to normal client profiles",
                    "Payload syntax and size comply with typical API schema",
                    "No anomalous authentication or traversal patterns detected",
                ]
            else:
                reasons = [f"Composite telemetry correlates with anomalous risk threshold ({risk_score:.2f})"]

        return reasons[:5]  # Cap at top 5 most salient reasons
