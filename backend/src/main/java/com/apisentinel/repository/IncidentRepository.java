package com.apisentinel.repository;

import com.apisentinel.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    Optional<Incident> findByIncidentId(String incidentId);

    List<Incident> findTop10ByOrderByLastSeenDesc();

    Page<Incident> findAllByOrderByLastSeenDesc(Pageable pageable);

    Optional<Incident> findFirstBySourceIpAndAttackTypeAndStatusInOrderByLastSeenDesc(
            String sourceIp, String attackType, List<String> statuses);

    long countByStatus(String status);

    long countByLastSeenAfter(Instant after);
}
