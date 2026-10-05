package com.apisentinel.repository;

import com.apisentinel.entity.ProtectedEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProtectedEndpointRepository extends JpaRepository<ProtectedEndpoint, Long> {
    List<ProtectedEndpoint> findByApplicationId(Long applicationId);
    List<ProtectedEndpoint> findByApplicationAppId(String appId);
    Optional<ProtectedEndpoint> findByApplicationAppIdAndPathAndMethod(String appId, String path, String method);
    Optional<ProtectedEndpoint> findByApplicationAppIdAndPath(String appId, String path);
}
