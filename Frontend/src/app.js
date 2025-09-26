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
        const adminOnlyTabs = ['scenarios', 'builder', 'analytics', 'reports'];
        
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

    generateReport() {
        // Simulate report generation
        const reportSelect = document.querySelector('.reports-section select');
        const reportType = reportSelect ? reportSelect.value : 'executive';
        
        // Add a new report to the list
        const reportList = document.querySelector('.report-list');
        if (!reportList) return;

        const newReport = document.createElement('div');
        newReport.className = 'report-item';
        
        const currentDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        const reportNames = {
            'executive': 'Executive Summary',
            'detailed': 'Detailed Analysis',
            'compliance': 'Compliance Report',
            'training': 'Training Effectiveness'
        };

        newReport.innerHTML = `
            <div class="report-info">
                <h4>${reportNames[reportType] || 'Generated Report'}</h4>
                <span class="report-date">Generated: ${currentDate}</span>
                <span class="report-type">${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</span>
            </div>
            <div class="report-actions">
                <button class="btn btn--secondary btn--sm">View</button>
                <button class="btn btn--outline btn--sm">Download PDF</button>
            </div>
        `;

        reportList.insertBefore(newReport, reportList.firstChild);

        // Show success feedback
        const button = document.querySelector('.generate-report-btn');
        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Report Generated ✓';
            button.disabled = true;
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    }

    setupCharts() {
        // Only setup if the canvas exists and is visible
        const canvas = document.getElementById('improvementChart');
        if (!canvas || !canvas.offsetParent) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.improvementChart) {
            this.improvementChart.destroy();
        }

        this.improvementChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [{
                    label: 'Success Rate',
                    data: [65, 70, 75, 78, 82, 85, 87, 89],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Reporting Rate',
                    data: [20, 25, 35, 42, 48, 55, 58, 62],
                    borderColor: '#FFC185',
                    backgroundColor: 'rgba(255, 193, 133, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
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

        // Simulate some dynamic updates
        this.updateDashboardMetrics();
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
        // Reset quiz state
        this.currentQuestion = 1;
        this.answers = {};
        
        // Clear all radio buttons
        this.container.querySelectorAll('input[type="radio"]').forEach(input => {
            input.checked = false;
        });
        
        // Hide results and show first question
        this.container.querySelector('.quiz-results').style.display = 'none';
        this.container.querySelector('.quiz-navigation').style.display = 'flex';
        
        this.showQuestion(1);
    }
}
