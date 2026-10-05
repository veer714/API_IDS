package com.apisentinel.service;

import com.apisentinel.entity.RequestEvent;
import com.apisentinel.repository.RequestEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrafficService {

    private final RequestEventRepository requestEventRepository;

    public List<RequestEvent> getRecentTraffic() {
        return requestEventRepository.findTop100ByOrderByTimestampDesc();
    }

    public Page<RequestEvent> getPagedTraffic(int page, int size) {
        return requestEventRepository.findAllByOrderByTimestampDesc(
                PageRequest.of(page, size, Sort.by("timestamp").descending())
        );
    }

    public Optional<RequestEvent> getRequestByRequestId(String requestId) {
        return requestEventRepository.findByRequestId(requestId);
    }
}
