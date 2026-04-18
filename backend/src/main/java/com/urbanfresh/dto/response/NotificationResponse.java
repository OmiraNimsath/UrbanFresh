package com.urbanfresh.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * DTO Layer – Response payload for a single customer notification.
 * Returned by GET /api/notifications and PATCH /api/notifications/{id}/read.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long orderId;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
