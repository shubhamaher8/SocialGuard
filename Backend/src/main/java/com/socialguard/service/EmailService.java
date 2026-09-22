package com.socialguard.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.socialguard.dto.Recipient;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String apiKey;
    private final String fromEmail;

    public EmailService(
            @Value("${sendgrid.api-key:}") String apiKey,
            @Value("${sendgrid.from-email:placeholder@gmail.com}") String fromEmail) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.fromEmail = fromEmail;
        if (this.apiKey.isEmpty()) {
            log.warn("SendGrid API key not set. Email functionality will not work.");
        }
    }

    // Send mail batch
    public List<Map<String, String>> sendEmail(List<Recipient> recipients, String subject, String htmlContent) {
        if (apiKey.isEmpty()) {
            throw new IllegalStateException("SendGrid client is not configured.");
        }
        SendGrid sg = new SendGrid(apiKey);
        List<Map<String, String>> results = new ArrayList<>();
        for (Recipient r : recipients) {
            Map<String, String> res = new LinkedHashMap<>();
            res.put("email", r.getEmail());
            try {
                Mail mail = new Mail(
                        new Email(fromEmail),
                        subject,
                        new Email(r.getEmail()),
                        new Content("text/html", htmlContent));
                Request req = new Request();
                req.setMethod(Method.POST);
                req.setEndpoint("mail/send");
                req.setBody(mail.build());
                Response response = sg.api(req);
                if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                    res.put("status", "sent");
                } else {
                    res.put("status", "failed");
                    res.put("error", response.getBody());
                }
            } catch (Exception e) {
                res.put("status", "failed");
                res.put("error", e.getMessage());
            }
            results.add(res);
        }
        return results;
    }
}
