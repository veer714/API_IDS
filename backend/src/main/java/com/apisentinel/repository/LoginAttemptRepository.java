package com.apisentinel.repository;

import com.apisentinel.entity.LoginAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    List<LoginAttempt> findTop50ByOrderByTimestampDesc();

    Page<LoginAttempt> findAllByOrderByTimestampDesc(Pageable pageable);

    long countByTimestampAfter(Instant after);

    long countBySuccessFalseAndTimestampAfter(Instant after);

    long countByBlockedTrueAndTimestampAfter(Instant after);

    long countBySourceIpAndSuccessFalseAndTimestampAfter(String sourceIp, Instant after);
}
