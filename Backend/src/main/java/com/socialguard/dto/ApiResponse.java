package com.socialguard.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {

    // Success or error body
    private String message;
    private String error;

    public ApiResponse() {
    }

    private ApiResponse(String message, String error) {
        this.message = message;
        this.error = error;
    }

    public static ApiResponse ok(String message) {
        return new ApiResponse(message, null);
    }

    public static ApiResponse fail(String error) {
        return new ApiResponse(null, error);
    }

    public static Map<String, String> okMap(String message) {
        return Map.of("message", message);
    }

    public static Map<String, String> failMap(String error) {
        return Map.of("error", error);
    }

    public String getMessage() {
        return message;
    }

    public String getError() {
        return error;
    }
}
