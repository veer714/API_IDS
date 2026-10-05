package com.apisentinel.repository;

import com.apisentinel.entity.SecurityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityRuleRepository extends JpaRepository<SecurityRule, Long> {
    Optional<SecurityRule> findByRuleId(String ruleId);
    List<SecurityRule> findByEnabledTrue();
    List<SecurityRule> findAllByOrderByCategoryAscNameAsc();
}
