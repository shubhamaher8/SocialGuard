const SUPABASE_URL = process.env.PARCEL_VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.PARCEL_VITE_SUPABASE_ANON_KEY; // replace with your key
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function groupByMonth(deliveries) {
  const grouped = {};
  deliveries.forEach(d => {
    const date = new Date(d.sent_at);
    const month = date.toLocaleString('default', { month: 'short' });
    if (!grouped[month]) grouped[month] = { opened: 0, clicked: 0, reported: 0 };
    if (d.opened) grouped[month].opened++;
    if (d.clicked) grouped[month].clicked++;
    if (d.reported) grouped[month].reported++;
  });
  return grouped;
}

function animateValue(id, start, end, duration) {
  let range = end - start, current = start, increment = range / (duration/20);
  const obj = document.getElementById(id);
  const timer = setInterval(()=>{
    current += increment;
    if ((increment>0 && current>=end) || (increment<0 && current<=end)) { current=end; clearInterval(timer);}
    obj.textContent = Math.floor(current);
  },20);
}

class SocialEngSimulator {
  constructor() {
    this.improvementChart=null; this.departmentChart=null; this.deviceChart=null;
    this.funnelChart=null; this.heatmapChart=null; this.comparativeChart=null;
    this.init();
  }

  async init() { await this.populateCampaignFilter(); await this.updateDashboardMetrics(); }

  async populateCampaignFilter() {
    const { data: campaigns } = await supabase.from('campaigns').select('*').order('created_at',{ascending:false});
    const filter = document.getElementById('campaignFilter');
    filter.innerHTML = `<option value="all">All Campaigns</option>`;
    campaigns.forEach(c => filter.innerHTML += `<option value="${c.id}">${c.name}</option>`);
  }

  async fetchStats() {
    const { data: campaigns } = await supabase.from('campaigns').select('*').order('created_at',{ascending:false});
    const { data: deliveries } = await supabase.from('deliveries').select('*');
    return { campaigns: campaigns||[], deliveries: deliveries||[] };
  }

  applyFilters(deliveries) {
    const campaignId = document.getElementById('campaignFilter').value;
    const timeVal = document.getElementById('timeFilter').value;
    const now = new Date();
    let filtered = deliveries;
    if(campaignId!=='all') filtered = filtered.filter(d=>d.campaign_id===campaignId);
    if(timeVal!=='all') filtered = filtered.filter(d=>new Date(d.sent_at)>=new Date(now-timeVal*24*60*60*1000));
    return filtered;
  }

  async updateDashboardMetrics() {
    const { campaigns, deliveries } = await this.fetchStats();
    const filteredDeliveries = this.applyFilters(deliveries);

    document.getElementById("stat-sent").textContent = filteredDeliveries.length;
    document.getElementById("stat-opened").textContent = filteredDeliveries.filter(d=>d.opened).length;
    document.getElementById("stat-clicked").textContent = filteredDeliveries.filter(d=>d.clicked).length;
    document.getElementById("stat-creds").textContent = filteredDeliveries.filter(d=>d.credential_submitted).length;
    document.getElementById("stat-reported").textContent = filteredDeliveries.filter(d=>d.reported).length;

    const tbody = document.getElementById("campaigns-body"); tbody.innerHTML='';
    const campaignStats = campaigns.map(c=>{
      const cDel = filteredDeliveries.filter(d=>d.campaign_id===c.id);
      const clickedPct = cDel.length?Math.round(cDel.filter(d=>d.clicked).length/cDel.length*100):0;
      const reportedPct = cDel.length?Math.round(cDel.filter(d=>d.reported).length/cDel.length*100):0;
      return {...c, clickedPct, alert: clickedPct>20 && reportedPct<5};
    }).sort((a,b)=>b.clickedPct-a.clickedPct);

    campaignStats.forEach(c=>{
      tbody.innerHTML+=`<tr>
        <td>${c.name}</td><td>${c.type}</td>
        <td>${new Date(c.start_at).toLocaleDateString()}</td>
        <td>${new Date(c.end_at).toLocaleDateString()}</td>
        <td>${c.clickedPct}%</td>
        <td>${c.alert?'<span class="alert">⚠ High Risk</span>':''}</td>
      </tr>`;
    });

    await this.setupCharts(filteredDeliveries);
  }

