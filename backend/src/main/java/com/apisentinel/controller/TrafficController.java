package com.apisentinel.controller;

import com.apisentinel.entity.RequestEvent;
import com.apisentinel.service.TrafficService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/traffic")
@RequiredArgsConstructor
@Tag(name = "Live Traffic", description = "Live API telemetry stream and detailed Request Inspector")
public class TrafficController {

    private final TrafficService trafficService;

    @GetMapping
    @Operation(summary = "Get recent API traffic records (latest 100)")
    public ResponseEntity<List<RequestEvent>> getRecentTraffic() {
        return ResponseEntity.ok(trafficService.getRecentTraffic());
    }

    @GetMapping("/paged")
    @Operation(summary = "Get paginated traffic events")
    public ResponseEntity<Page<RequestEvent>> getPagedTraffic(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(trafficService.getPagedTraffic(page, size));
    }

    @GetMapping("/{requestId}")
    @Operation(summary = "Get comprehensive Request Inspector details by requestId")
    public ResponseEntity<RequestEvent> getRequestDetails(@PathVariable String requestId) {
        return trafficService.getRequestByRequestId(requestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
