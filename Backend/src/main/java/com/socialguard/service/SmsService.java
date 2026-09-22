package com.socialguard.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final String accountSid;
    private final String authToken;
    private final String phoneNumber;
    private final boolean configured;

    public SmsService(
            @Value("${twilio.account-sid:}") String accountSid,
            @Value("${twilio.auth-token:}") String authToken,
            @Value("${twilio.phone-number:}") String phoneNumber) {
        this.accountSid = accountSid == null ? "" : accountSid.trim();
        this.authToken = authToken == null ? "" : authToken.trim();
        this.phoneNumber = phoneNumber == null ? "" : phoneNumber.trim();
        this.configured = !this.accountSid.isEmpty() && !this.authToken.isEmpty() && !this.phoneNumber.isEmpty();
        if (!configured) {
            log.warn("Twilio environment variables not set. SMS functionality will not work.");
        }
    }

    // Send SMS batch
    public List<Map<String, String>> sendSms(List<String> recipientNumbers, String message) {
        if (!configured) {
            throw new IllegalStateException("Twilio client is not configured.");
        }
        Twilio.init(accountSid, authToken);
        List<Map<String, String>> results = new ArrayList<>();
        for (String number : recipientNumbers) {
            Map<String, String> res = new LinkedHashMap<>();
            res.put("number", number);
            try {
                Message msg = Message.creator(
                        new PhoneNumber(number),
                        new PhoneNumber(phoneNumber),
                        message).create();
                res.put("status", "sent");
                res.put("sid", msg.getSid());
            } catch (Exception e) {
                res.put("status", "failed");
                res.put("error", e.getMessage());
            }
            results.add(res);
        }
        return results;
    }
}
