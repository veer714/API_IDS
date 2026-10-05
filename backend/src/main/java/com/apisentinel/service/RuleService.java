package com.apisentinel.service;

import com.apisentinel.dto.RuleUpdateRequest;
import com.apisentinel.entity.SecurityRule;
import com.apisentinel.repository.SecurityRuleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class RuleService {

    private final SecurityRuleRepository ruleRepository;
    private final Map<String, Pattern> compiledPatterns = new HashMap<>();

    @PostConstruct
    public void initRules() {
        if (ruleRepository.count() == 0) {
            seedDefaultRules();
        }
        refreshCompiledPatterns();
    }

    public synchronized void refreshCompiledPatterns() {
        compiledPatterns.clear();
        for (SecurityRule rule : ruleRepository.findByEnabledTrue()) {
            if (rule.getPatternRegex() != null && !rule.getPatternRegex().isBlank()) {
                try {
                    compiledPatterns.put(rule.getRuleId(), Pattern.compile(rule.getPatternRegex(), Pattern.CASE_INSENSITIVE));
                } catch (Exception e) {
                    log.error("Failed to compile regex for rule {}: {}", rule.getRuleId(), e.getMessage());
                }
            }
        }
    }

    public List<SecurityRule> getAllRules() {
        return ruleRepository.findAllByOrderByCategoryAscNameAsc();
    }

    public SecurityRule updateRule(Long id, RuleUpdateRequest request) {
        SecurityRule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found with id: " + id));

        if (request.getEnabled() != null) rule.setEnabled(request.getEnabled());
        if (request.getThreshold() != null) rule.setThreshold(request.getThreshold());
        if (request.getAction() != null) rule.setAction(request.getAction());
        if (request.getDescription() != null) rule.setDescription(request.getDescription());

        SecurityRule updated = ruleRepository.save(rule);
        refreshCompiledPatterns();
        return updated;
    }

    public List<String> matchRules(String endpoint, String payload, Map<String, String> headers) {
        List<String> matched = new ArrayList<>();
        String inspectText = (endpoint != null ? endpoint : "") + " " + (payload != null ? payload : "");

        for (Map.Entry<String, Pattern> entry : compiledPatterns.entrySet()) {
            if (entry.getValue().matcher(inspectText).find()) {
                matched.add(entry.getKey());
            }
        }

        return matched;
    }

    private void seedDefaultRules() {
        List<SecurityRule> rules = Arrays.asList(
                SecurityRule.builder()
                        .ruleId("RULE_SQLI_HEURISTIC")
                        .name("SQL Injection Heuristic Filter")
                        .category("INJECTION")
                        .description("Detects SQL injection operators, UNION SELECT, comment sequences, and tautologies.")
                        .severity("HIGH")
                        .enabled(true)
                        .threshold(0.40)
                        .patternRegex("(?i)(\\bunion\\s+select\\b|'\\s+or\\s+'?1'?'?\\s*=\\s*'?1|--|#|/\\*|;\\s*drop\\s+table|information_schema|exec\\s*\\()")
                        .action("BLOCK")
                        .build(),

                SecurityRule.builder()
                        .ruleId("RULE_XSS_DETECT")
                        .name("Cross-Site Scripting (XSS) Filter")
                        .category("XSS")
                        .description("Detects executable scripts, alert invocations, javascript: pseudo-protocols, and malicious HTML event handlers.")
                        .severity("HIGH")
                        .enabled(true)
                        .threshold(0.40)
                        .patternRegex("(?i)(<script[^>]*>|javascript:|alert\\s*\\(|document\\.cookie|onerror\\s*=|onload\\s*=|eval\\s*\\()")
                        .action("BLOCK")
                        .build(),

                SecurityRule.builder()
                        .ruleId("RULE_PATH_TRAVERSAL")
                        .name("Path Traversal & LFI Guard")
                        .category("PATH_TRAVERSAL")
                        .description("Prevents directory climbing patterns, null byte injection, and system file path probing.")
                        .severity("HIGH")
                        .enabled(true)
                        .threshold(0.40)
                        .patternRegex("(?i)(\\.\\./|\\.\\.\\\\|%2e%2e%2f|/etc/passwd|/windows/system32|/boot\\.ini)")
                        .action("BLOCK")
                        .build(),

                SecurityRule.builder()
                        .ruleId("RULE_COMMAND_INJECTION")
                        .name("OS Command Injection Filter")
                        .category("INJECTION")
                        .description("Detects shell command chaining operators, pipes, backticks, and common system binaries.")
                        .severity("CRITICAL")
                        .enabled(true)
                        .threshold(0.35)
                        .patternRegex("(?i)(;\\s*(cat|ls|whoami|id|bash|sh|curl|wget|nc)\\b|\\|\\s*(cat|ls|whoami|id|bash|sh)|`[^`]+`|\\$\\([^\\)]+\\))")
                        .action("BLOCK")
                        .build(),

                SecurityRule.builder()
                        .ruleId("RULE_BRUTE_FORCE_AUTH")
                        .name("Brute-Force & Credential Abuse")
                        .category("AUTHENTICATION")
                        .description("Detects repetitive authentication failures and credential abuse spikes.")
                        .severity("HIGH")
                        .enabled(true)
                        .threshold(0.50)
                        .patternRegex("")
                        .action("CHALLENGE")
                        .build(),

                SecurityRule.builder()
                        .ruleId("RULE_RATE_ABUSE")
                        .name("High-Frequency API Rate Abuse")
                        .category("RATE_LIMIT")
                        .description("Enforces sliding window thresholds for excessive request volume per IP or API key.")
                        .severity("MEDIUM")
                        .enabled(true)
                        .threshold(0.60)
                        .patternRegex("")
                        .action("THROTTLE")
                        .build()
        );

        ruleRepository.saveAll(rules);
        log.info("Initialized {} default security rules in database.", rules.size());
    }
}
