package com.apisentinel.service;

import com.apisentinel.entity.ThreatEvent;
import com.apisentinel.repository.ThreatEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ThreatService {

    private final ThreatEventRepository threatEventRepository;

    public List<ThreatEvent> getRecentThreats() {
        return threatEventRepository.findTop10ByOrderByTimestampDesc();
    }

    public Page<ThreatEvent> getPagedThreats(int page, int size) {
        return threatEventRepository.findAllByOrderByTimestampDesc(
                PageRequest.of(page, size, Sort.by("timestamp").descending())
        );
    }

    public Optional<ThreatEvent> getThreatByThreatId(String threatId) {
        return threatEventRepository.findByThreatId(threatId);
    }
}
