const supabaseUrl = process.env.PARCEL_VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.PARCEL_VITE_SUPABASE_ANON_KEY;

// Use global Supabase from CDN on the page (window.supabase)
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// --- Email Templates ---
function buildAmazonEmailHtml() {
    // Updated Amazon email HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Exclusive Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 20px; background-color: #ffffff;">
        <tr>
            <td style="background-color: #ebeb33; height: 40px;"></td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h1 style="font-size: 24px; color: #111111; margin: 0;">Hello Customer,</h1>
                <p style="font-size: 16px; color: #333333; line-height: 1.5; margin: 20px 0;">
                    You've been selected for an <strong style="color: #000000;">exclusive offer</strong>!
                </p>
                <p style="font-size: 16px; color: #333333; line-height: 1.5; margin: 20px 0;">
                    Avail a special <strong style="color: #000000;">80% discount on Amazon Shopping.</strong> Don't miss this limited-time opportunity to shop your favorite products at unbeatable prices.
                </p>
                <p style="text-align: center; font-size: 18px; margin: 20px 0;">
                    <span style="font-weight: bold;">Go to the below link to claim your offer:</span><br>
                    <a href="https://tinyurl.com/yc62dxwh" style="font-weight: bold; color: #0066c0;" target="_blank">https://tinyurl.com/yc62dxwh</a>
                </p>
                <p style="font-size: 16px; color: #333333; line-height: 1.5; margin: 20px 0;">
                    This offer is valid for a limited time. Don't miss out!
                </p>
                <p style="font-size: 16px; color: #333333; line-height: 1.5; margin: 20px 0;">
                    If you have any questions, visit our <a href="https://www.amazon.in/gp/help/customer/display.html" target="_blank" style="color: #0066c0; text-decoration: none;">Help Center</a>.
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f4f4f4; padding: 20px 30px; text-align: center;">
                <p style="font-size: 12px; color: #666666; margin: 0;">
                    © 2025 Amazon.com, Inc. or its affiliates. All rights reserved.
                </p>
                <p style="font-size: 12px; color: #666666; margin: 10px 0 0;">
                    <a href="https://www.amazon.in" target="_blank" style="color: #0066c0; text-decoration: none;">Amazon.in</a> |
                    <a href="https://www.amazon.in/gp/help/customer/display.html" target="_blank" style="color: #0066c0; text-decoration: none;">Help</a> |
                    <a href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200507590" target="_blank" style="color: #0066c0; text-decoration: none;">Unsubscribe</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function buildCollegeEmailHtml() {
    // Updated college email HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register on VIIT TPO Portal for Placement Access</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #0056b3;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 5px 5px 0 0;
            font-size: 18px;
        }
        .content {
            padding: 15px 20px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .button {
            display: inline-block;
            background-color: #0056b3;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 15px 0;
            text-align: center;
        }
        .highlight {
            font-weight: bold;
            color: #0056b3;
        }
        .footer {
            margin-top: 15px;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        ul {
            padding-left: 20px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <strong>Training & Placement Office (TPO), VIIT</strong>
    </div>
    <div class="content">
        <p><strong>Dear Student,</strong></p>

        <p>To participate in placement activities, <span class="highlight">register on the TPO Portal</span> for access to:</p>
        <ul>
            <li>Placement drives and company updates</li>
            <li>Aptitude test/interview schedules</li>
            <li>Resumes, mock tests, and training resources</li>
        </ul>

        <p style="text-align: center; font-size: 18px; margin-top: 20px;">
            <span style="font-weight: bold;">Go to the below link for registration:</span><br>
            <a href="https://tinyurl.com/yz7jjhbk" style="font-weight: bold; color: #0066c0;" target="_blank">https://tinyurl.com/yz7jjhbk</a>
        </p>

        <p><span class="highlight">Important:</span> Registration is <strong>mandatory</strong> for placement eligibility. Use your VIIT email ID to sign up.</p>

        <p><strong>Regards,<br>
        TPO Team<br>
        Vishwakarma Institute of Information Technology</strong></p>
    </div>
    <div class="footer">
        <p>© 2025 VIIT | Automated email. Do not reply.</p>
    </div>
</body>
</html>`;
}

// --- SMS Templates ---
function buildAmazonSmsText() {
    return 'FLAT 80% OFF on all your purchases at Amazon Shopping! Explore a wide range of products and enjoy massive savings. Hurry up and shop now before the offer ends. Terms and conditions apply. https://tinyurl.com/yc62dxwh';
}

function buildBankSmsText() {
    return 'Your credit card is being terminated due to non KYC verification by the card issuer. Please click the link below to update your information and avoid service interruption. https://tinyurl.com/2phubmmc';
}

// --- Data Fetch ---
async function getWorkerEmails() {
    const { data, error } = await supabaseClient
        .from('workers')
        .select('email')
        .not('email', 'is', null);
    if (error) {
        console.error('Failed to fetch workers:', error);
        throw error;
    }
    return (data || [])
        .map(row => (row.email || '').trim())
        .filter(email => email.length > 0);
}

async function getWorkerPhones() {
    const { data, error } = await supabaseClient
        .from('workers')
        .select('phone')
        .not('phone', 'is', null);
    if (error) {
        console.error('Failed to fetch worker phones:', error);
        throw error;
    }
    return (data || [])
        .map(row => (row.phone || '').trim())
        .filter(phone => phone.length > 0);
}

// --- Senders ---
async function sendEmail(recipients, subject, html) {
    // Convert recipients (array of strings) to array of objects with "email" key
    const formattedRecipients = recipients.map(email => ({ email }));
    const payload = { recipients: formattedRecipients, subject, message: html };
    const response = await fetch('https://social-guard-backend.vercel.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Backend error ${response.status}: ${text}`);
    }
    return response.json().catch(() => ({}));
}

