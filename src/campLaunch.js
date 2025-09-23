 // 🔑 Replace with your own Supabase URL + Anon key
    const SUPABASE_URL = "https://xzgzgrhtgjhwiomclxqe.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3pncmh0Z2pod2lvbWNseHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzY4MjYsImV4cCI6MjA3Mjc1MjgyNn0.JdSCuhMfD3R3xL_Y7Dl647g9IWc5FqvZaIMXW6DwNAc";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Toast helper
    function showToast(msg, isError=false) {
      let el = document.getElementById('campaign-toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'campaign-toast';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.background = isError ? '#fee2e2' : '#ecfeff';
      el.style.color = isError ? '#991b1b' : '#065f46';
      clearTimeout(el._timer);
      el._timer = setTimeout(() => el.remove(), 4000);
    }

    async function createCampaign({ name, type, created_by=null, start_at=null, end_at=null }) {
  const now = new Date().toISOString();
  const payload = [{
    name,
    type,
    created_by: created_by || "system",   // or your user id/email
    start_at: start_at || now,
    end_at: end_at || new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    created_at: now
  }];

  const { data, error } = await supabase
    .from('campaigns')
    .insert(payload)
    .select()
    .limit(1);

  if (error) throw error;
  return data[0];
}


    document.querySelector('.launch-campaign-btn').addEventListener('click', async (e) => {
      const name = document.getElementById('campaign-name').value.trim();
      const type = document.getElementById('attack-type').value.trim();

      if (!name) return showToast('Please provide a campaign name', true);
      if (!type) return showToast('Please select an attack type', true);

      e.target.disabled = true;
      e.target.textContent = "Launching…";

      try {
        const created = await createCampaign({ name, type });
        showToast(`Campaign created: ${created.name}`);
      } catch (err) {
        console.error(err);
        showToast("Failed to create campaign: " + err.message, true);
      } finally {
        e.target.disabled = false;
        e.target.textContent = "Launch Campaign";
      }
    });