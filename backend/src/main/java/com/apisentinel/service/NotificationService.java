package com.apisentinel.service;

import com.apisentinel.entity.Notification;
import com.apisentinel.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Notification create(String title, String message, String severity, String type, String link) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .severity(severity != null ? severity : "INFO")
                .type(type != null ? type : "SECURITY")
                .link(link)
                .readStatus(false)
                .timestamp(Instant.now())
                .build();

        Notification saved = notificationRepository.save(notification);

        try {
            messagingTemplate.convertAndSend("/topic/notifications", saved);
        } catch (Exception e) {
            log.debug("WebSocket notification broadcast error: {}", e.getMessage());
        }

        return saved;
    }

    public List<Notification> getRecent() {
        return notificationRepository.findTop30ByOrderByTimestampDesc();
    }

    public long getUnreadCount() {
        return notificationRepository.countByReadStatusFalse();
    }

    public void markAllAsRead() {
        List<Notification> unread = notificationRepository.findTop30ByOrderByTimestampDesc();
        unread.forEach(n -> n.setReadStatus(true));
        notificationRepository.saveAll(unread);
    }
}
