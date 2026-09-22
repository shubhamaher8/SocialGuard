package com.socialguard.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SendSmsRequest {

    // Bulk SMS payload
    @JsonProperty("recipient_numbers")
    private List<String> recipientNumbers;

    private String message;

    public List<String> getRecipientNumbers() {
        return recipientNumbers;
    }

    public void setRecipientNumbers(List<String> recipientNumbers) {
        this.recipientNumbers = recipientNumbers;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
