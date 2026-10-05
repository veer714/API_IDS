package com.apisentinel.repository;

import com.apisentinel.entity.ThreatEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ThreatEventRepository extends JpaRepository<ThreatEvent, Long> {

    Optional<ThreatEvent> findByThreatId(String threatId);

    List<ThreatEvent> findTop10ByOrderByTimestampDesc();

    Page<ThreatEvent> findAllByOrderByTimestampDesc(Pageable pageable);

    long countByTimestampAfter(Instant after);

    long countBySeverityAndTimestampAfter(String severity, Instant after);

    @Query("SELECT t.severity AS severity, COUNT(t) AS count FROM ThreatEvent t " +
           "WHERE t.timestamp >= :after GROUP BY t.severity")
    List<Map<String, Object>> getSeverityDistribution(@Param("after") Instant after);

    @Query("SELECT t.attackType AS attackType, COUNT(t) AS count FROM ThreatEvent t " +
           "WHERE t.timestamp >= :after GROUP BY t.attackType ORDER BY COUNT(t) DESC")
    List<Map<String, Object>> getAttackTypeDistribution(@Param("after") Instant after);
}
