package com.apisentinel.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateTracker {

    private static class IpStats {
        final List<Long> requestTimestamps = Collections.synchronizedList(new ArrayList<>());
        final List<Long> failureTimestamps = Collections.synchronizedList(new ArrayList<>());
        final Set<String> recentEndpoints = Collections.newSetFromMap(new ConcurrentHashMap<>());
        volatile long lastUpdated = System.currentTimeMillis();
    }

    private final Map<String, IpStats> ipTable = new ConcurrentHashMap<>();

    public record TelemetryStats(double rpm, double failedRequests, double uniqueEndpoints) {}

    public TelemetryStats recordAndGetStats(String ip, String endpoint, int statusCode) {
        if (ip == null || ip.isBlank()) {
            return new TelemetryStats(1.0, 0.0, 1.0);
        }

        IpStats stats = ipTable.computeIfAbsent(ip, k -> new IpStats());
        long now = System.currentTimeMillis();
        stats.lastUpdated = now;

        // Record request
        stats.requestTimestamps.add(now);
        if (endpoint != null) {
            stats.recentEndpoints.add(endpoint);
        }
        if (statusCode >= 400) {
            stats.failureTimestamps.add(now);
        }

        // Prune older than 60s for RPM
        long sixtySecondsAgo = now - 60_000;
        stats.requestTimestamps.removeIf(ts -> ts < sixtySecondsAgo);

        // Prune older than 5m for failures
        long fiveMinutesAgo = now - 300_000;
        stats.failureTimestamps.removeIf(ts -> ts < fiveMinutesAgo);

        double rpm = stats.requestTimestamps.size();
        double failed = stats.failureTimestamps.size();
        double uniqueEp = stats.recentEndpoints.size();

        return new TelemetryStats(rpm, failed, uniqueEp);
    }
}
