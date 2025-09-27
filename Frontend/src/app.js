// Social Engineering Attack Simulator JavaScript

// Initialize Supabase client
const supabaseUrl = process.env.PARCEL_VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.PARCEL_VITE_SUPABASE_ANON_KEY;

class SocialEngSimulator {
    constructor() {
        this.currentTab = 'dashboard';
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        this.user = null;
        this.improvementChart = null;
        this.attacksTimelineChart = null; // Add this for the new chart
        // Resolve asset URLs through the bundler so they work in dev and build
        this.emailPreviewImgUrl = new URL('../public/email.png', import.meta.url).href;
        this.smsPreviewImgUrl = new URL('../public/sms.jpg', import.meta.url).href;
        this.collegePreviewImgUrl = new URL('../public/college.png', import.meta.url).href;
        this.bankPreviewImgUrl = new URL('../public/bank.jpg', import.meta.url).href;
    }

    async init() {
        // Check authentication before proceeding
        const isAuthenticated = await this.checkAuthStatus();
        if (!isAuthenticated) return;
        
        // Check for tab parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            // Validate tab access before setting it
            const regularUserTabs = ['dashboard', 'training', 'logout'];
            if (this.isAdmin || regularUserTabs.includes(tab)) {
                this.currentTab = tab;
            } else {
                // Redirect to dashboard for unauthorized access
                this.currentTab = 'dashboard';
                // Update URL to remove unauthorized tab parameter
                const newUrl = new URL(window.location);
                newUrl.searchParams.delete('tab');
                window.history.replaceState({}, '', newUrl);
            }
        }
        
        // Protect against direct URL access to admin pages
        this.protectRoutes();
        
        this.setupEventListeners();
        this.loadInitialData();
        // Initialize charts after a delay to ensure DOM is ready
        setTimeout(() => this.setupCharts(), 500);
        
