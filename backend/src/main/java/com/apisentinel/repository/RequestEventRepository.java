package com.apisentinel.repository;

import com.apisentinel.entity.RequestEvent;
import com.apisentinel.entity.SecurityDecision;
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
public interface RequestEventRepository extends JpaRepository<RequestEvent, Long> {

    Optional<RequestEvent> findByRequestId(String requestId);

    List<RequestEvent> findTop100ByOrderByTimestampDesc();

    Page<RequestEvent> findAllByOrderByTimestampDesc(Pageable pageable);

    Page<RequestEvent> findByApplicationIdOrderByTimestampDesc(String applicationId, Pageable pageable);

    long countByTimestampAfter(Instant after);

    long countByDecisionAndTimestampAfter(SecurityDecision decision, Instant after);

    long countByAttackTypeNotAndTimestampAfter(String attackType, Instant after);

    @Query("SELECT AVG(r.riskScore) FROM RequestEvent r WHERE r.timestamp >= :after")
    Double getAverageRiskScoreAfter(@Param("after") Instant after);

    @Query("SELECT r.endpoint AS endpoint, COUNT(r) AS count, MAX(r.riskScore) AS maxRisk " +
           "FROM RequestEvent r WHERE r.timestamp >= :after " +
           "GROUP BY r.endpoint ORDER BY COUNT(r) DESC")
    List<Map<String, Object>> getTopAttackedEndpoints(@Param("after") Instant after, Pageable pageable);

    @Query("SELECT r.sourceIp AS sourceIp, COUNT(r) AS count, MAX(r.riskScore) AS maxRisk " +
           "FROM RequestEvent r WHERE r.timestamp >= :after " +
           "GROUP BY r.sourceIp ORDER BY COUNT(r) DESC")
    List<Map<String, Object>> getTopSourceIps(@Param("after") Instant after, Pageable pageable);

    @Query("SELECT r.attackType AS attackType, COUNT(r) AS count " +
           "FROM RequestEvent r WHERE r.timestamp >= :after AND r.attackType != 'NORMAL' " +
           "GROUP BY r.attackType ORDER BY COUNT(r) DESC")
    List<Map<String, Object>> getAttackTypeDistribution(@Param("after") Instant after);

    @Query("SELECT r.decision AS decision, COUNT(r) AS count " +
           "FROM RequestEvent r WHERE r.timestamp >= :after " +
           "GROUP BY r.decision")
    List<Map<String, Object>> getDecisionDistribution(@Param("after") Instant after);
}
