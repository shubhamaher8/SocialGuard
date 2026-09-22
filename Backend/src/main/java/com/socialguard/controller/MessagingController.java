package com.socialguard.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.socialguard.dto.ApiResponse;
import com.socialguard.dto.SendEmailRequest;
import com.socialguard.dto.SendSmsRequest;
import com.socialguard.service.EmailService;
import com.socialguard.service.SmsService;

@RestController
public class MessagingController {

    private final EmailService emails;
    private final SmsService sms;

    public MessagingController(EmailService emails, SmsService sms) {
        this.emails = emails;
        this.sms = sms;
    }

    // Fire mail campaign
    @PostMapping(value = "/send-email", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Map<String, String>> triggerEmail(
            @RequestBody(required = false) SendEmailRequest body) {
        try {
            if (body == null) {
                throw new IllegalArgumentException("Invalid JSON body");
            }
            var recipients = body.getRecipients();
            var subject = body.getSubject();
            var message = body.getMessage();

            if (recipients == null || subject == null || message == null
                    || recipients.isEmpty() || subject.isEmpty() || message.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.failMap(
                        "Invalid payload. 'recipients' (list), 'subject', and 'message' are required."));
            }

            List<Map<String, String>> results = emails.sendEmail(recipients, subject, message);
            List<String> failed = results.stream()
                    .filter(r -> "failed".equals(r.get("status")))
                    .map(r -> r.get("email"))
                    .collect(Collectors.toList());
            if (!failed.isEmpty()) {
                return ResponseEntity.internalServerError().body(ApiResponse.failMap(
                        "Failed to send to: " + String.join(", ", failed)));
            }
            return ResponseEntity.ok(ApiResponse.okMap(
                    "Successfully sent email to " + recipients.size() + " recipient(s)."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.failMap(
                    "An internal server error occurred: " + e.getMessage()));
        }
    }

    // Fire SMS campaign
    @PostMapping(value = "/send-sms", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Map<String, String>> triggerSms(
            @RequestBody(required = false) SendSmsRequest body) {
        try {
            if (body == null) {
                throw new IllegalArgumentException("Invalid JSON body");
            }
            var numbers = body.getRecipientNumbers();
            var message = body.getMessage();

            if (numbers == null || message == null
                    || numbers.isEmpty() || message.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.failMap(
                        "Invalid payload. 'recipient_numbers' (list) and 'message' are required."));
            }

            List<Map<String, String>> results = sms.sendSms(numbers, message);
            List<String> failed = results.stream()
                    .filter(r -> "failed".equals(r.get("status")))
                    .map(r -> r.get("number"))
                    .collect(Collectors.toList());
            if (!failed.isEmpty()) {
                return ResponseEntity.internalServerError().body(ApiResponse.failMap(
                        "Failed to send to: " + String.join(", ", failed)));
            }
            return ResponseEntity.ok(ApiResponse.okMap(
                    "Successfully sent SMS to " + numbers.size() + " number(s)."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.failMap(
                    "An internal server error occurred: " + e.getMessage()));
        }
    }
}