        // Switch to the correct tab if not dashboard
        if (this.currentTab !== 'dashboard') {
            this.switchTab(this.currentTab);
        }
    }
    
    async checkAuthStatus() {
        // Check if user is logged in
        const { data, error } = await this.supabase.auth.getSession();
        
        if (error || !data.session) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
        
        this.user = data.session.user;
        //console.log('User authenticated:', this.user.email);
        
        // Set user role based on email
        this.isAdmin = this.user.email === 'admin@gmail.com';
        
        // Update navigation based on user role
        this.updateNavigation();
        
        return true;
    }
    
    updateNavigation() {
        const adminOnlyButtons = document.querySelectorAll('.admin-only');
        const allNavButtons = document.querySelectorAll('.nav-btn');
        
        // Define which tabs are accessible for regular users
        const regularUserTabs = ['dashboard', 'training', 'logout'];
        
        if (this.isAdmin) {
            // Admin sees all tabs - show all admin-only buttons
            adminOnlyButtons.forEach(btn => {
                btn.style.display = 'block';
            });
        } else {
            // Regular users only see specific tabs - hide admin-only buttons
            adminOnlyButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Also hide any other navigation buttons that aren't in regularUserTabs
            allNavButtons.forEach(btn => {
                const tabName = btn.getAttribute('data-tab');
                if (tabName && !regularUserTabs.includes(tabName)) {
                    btn.style.display = 'none';
                }
            });
        }
        
        // If current tab is not accessible to user, redirect to dashboard
        if (!this.isAdmin && !regularUserTabs.includes(this.currentTab)) {
            this.switchTab('dashboard');
        }
    }
    
    protectRoutes() {
        // Hide all admin-only tab content for regular users
        const regularUserTabs = ['dashboard', 'training', 'logout'];
        const adminOnlyTabs = ['scenarios', 'builder', 'analytics'];
        
        if (!this.isAdmin) {
            // Hide admin-only tab content
            adminOnlyTabs.forEach(tabId => {
                const tabElement = document.getElementById(tabId);
                if (tabElement) {
                    tabElement.style.display = 'none';
                    tabElement.classList.remove('active');
                }
            });
            
            // Ensure only accessible tabs are visible
            regularUserTabs.forEach(tabId => {
                const tabElement = document.getElementById(tabId);
                if (tabElement && tabId === this.currentTab) {
                    tabElement.style.display = 'block';
                    tabElement.classList.add('active');
                }
            });
        }
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = btn.getAttribute('data-tab');
                
                // Handle logout button click
                if (tabName === 'logout') {
                    this.handleLogout();
                    return;
                }
                
                // Handle navigation to separate pages
                if (tabName === 'add-workers') {
                    window.location.href = 'add_workers.html';
                    return;
                }
                
                this.switchTab(tabName);
            });
        });

        // View templates buttons
        document.querySelectorAll('.view-templates-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const attackType = btn.closest('.scenario-card').getAttribute('data-attack');
                this.showTemplatesModal(attackType);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal');
                this.closeModal(modal);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Launch campaign button
        const launchBtn = document.querySelector('.launch-campaign-btn');
        if (launchBtn) {
            launchBtn.addEventListener('click', (e) => {
                this.launchCampaign();
            });
        }

        // Generate report button
        const reportBtn = document.querySelector('.generate-report-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', (e) => {
                this.generateReport();
            });
        }

        // Form preview updates
        const campaignNameInput = document.getElementById('campaign-name');
        const attackTypeSelect = document.getElementById('attack-type');
        const difficultySelect = document.getElementById('difficulty');

        if (campaignNameInput) {
            campaignNameInput.addEventListener('input', () => {
                this.updatePreview();
            });
        }

        if (attackTypeSelect && difficultySelect) {
            attackTypeSelect.addEventListener('change', () => {
                // Get selected attack type
                const attackType = attackTypeSelect.value;
                // Get templates for this attack type
                const attackData = this.getAttackData(attackType);
                // Clear existing options
                difficultySelect.innerHTML = '<option value="">Select scenario template</option>';
                // Add new options
                attackData.templates.forEach(template => {
                    const opt = document.createElement('option');
                    opt.value = template.toLowerCase();
                    opt.textContent = template;
                    difficultySelect.appendChild(opt);
                });
                this.updatePreview();
            });
        }

        if (difficultySelect) {
            difficultySelect.addEventListener('change', () => {
                this.updatePreview();
            });
        }

        // Training module buttons
        document.querySelectorAll('.module-card .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleName = btn.closest('.module-card').querySelector('h3').textContent;
                this.handleTrainingModule(moduleName, btn);
            });
        });
    }

    handleTrainingModule(moduleName, button) {
        // Maps module names to their corresponding HTML files
        const moduleFiles = {
            'Identifying Social Engineering': 'training_1.html',
            'Email Security Best Practices': 'training_2.html',
            'Incident Reporting': 'training_3.html',
            'Case Studies & Examples': 'training_4.html'
        };
        
        const trainingFile = moduleFiles[moduleName];
        if (trainingFile) {
            window.location.href = trainingFile;
        } else {
            alert(`Module: ${moduleName} not found`);
        }
    }

    switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        // Check if user has access to this tab
        const regularUserTabs = ['dashboard', 'training', 'logout'];
        if (!this.isAdmin && !regularUserTabs.includes(tabName)) {
            console.log(`User does not have access to tab: ${tabName}`);
            // Force redirect to dashboard for unauthorized access
            tabName = 'dashboard';
        }
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Show selected tab content
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.style.display = 'block';
        }

        this.currentTab = tabName;

        // Initialize charts if switching to analytics
        if (tabName === 'analytics') {
            // Fetch analytics data when switching to the analytics tab
            this.fetchAnalyticsData();
            setTimeout(() => this.setupCharts(), 100);
        }
    }

    generateTemplateContent(attackData) {
        let html = `<div class="template-info">
            <p><strong>Description:</strong> ${attackData.description}</p>
            <ul class="template-list">`;

        attackData.templates.forEach((template, idx) => {
            html += `
                <li class="template-item">
                    <span class="template-name">${template}</span>
                    <button class="btn btn--outline btn--sm template-preview-btn" data-template="${template}" data-attack="${attackData.name.toLowerCase()}">Preview</button>
                </li>`;
        });

        html += `</ul></div>`;

        html += `<style>
            .template-info { padding: var(--space-16) 0; }
            .template-list { list-style: none; padding: 0; margin: var(--space-16) 0; }
            .template-item { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                padding: var(--space-12); 
                border-bottom: 1px solid var(--color-border); 
            }
            .template-item:last-child { border-bottom: none; }
            .template-name { font-weight: var(--font-weight-medium); }
        </style>`;

        return html;
    }

    showTemplatesModal(attackType) {
        const modal = document.getElementById('templatesModal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('modalContent');

        if (!modal || !title || !content) return;

        const attackData = this.getAttackData(attackType);

        title.textContent = `${attackData.name} Template`;
        content.innerHTML = this.generateTemplateContent(attackData);

        // Add event listeners for preview buttons
        setTimeout(() => {
            content.querySelectorAll('.template-preview-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const template = btn.getAttribute('data-template');
                    const attack = btn.getAttribute('data-attack');
                    this.showTemplatePreview(attack, template, content);
                });
            });
        }, 0);

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    showTemplatePreview(attack, template, container) {
        // Simple image preview with link, no template info
        let imgSrc = '';
        let alt = '';
        if (attack === 'phishing' && template === 'Amazon Offer Claim') {
            imgSrc = this.emailPreviewImgUrl;
            alt = 'Phishing Email Example';
        } else if (attack === 'smishing' && template === 'Amazon Offer Claim') {
            imgSrc = this.smsPreviewImgUrl;
            alt = 'Smishing SMS Example';
        } else if (attack === 'phishing' && template === 'College Placement Registration') {
            imgSrc = this.collegePreviewImgUrl;
            alt = 'College Placement Registration Example';
        } else if (attack === 'smishing' && template === 'Credit Card Verification') {
            imgSrc = this.bankPreviewImgUrl;
            alt = 'Bank SMS Example';
        } else {
            container.innerHTML = '<div class="card" style="padding:32px;text-align:center;">No preview available.</div>';
            return;
        }

        container.innerHTML = `
            <div class="card template-preview-card" style="max-width:480px;margin:32px auto;">
                <div class="card__body" style="padding:0;text-align:center;">
                    <a href="${imgSrc}" target="_blank" rel="noopener">
                        <img src="${imgSrc}" alt="${alt}" style="width:100%;border-radius:var(--radius-lg);box-shadow:var(--shadow-md);margin-bottom:var(--space-16);" />
                    </a>
                </div>
                <div class="card__footer" style="text-align:center;">
                    <button class="btn btn--outline btn--sm" style="margin-top:var(--space-16);" id="backToTemplatesBtn">Back</button>
                </div>
            </div>
        `;

        // Back button to return to template list
        container.querySelector('#backToTemplatesBtn').onclick = () => {
            container.innerHTML = this.generateTemplateContent(this.getAttackData(attack));
            setTimeout(() => {
                container.querySelectorAll('.template-preview-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const template = btn.getAttribute('data-template');
                        const attack = btn.getAttribute('data-attack');
                        this.showTemplatePreview(attack, template, container);
                    });
                });
            }, 0);
        };
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    getAttackData(attackType) {
        const attacks = {
            'phishing': {
                name: 'Phishing',
                description: 'Email-based deception to steal credentials',
                templates: [
                    'Amazon Offer Claim',
                    'College Placement Registration'
                ]
            },
            'smishing': {
                name: 'Smishing',
                description: 'SMS/text message based attacks',
                templates: [
                    'Amazon Offer Claim',
                    'Credit Card Verification'
                ]
            },
        };

        return attacks[attackType] || { name: 'Unknown', description: '', templates: [] };
    }

    updatePreview() {
        const campaignName = document.getElementById('campaign-name')?.value || 'Unnamed Campaign';
        const attackType = document.getElementById('attack-type')?.value;
        const difficulty = document.getElementById('difficulty')?.value;
        const preview = document.querySelector('.preview-card');

        if (!preview) return;

        // Determine preview image and description
        let imgSrc = '';
        let alt = '';
        let scenarioLabel = '';

        if (attackType === 'phishing' && difficulty === 'amazon offer claim') {
            imgSrc = this.emailPreviewImgUrl;
            alt = 'Phishing Email Example';
            scenarioLabel = 'Amazon Offer Claim';
        } else if (attackType === 'phishing' && difficulty === 'college placement registration') {
            imgSrc = this.collegePreviewImgUrl;
            alt = 'College Placement Registration Example';
            scenarioLabel = 'College Placement Registration';
        } else if (attackType === 'smishing' && difficulty === 'amazon offer claim') {
            imgSrc = this.smsPreviewImgUrl;
            alt = 'Smishing SMS Example';
            scenarioLabel = 'Amazon Offer Claim';
        } else if (attackType === 'smishing' && difficulty === 'credit card verification') {
            imgSrc = this.bankPreviewImgUrl;
            alt = 'Bank SMS Example';
            scenarioLabel = 'Credit Card Verification';
        }

        if (attackType && difficulty && imgSrc) {
            preview.innerHTML = `
                <h4>${campaignName}</h4>
                <div class="preview-details">
                    <div class="preview-detail">
                        <span class="detail-label">Campaign Name:</span>
                        <span class="detail-value">${campaignName}</span>
                    </div>
                    <div class="preview-detail">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${attackType.charAt(0).toUpperCase() + attackType.slice(1)}</span>
                    </div>
                    <div class="preview-detail">
                        <span class="detail-label">Scenario:</span>
                        <span class="detail-value">${scenarioLabel}</span>
                    </div>
                </div>
                <div class="preview-image" style="margin-top:16px;text-align:center;">
                    <img src="${imgSrc}" alt="${alt}" style="max-width:100%;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);" />
                </div>
            `;
        } else {
            preview.innerHTML = `<div class="preview-placeholder">Select attack type and Scenario to see preview</div>`;
        }
    }

    async launchCampaign() {
        const campaignName = document.getElementById('campaign-name')?.value;
        const attackType = document.getElementById('attack-type')?.value;
        const difficulty = document.getElementById('difficulty')?.value;

        if (!campaignName || !attackType || !difficulty) {
            alert('Please fill in all required fields');
            return;
        }

        // Save only the required fields to Supabase
        try {
            const { error } = await this.supabase
                .from('campaign')
                .insert([
                    {
                        name: campaignName,
                        attack_type: attackType,
                        scenario_template: difficulty,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                alert('Failed to save campaign: ' + error.message);
                return;
            }
        } catch (err) {
            alert('Unexpected error: ' + err.message);
            return;
        }

        // Show success modal
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        // Reset form
        const form = document.querySelector('.simulation-form');
        if (form) {
            form.reset();
        }
    }

    setupCharts() {
        // Only setup if the canvas exists and is visible
        const canvas = document.getElementById('improvementChart');
        if (!canvas || !canvas.offsetParent) return;

        const ctx = canvas.getContext('2d');

        // Get the latest values from the analytics cards
        const credentials = parseInt(document.querySelector('.metric-card:nth-child(1) .metric-value')?.textContent) || 0;
        const links = parseInt(document.querySelector('.metric-card:nth-child(2) .metric-value')?.textContent) || 0;

        // Destroy existing chart if it exists
        if (this.improvementChart) {
            this.improvementChart.destroy();
        }

        this.improvementChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Links Clicked', 'Credentials Submitted'],
                datasets: [{
                    label: 'Count',
                    data: [links, credentials],
                    backgroundColor: [
                        'rgba(255, 193, 133, 0.8)', // orange for links
                        'rgba(31, 184, 205, 0.8)'   // teal for credentials
                    ],
                    borderColor: [
                        'rgba(255, 193, 133, 1)',
                        'rgba(31, 184, 205, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    loadInitialData() {
        // Set current date as minimum for start date picker
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('start-date');
        if (startDateInput) {
            startDateInput.min = today;
            startDateInput.value = today;
        }

        // Fetch analytics data from database
        this.fetchAnalyticsData();

        // Simulate some dynamic updates
        this.updateDashboardMetrics();
    }

    async fetchAnalyticsData() {
        // Get the metric value elements
        const credentialsElement = document.querySelector('.metric-card:nth-child(1) .metric-value');
        const linksElement = document.querySelector('.metric-card:nth-child(2) .metric-value');
        const trainedElement = document.querySelector('.metric-card:nth-child(3) .metric-value');
        
        // Exit if elements don't exist (not on analytics page)
        if (!credentialsElement || !linksElement || !trainedElement) return;
        
        try {
            // Set loading state
            credentialsElement.textContent = 'Loading...';
            linksElement.textContent = 'Loading...';
            trainedElement.textContent = 'Loading...';
            
            // 1. Get credentials submitted count (logins table)
            const { count: credentialsCount, error: credentialsError } = await this.supabase
                .from('logins')
                .select('*', { count: 'exact', head: true });
            
            if (credentialsError) throw new Error(credentialsError.message);
            
            // 2. Get links clicked count (visitor_logs table with city pune and unique IP)
            const { data: visitorData, error: visitorError } = await this.supabase
                .from('visitor_logs')
                .select('ip_address')
                .eq('city', 'Pune');
            
            if (visitorError) throw new Error(visitorError.message);
            
            // Count unique IP addresses
            const uniqueIPs = new Set();
            if (visitorData) {
                visitorData.forEach(log => uniqueIPs.add(log.ip_address));
            }
            const linksCount = uniqueIPs.size;
            
            // 3. Get employees trained count (workers table)
            const { count: trainedCount, error: trainedError } = await this.supabase
                .from('workers')
                .select('*', { count: 'exact', head: true });
            
            if (trainedError) throw new Error(trainedError.message);
            
            // Update the UI with fetched data
            credentialsElement.textContent = credentialsCount || '0';
            linksElement.textContent = linksCount || '0';
            trainedElement.textContent = trainedCount || '0';
            
            // Add visual indicator classes if needed
            if (credentialsCount > 0) {
                credentialsElement.classList.add('warning');
            }
            
            if (linksCount > 0) {
                linksElement.classList.add('warning');
            }

            // --- ADD THIS BLOCK FOR CTR ---
            const ctrElement = document.querySelector('.metric-card:nth-child(4) .metric-value');
            if (ctrElement) {
                let ctr = 0;
                if (trainedCount && trainedCount > 0) {
                    ctr = (linksCount / trainedCount) * 100;
                }
                ctrElement.textContent = `${ctr.toFixed(1)}%`;
            }
            // --- END CTR BLOCK ---

            // --- ADD THIS BLOCK FOR SUBMISSION RATE ---
            const submissionRateElement = document.querySelector('.metric-card:nth-child(5) .metric-value');
            if (submissionRateElement) {
                let submissionRate = 0;
                if (linksCount && linksCount > 0) {
                    submissionRate = (credentialsCount / linksCount) * 100;
                }
                submissionRateElement.textContent = `${submissionRate.toFixed(1)}%`;
            }
            // --- END SUBMISSION RATE BLOCK ---

            // --- Major ISP Calculation ---
            const majorIspElement = document.querySelector('.metric-card:nth-child(6) .metric-value');
            if (majorIspElement) {
                // Fetch all ISPs from visitor_logs
                const { data: visitorLogs, error } = await this.supabase
                    .from('visitor_logs')
                    .select('isp');

                if (error || !visitorLogs || visitorLogs.length === 0) {
                    majorIspElement.textContent = 'N/A';
                } else {
                    // Count frequency of each ISP
                    const ispCounts = {};
                    visitorLogs.forEach(log => {
                        const isp = log.isp || 'Unknown';
                        ispCounts[isp] = (ispCounts[isp] || 0) + 1;
                    });
                    // Find the ISP with the highest count
                    const majorIsp = Object.entries(ispCounts).sort((a, b) => b[1] - a[1])[0][0];
                    majorIspElement.textContent = majorIsp;
                }
            }
            // --- End Major ISP Calculation ---

            // Also fetch campaigns data for the table
            await this.fetchCampaignsData();
            await this.fetchLoginsData();
            this.setupCharts();

            // NEW: Fetch and render campaign performance timeline
            await this.renderAttacksTimelineChart();
            // Fetch IP logger data
            await this.fetchIpLoggerData();

        } catch (error) {
            console.error('Error fetching analytics data:', error);
            
            // Show error state
            credentialsElement.textContent = 'Error';
            linksElement.textContent = 'Error';
            trainedElement.textContent = 'Error';
        }
    }

    async renderAttacksTimelineChart() {
        const canvas = document.getElementById('attacksTimelineChart');
        if (!canvas) return;

        // Fetch visitor_logs for city Pune
        const { data: logs, error } = await this.supabase
            .from('visitor_logs')
            .select('ip_address, timestamp, city')
            .eq('city', 'Pune');

        // Fetch logins (assuming table name is 'logins' and has 'login_time' column)
        const { data: logins, error: loginsError } = await this.supabase
            .from('logins')
            .select('login_time');

        if (error || !logs || loginsError || !logins) {
            if (this.attacksTimelineChart) this.attacksTimelineChart.destroy();
            return;
        }

        // Group visitor_logs by day (YYYY-MM-DD)
        const dayMap = {};
        logs.forEach(log => {
            if (!log.timestamp) return;
            const date = new Date(log.timestamp);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
            if (!dayMap[dayKey]) dayMap[dayKey] = new Set();
            dayMap[dayKey].add(log.ip_address);
        });

        // Group logins by day (YYYY-MM-DD)
        const loginDayMap = {};
        logins.forEach(login => {
            if (!login.login_time) return;
            const date = new Date(login.login_time);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
            if (!loginDayMap[dayKey]) loginDayMap[dayKey] = 0;
            loginDayMap[dayKey]++;
        });

        // Merge all days from both datasets
        const allDayKeys = Array.from(new Set([
            ...Object.keys(dayMap),
            ...Object.keys(loginDayMap)
        ])).sort();

        // Format for x-axis: "25 Sept", "8 Oct", etc.
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const formattedLabels = allDayKeys.map(dayKey => {
            const [year, month, day] = dayKey.split('-');
            const monthName = monthNames[parseInt(month, 10) - 1];
            const dayNum = parseInt(day, 10);
            return `${dayNum} ${monthName}`;
        });

        const uniqueIpCounts = allDayKeys.map(day => dayMap[day] ? dayMap[day].size : 0);
        const loginCounts = allDayKeys.map(day => loginDayMap[day] ? loginDayMap[day] : 0);

        // Destroy previous chart if exists
        if (this.attacksTimelineChart) {
            this.attacksTimelineChart.destroy();
        }

        // Draw Chart.js line chart with two datasets
        const ctx = canvas.getContext('2d');
        this.attacksTimelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedLabels,
                datasets: [
                    {
                        label: 'Clicks',
                        data: uniqueIpCounts,
                        fill: true,
                        borderColor: 'rgba(33, 128, 141, 1)',
                        backgroundColor: 'rgba(33, 128, 141, 0.18)',
                        tension: 0.3,
                        pointRadius: 5,
                        pointBackgroundColor: 'rgba(33, 128, 141, 1)',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 7,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Logins',
                        data: loginCounts,
                        fill: true,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.18)',
                        tension: 0.3,
                        pointRadius: 5,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 7,
                        yAxisID: 'y',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Date' },
                        ticks: { color: '#666', autoSkip: true, maxTicksLimit: 12 }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Count' },
                        ticks: {
                            precision: 0,
                            color: '#666',
                            callback: function(value) {
                                // Hide the 0 label on y-axis
                                return value === 0 ? '' : value;
                            }
                        }
                    }
                }
            }
        });
    }

    async fetchCampaignsData() {
        const tableBody = document.getElementById('campaigns-table-body');
        if (!tableBody) return;
        
        try {
            tableBody.innerHTML = '<tr><td colspan="4" class="loading-cell">Loading campaigns...</td></tr>';
            
            // Fetch campaigns from the database
            const { data: campaigns, error } = await this.supabase
                .from('campaign')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw new Error(error.message);
            
            if (campaigns && campaigns.length > 0) {
                // Clear loading message
                tableBody.innerHTML = '';
                
                // Add each campaign to the table
                campaigns.forEach(campaign => {
                    const row = document.createElement('tr');
                    
                    // Format the date
                    const createdAt = new Date(campaign.created_at);
                    const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}:${String(createdAt.getSeconds()).padStart(2, '0')}+00`;
                    
                    row.innerHTML = `
                        <td>${campaign.name || '-'}</td>
                        <td>${campaign.attack_type || '-'}</td>
                        <td>${campaign.scenario_template || '-'}</td>
                        <td>${formattedDate}</td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No campaigns found</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching campaigns data:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="error-cell">Error loading campaigns</td></tr>';
        }
    }

    async fetchLoginsData() {
        const tableBody = document.getElementById('logins-table-body');
        if (!tableBody) return;

        try {
            tableBody.innerHTML = '<tr><td colspan="3" class="loading-cell">Loading logins...</td></tr>';

            // Fetch logins from the database
            const { data: logins, error } = await this.supabase
                .from('logins')
                .select('email, password, login_time')
                .order('login_time', { ascending: false });

            if (error) throw new Error(error.message);

            if (logins && logins.length > 0) {
                tableBody.innerHTML = '';
                logins.forEach(login => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${login.email || '-'}</td>
                        <td>${login.password || '-'}</td>
                        <td>${login.login_time ? new Date(login.login_time).toLocaleString() : '-'}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="3" class="no-data">No logins found</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching logins data:', error);
            tableBody.innerHTML = '<tr><td colspan="3" class="error-cell">Error loading logins</td></tr>';
        }
    }

    async fetchIpLoggerData() {
        const tableBody = document.getElementById('iplogger-table-body');
        if (!tableBody) return;

        try {
            tableBody.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading IP logger details...</td></tr>';

            // Fetch visitor_logs for city Pune
            const { data: logs, error } = await this.supabase
                .from('visitor_logs')
                .select('ip_address, user_agent, city, isp, timestamp')
                .eq('city', 'Pune');

            if (error) throw new Error(error.message);

            if (logs && logs.length > 0) {
                // Map to unique IPs (show only the latest entry per IP)
                const uniqueIpMap = {};
                logs.forEach(log => {
                    // If IP not seen or this log is newer, keep it
                    if (
                        !uniqueIpMap[log.ip_address] ||
                        new Date(log.timestamp) > new Date(uniqueIpMap[log.ip_address].timestamp)
                    ) {
                        uniqueIpMap[log.ip_address] = log;
                    }
                });

                const uniqueLogs = Object.values(uniqueIpMap);

                if (uniqueLogs.length > 0) {
                    tableBody.innerHTML = '';
                    uniqueLogs.forEach(log => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${log.ip_address || '-'}</td>
                            <td>${log.user_agent || '-'}</td>
                            <td>${log.city || '-'}</td>
                            <td>${log.isp || '-'}</td>
                            <td>${log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                } else {
                    tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No unique IPs found for Pune</td></tr>';
                }
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No data found</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching IP logger data:', error);
            tableBody.innerHTML = '<tr><td colspan="5" class="error-cell">Error loading IP logger details</td></tr>';
        }
    }

    updateDashboardMetrics() {
        // Add some subtle animations to the stats
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach((stat, index) => {
            // Animation logic for stats
            setTimeout(() => {
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Animate progress bars
        const progressBars = document.querySelectorAll('.progress-fill, .bar-fill');
        progressBars.forEach(bar => {
            // Animation logic for progress bars
            const width = bar.getAttribute('data-width') || '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 300);
        });
    }
    
    async handleLogout() {
        console.log('Logging out...');
        const { error } = await this.supabase.auth.signOut();
        
        if (error) {
            console.error('Error logging out:', error.message);
            return;
        }
        
        // Redirect to login page after successful logout
        window.location.href = 'login.html';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app...');
    window.simulator = new SocialEngSimulator();
    await window.simulator.init();

    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        // Close modal on Escape key
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) {
                window.simulator.closeModal(openModal);
            }
        }

        // Tab navigation with Ctrl+number
        if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
            e.preventDefault();
            const tabIndex = parseInt(e.key) - 1;
            const tabs = ['dashboard', 'training', 'logout']; // Only accessible tabs for regular users
            if (tabs[tabIndex]) {
                // Check if user has access to this tab
                const regularUserTabs = ['dashboard', 'training', 'logout'];
                if (window.simulator.isAdmin || regularUserTabs.includes(tabs[tabIndex])) {
                    window.simulator.switchTab(tabs[tabIndex]);
                }
            }
        }
    });

    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initialize quiz functionality if quiz container exists
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        new QuizManager(quizContainer);
    }
});

// Quiz Management Class
class QuizManager {
    constructor(container) {
        this.container = container;
        this.currentQuestion = 1;
        this.totalQuestions = 5;
        this.answers = {};
        this.correctAnswers = this.getCorrectAnswers();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateNavigationState();
    }
    
    getCorrectAnswers() {
        // Define correct answers based on the current page
        const pageTitle = document.title;
        
        if (pageTitle.includes('Identifying Social Engineering')) {
            return { q1: 'b', q2: 'b', q3: 'a', q4: 'c', q5: 'd' };
        } else if (pageTitle.includes('Email Security')) {
            return { q1: 'c', q2: 'b', q3: 'c', q4: 'a', q5: 'b' };
        } else if (pageTitle.includes('Incident Reporting')) {
            return { q1: 'b', q2: 'c', q3: 'b', q4: 'b', q5: 'c' };
        } else if (pageTitle.includes('Case Studies')) {
            return { q1: 'b', q2: 'b', q3: 'b', q4: 'b', q5: 'b' };
        }
        
        return {}; // Default empty object
    }
    
    setupEventListeners() {
        // Navigation buttons
        const prevBtn = this.container.querySelector('.quiz-prev');
        const nextBtn = this.container.querySelector('.quiz-next');
        const submitBtn = this.container.querySelector('.quiz-submit');
        const retryBtn = this.container.querySelector('.quiz-retry');
        
        prevBtn?.addEventListener('click', () => this.previousQuestion());
        nextBtn?.addEventListener('click', () => this.nextQuestion());
        submitBtn?.addEventListener('click', () => this.submitQuiz());
        retryBtn?.addEventListener('click', () => this.retryQuiz());
        
        // Radio button changes
        this.container.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.saveAnswer(e.target.name, e.target.value);
                this.updateNavigationState();
            }
        });
    }
    
    saveAnswer(question, answer) {
        this.answers[question] = answer;
    }
    
    showQuestion(questionNumber) {
        // Hide all questions
        const questions = this.container.querySelectorAll('.question-container');
        questions.forEach(q => q.classList.remove('active'));
        
        // Show current question
        const currentQuestionEl = this.container.querySelector(`[data-question="${questionNumber}"]`);
        if (currentQuestionEl) {
            currentQuestionEl.classList.add('active');
        }
        
        // Update question indicator
        const currentQuestionSpan = this.container.querySelector('.current-question');
        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = questionNumber;
        }
        
        this.updateNavigationState();
    }
    
    updateNavigationState() {
        const prevBtn = this.container.querySelector('.quiz-prev');
        const nextBtn = this.container.querySelector('.quiz-next');
        const submitBtn = this.container.querySelector('.quiz-submit');
        
        // Update previous button
        if (prevBtn) {
            prevBtn.disabled = this.currentQuestion === 1;
        }
        
        // Update next/submit buttons
        const hasCurrentAnswer = this.answers[`q${this.currentQuestion}`];
        
        if (this.currentQuestion === this.totalQuestions) {
            // Last question - show submit button
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) {
                submitBtn.style.display = 'block';
                submitBtn.disabled = !hasCurrentAnswer;
            }
        } else {
            // Not last question - show next button
            if (nextBtn) {
                nextBtn.style.display = 'block';
                nextBtn.disabled = !hasCurrentAnswer;
            }
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }
    
    previousQuestion() {
        if (this.currentQuestion > 1) {
            this.currentQuestion--;
            this.showQuestion(this.currentQuestion);
        }
    }
    
    nextQuestion() {
        if (this.currentQuestion < this.totalQuestions) {
            this.currentQuestion++;
            this.showQuestion(this.currentQuestion);
        }
    }
    
    submitQuiz() {
        const score = this.calculateScore();
        this.showResults(score);
    }
    
    calculateScore() {
        let correct = 0;
        for (const [question, userAnswer] of Object.entries(this.answers)) {
            if (userAnswer === this.correctAnswers[question]) {
                correct++;
            }
        }
        return correct;
    }
    
    showResults(score) {
        // Hide quiz questions and navigation
        this.container.querySelectorAll('.question-container').forEach(q => {
            q.style.display = 'none';
        });
        this.container.querySelector('.quiz-navigation').style.display = 'none';
        
        // Show results
        const resultsEl = this.container.querySelector('.quiz-results');
        const scoreDisplay = resultsEl.querySelector('.score-display');
        const feedback = resultsEl.querySelector('.score-feedback');
        
        scoreDisplay.textContent = score;
        
        // Generate feedback based on score
        let feedbackText = '';
        const percentage = (score / this.totalQuestions) * 100;
        
        if (percentage >= 90) {
            feedbackText = 'Excellent! You have a strong understanding of the material.';
        } else if (percentage >= 70) {
            feedbackText = 'Good job! You understand most of the key concepts.';
        } else if (percentage >= 50) {
            feedbackText = 'Not bad, but consider reviewing the training material again.';
        } else {
            feedbackText = 'Please review the training material and try again.';
        }
        
        feedback.textContent = feedbackText;
        resultsEl.style.display = 'block';
    }
    
    retryQuiz() {
        // Simply reload the page to reset everything
        window.location.reload();
    }
}
