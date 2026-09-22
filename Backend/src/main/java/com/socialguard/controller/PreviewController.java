package com.socialguard.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PreviewController {

    // Serve lure previews
    @GetMapping("/bank_sms_txt")
    public String bankTemplatePage() {
        return "forward:/bank_sms_txt.html";
    }

    @GetMapping("/amazon_email")
    public String emailTemplatePage() {
        return "forward:/amazon_email.html";
    }

    @GetMapping("/amazon_sms_txt")
    public String smsTemplatePage() {
        return "forward:/amazon_sms_txt.html";
    }

    @GetMapping("/college_email")
    public String collegeEmailPage() {
        return "forward:/college_email.html";
    }
}
