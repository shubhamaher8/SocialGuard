// request.js - handles sending phishing emails when launching a campaign

// Ensure this file is loaded as a module from index.html
// This script attaches a click handler to the Launch Campaign button and sends
// a POST request to the backend with recipients fetched from Supabase.

const supabaseUrl = process.env.PARCEL_VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.PARCEL_VITE_SUPABASE_ANON_KEY;

// Use global Supabase from CDN on the page (window.supabase)
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

function buildEmailHtml() {
	// Return the provided HTML email content as a string
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
            <td align="center" style="background-color: #ffffff; padding: 20px 0;">
                <img src="https://www.prideindustries.com/wp-content/uploads/2021/06/Customer-logo_Amazon-1-768x384.png" alt="Amazon Logo" width="120" style="display: block;" />
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h1 style="font-size: 24px; color: #111111; margin: 0;">Hello Customer,</h1>
                <p style="font-size: 16px; color: #333333; line-height: 1.5; margin: 20px 0;">
                    You've been selected for an <strong style="color: #000000;">exclusive offer</strong>!
                </p>
                <p style="font-size: 16px; color: #333333; line-height: 1.5; margin: 20px 0;">
                    Avail a special <strong style="color: #000000;">80% discount on Amazon Shopping.</strong> Don't miss this limited-time opportunity to shop your favorite products at unbeatable prices.
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <a href="https://socialguard-backend.onrender.com" target="_blank" style="background-color: #ebeb33; color: #111111; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Click Here</a>
                        </td>
                    </tr>
                </table>
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

async function sendPhishingEmail(recipients) {
	const payload = {
		recipients,
		subject: 'Amazon Special Offer',
		message: buildEmailHtml()
	};

	const response = await fetch('https://mail-phi-self.vercel.app/send-email', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		const text = await response.text().catch(() => '');
		throw new Error(`Backend error ${response.status}: ${text}`);
	}
	return response.json().catch(() => ({}));
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

async function sendSmishingSms(recipientNumbers) {
	const payload = {
		recipient_numbers: recipientNumbers,
		message: 'FLAT 80% OFF on all your purchases at Amazon Shopping! Explore a wide range of products and enjoy massive savings. Hurry up and shop now before the offer ends. Terms and conditions apply. https://tinyurl.com/45vsuncr'
	};

	const response = await fetch('https://mail-phi-self.vercel.app/send-sms', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		const text = await response.text().catch(() => '');
		throw new Error(`Backend error ${response.status}: ${text}`);
	}
	return response.json().catch(() => ({}));
}

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
			const difficulty = document.getElementById('difficulty')?.value;

			if (attackType !== 'phishing' && attackType !== 'smishing') {
				alert('Select Phishing or Smishing.');
				return;
			}
			if (!difficulty) {
				alert('Please select a scenario template.');
				return;
			}

			if (attackType === 'phishing') {
				const emails = await getWorkerEmails();
				if (emails.length === 0) {
					alert('No worker emails found. Please add workers first.');
					return;
				}
				await sendPhishingEmail(emails);
				alert('Phishing email queued successfully.');
			} else if (attackType === 'smishing') {
				const phones = await getWorkerPhones();
				if (phones.length === 0) {
					alert('No worker phone numbers found. Please add workers first.');
					return;
				}
				await sendSmishingSms(phones);
				alert('Smishing SMS queued successfully.');
			}
		} catch (err) {
			console.error(err);
			alert(`Failed to send email: ${err.message || err}`);
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