  async setupCharts(filteredDeliveries) {
    // Monthly Trends
    const monthly = groupByMonth(filteredDeliveries);
    const labels = Object.keys(monthly);
    const opened = labels.map(m=>monthly[m].opened);
    const clicked = labels.map(m=>monthly[m].clicked);
    const reported = labels.map(m=>monthly[m].reported);
    const ctx1 = document.getElementById('improvementChart').getContext('2d');
    if(this.improvementChart)this.improvementChart.destroy();
    this.improvementChart=new Chart(ctx1,{
      type:'line',
      data:{ labels, datasets:[
        {label:'Opened', data:opened, borderColor:'#1FB8CD', fill:false, tension:0.3},
        {label:'Clicked', data:clicked, borderColor:'#FFC185', fill:false, tension:0.3},
        {label:'Reported', data:reported, borderColor:'#FF6B6B', fill:false, tension:0.3}
      ]},
      options:{responsive:true, maintainAspectRatio:false, plugins:{title:{display:true,text:'Monthly Engagement Trends'}}}
    });

    // Conversion Funnel
    const funnelData=[
      filteredDeliveries.length,
      filteredDeliveries.filter(d=>d.opened).length,
      filteredDeliveries.filter(d=>d.clicked).length,
      filteredDeliveries.filter(d=>d.credential_submitted).length,
      filteredDeliveries.filter(d=>d.reported).length
    ];
    const ctxFunnel=document.getElementById('funnelChart').getContext('2d');
    if(this.funnelChart)this.funnelChart.destroy();
    this.funnelChart=new Chart(ctxFunnel,{
      type:'bar', data:{ labels:['Sent','Opened','Clicked','Creds Submitted','Reported'], datasets:[{data:funnelData, backgroundColor:['#1FB8CD','#FFC185','#FF6B6B','#9F7AEA','#34D399']}]},
      options:{indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{title:{display:true,text:'Conversion Funnel'}}, scales:{x:{beginAtZero:true}}}
    });

    // Heatmap by hour
    const heatmapHours=Array(24).fill(0);
    filteredDeliveries.forEach(d=>{
      const hour = new Date(d.sent_at).getHours();
      if(d.clicked) heatmapHours[hour]++;
    });
    const ctxHeat=document.getElementById('heatmapChart').getContext('2d');
    if(this.heatmapChart)this.heatmapChart.destroy();
    this.heatmapChart=new Chart(ctxHeat,{
      type:'bar',
      data:{ labels:[...Array(24).keys()].map(h=>`${h}:00`), datasets:[{label:'Clicks', data:heatmapHours, backgroundColor:'#FF6B6B'}]},
      options:{responsive:true, maintainAspectRatio:false, plugins:{title:{display:true,text:'Click Engagement by Hour'}}, scales:{y:{beginAtZero:true}}}
    });

    // Department Analytics
    const deptData={}; filteredDeliveries.forEach(d=>{
      if(!deptData[d.department])deptData[d.department]={opened:0,clicked:0,reported:0};
      if(d.opened)deptData[d.department].opened++;
      if(d.clicked)deptData[d.department].clicked++;
      if(d.reported)deptData[d.department].reported++;
    });
    const deptLabels=Object.keys(deptData);
    const deptOpened=deptLabels.map(l=>deptData[l].opened);
    const deptClicked=deptLabels.map(l=>deptData[l].clicked);
    const deptReported=deptLabels.map(l=>deptData[l].reported);
    const ctxDept=document.getElementById('departmentChart').getContext('2d');
    if(this.departmentChart)this.departmentChart.destroy();
    this.departmentChart=new Chart(ctxDept,{
      type:'bar',
      data:{ labels:deptLabels, datasets:[
        {label:'Opened', data:deptOpened, backgroundColor:'#1FB8CD'},
        {label:'Clicked', data:deptClicked, backgroundColor:'#FFC185'},
        {label:'Reported', data:deptReported, backgroundColor:'#FF6B6B'}
      ]},
      options:{responsive:true, maintainAspectRatio:false, plugins:{title:{display:true,text:'Department Analytics'}}, scales:{y:{beginAtZero:true}}}
    });

    // Device Distribution
    const deviceCounts={mobile:0,desktop:0};
    filteredDeliveries.forEach(d=>deviceCounts[d.meta.device]++);
    const ctxDev=document.getElementById('deviceChart').getContext('2d');
    if(this.deviceChart)this.deviceChart.destroy();
    this.deviceChart=new Chart(ctxDev,{
      type:'pie',
      data:{ labels:['Mobile','Desktop'], datasets:[{data:[deviceCounts.mobile,deviceCounts.desktop], backgroundColor:['#1FB8CD','#FFC185']}]},
      options:{plugins:{title:{display:true,text:'Device Distribution'}}}
    });

    // Comparative Radar
    const ctxComp=document.getElementById('comparativeChart').getContext('2d');
    if(this.comparativeChart)this.comparativeChart.destroy();
    this.comparativeChart=new Chart(ctxComp,{
      type:'radar',
      data:{
        labels:deptLabels,
        datasets:[
          {label:'Opened', data:deptOpened, backgroundColor:'rgba(31,184,205,0.2)', borderColor:'#1FB8CD', fill:true},
          {label:'Clicked', data:deptClicked, backgroundColor:'rgba(255,193,133,0.2)', borderColor:'#FFC185', fill:true},
          {label:'Reported', data:deptReported, backgroundColor:'rgba(255,107,107,0.2)', borderColor:'#FF6B6B', fill:true}
        ]
      },
      options:{responsive:true, maintainAspectRatio:false, plugins:{title:{display:true,text:'Comparative Department Metrics'}}}
    });
  }

