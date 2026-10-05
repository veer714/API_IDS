package com.apisentinel.repository;

import com.apisentinel.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    Optional<ApiKey> findByKeyHash(String keyHash);
    List<ApiKey> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);
    List<ApiKey> findAllByOrderByCreatedAtDesc();
}