async function sendSms(recipientNumbers, message) {
    const payload = { recipient_numbers: recipientNumbers, message };
    const response = await fetch('https://social-guard-backend.vercel.app/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Backend error ${response.status}: ${text}`);
    }
    return response.json().catch(() => ({}));
}

// --- Campaign Dispatcher ---
async function sendCampaign(attackType, scenario) {
    // Normalize scenario for matching
    const normalized = scenario.trim().toLowerCase();

    if (attackType === 'phishing' && (normalized === 'amazon offer claim' || normalized === 'amazon special offer')) {
        const emails = await getWorkerEmails();
        if (emails.length === 0) throw new Error('No worker emails found. Please add workers first.');
        await sendEmail(emails, 'Amazon Special Offer', buildAmazonEmailHtml());
        return 'Phishing email (Amazon) queued successfully.';
    }
    if (attackType === 'phishing' && normalized === 'college placement registration') {
        const emails = await getWorkerEmails();
        if (emails.length === 0) throw new Error('No worker emails found. Please add workers first.');
        await sendEmail(emails, 'Register on VIIT TPO Portal for Placement Access', buildCollegeEmailHtml());
        return 'Phishing email (College) queued successfully.';
    }
    if (attackType === 'smishing' && (normalized === 'amazon offer claim' || normalized === 'amazon special offer')) {
        const phones = await getWorkerPhones();
        if (phones.length === 0) throw new Error('No worker phone numbers found. Please add workers first.');
        await sendSms(phones, buildAmazonSmsText());
        return 'Smishing SMS (Amazon) queued successfully.';
    }
    if (attackType === 'smishing' && normalized === 'credit card verification') {
        const phones = await getWorkerPhones();
        if (phones.length === 0) throw new Error('No worker phone numbers found. Please add workers first.');
        await sendSms(phones, buildBankSmsText());
        return 'Smishing SMS (Bank) queued successfully.';
    }
    throw new Error('Unsupported attack type or scenario.');
}

// --- UI Handler ---
function wireLaunchButton() {
    const button = document.querySelector('.launch-campaign-btn');
    if (!button) return;

    let inFlight = false;
    button.addEventListener('click', async () => {
        if (inFlight) return;
        inFlight = true;
        const originalText = button.textContent;
        button.textContent = 'Sending...';
        button.disabled = true;

        try {
            const attackType = document.getElementById('attack-type')?.value;
            const scenario = document.getElementById('difficulty')?.value;

            if (!attackType || !scenario) {
                alert('Please select both attack type and scenario template.');
                return;
            }

            const resultMsg = await sendCampaign(attackType, scenario);
            alert(resultMsg);
        } catch (err) {
            console.error(err);
            alert(`Failed to send campaign: ${err.message || err}`);
        } finally {
            button.textContent = originalText;
            button.disabled = false;
            inFlight = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    wireLaunchButton();
});