  async generatePDF() {
    // Ensure all data & charts are up-to-date
    await this.updateDashboardMetrics();

    // Select the section to capture
    const element = document.getElementById('historicalSection');

    // Use html2canvas to capture the element as image
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Header & footer height
    const headerHeight = 15; // mm
    const footerHeight = 10; // mm

    // Calculate image height to maintain aspect ratio
    const imgProps = canvas.width / canvas.height;
    const pdfImgHeight = pdfWidth / imgProps;

    let heightLeft = pdfImgHeight;
    let position = headerHeight;

    const totalPages = Math.ceil((pdfImgHeight + headerHeight + footerHeight) / pdfHeight);
    let pageNum = 1;

    while (heightLeft > 0) {
        // Add header
        pdf.setFontSize(12);
        pdf.setTextColor(40);
        pdf.text("SocialGuard Analytics Report", 10, 10);
        pdf.setFontSize(9);
        const dateStr = new Date().toLocaleString();
        pdf.text(`Generated on: ${dateStr}`, pdfWidth - 60, 10);

        // Add image
        const drawHeight = Math.min(heightLeft, pdfHeight - headerHeight - footerHeight);
        pdf.addImage(
            imgData,
            'PNG',
            0,
            position,
            pdfWidth,
            drawHeight
        );

        // Footer with page number
        pdf.setFontSize(8);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth - 30, pdfHeight - 5);

        heightLeft -= pdfHeight - headerHeight - footerHeight;
        position = headerHeight - heightLeft;

        if (heightLeft > 0) {
            pdf.addPage();
            pageNum++;
            position = headerHeight;
        }
    }

    pdf.save(`SocialGuard_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
}
}

const simulator = new SocialEngSimulator();

// Mode Toggle
document.getElementById('modeHistorical').onclick = ()=>{
  document.getElementById('historicalSection').style.display='block';
  document.getElementById('realtimeSection').style.display='none';
};
document.getElementById('modeRealtime').onclick = ()=>{
  document.getElementById('historicalSection').style.display='none';
  document.getElementById('realtimeSection').style.display='block';
};
