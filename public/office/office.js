let newsIndex = 0;
let lastState = null;

async function refreshOffice() {
    try {
        const ts = Date.now();
        const [taskResp, cockpitResp] = await Promise.all([
            fetch(`tasks.json?t=${ts}`),
            fetch(`cockpit.json?t=${ts}`)
        ]);

        const tasks = await taskResp.json();
        const cockpit = await cockpitResp.json();
        
        updateAIClone(tasks, cockpit);
        updateCockpitUI(cockpit);
        updateBlueprintUI(cockpit.blueprint);
        updateSofaTasks(tasks);
        
        // Update Quota Monitor
        if (cockpit.quota_monitor) {
            updateQuotaMonitor(cockpit.quota_monitor);
        }
        
        // Inject Live News Feed
        if (cockpit.news_feed) {
            injectLiveNews(cockpit.news_feed);
        }
        
    } catch (e) {
        console.error("Failed to sync office state", e);
    }
}

function injectLiveNews(newsFeed) {
    const news = newsFeed[newsIndex];
    const msg = `[${news.category}] ${news.content}`;
    logTerminal(msg, "#00f2fe"); // News in Cyan
    
    newsIndex = (newsIndex + 1) % newsFeed.length;
}

function updateAIClone(tasks, cockpit) {
    const clone = document.getElementById('ai-clone');
    const bubble = clone.querySelector('.status-bubble');
    const ongoingTask = tasks.find(t => t.status === 'ongoing');
    
    const newState = ongoingTask ? 'working' : 'resting';
    
    if (newState !== lastState) {
        if (newState === 'working') {
            clone.className = 'ai-clone working';
            bubble.innerText = `Focusing: ${ongoingTask.title}`;
            logTerminal("STATE_CHANGE: MISSION DETECTED. RETURNING TO DESK.", "#ff00c1");
        } else {
            clone.className = 'ai-clone resting';
            bubble.innerText = "Recharging on Sofa...";
            logTerminal("STATE_CHANGE: IDLE. MOVING TO REST AREA.", "#ff00c1");
        }
        lastState = newState;
    }
}

function updateCockpitUI(cockpit) {
    const sf = cockpit.silicon_flow;
    const usageText = document.getElementById('sf-usage');
    const balanceText = document.getElementById('sf-balance');
    const progressBar = document.getElementById('sf-progress');
    
    if (usageText) usageText.innerText = `${sf.api_calls_count.toLocaleString()} / ${sf.quota_limit.toLocaleString()}`;
    if (balanceText) balanceText.innerText = `$${sf.balance_remaining.toFixed(2)}`;
    
    if (progressBar) {
        const percentage = (sf.api_calls_count / sf.quota_limit) * 100;
        progressBar.style.width = `${percentage}%`;
    }
}

function updateBlueprintUI(blueprint) {
    const container = document.getElementById('blueprint-content');
    if (!container) return;
    container.innerHTML = '';
    blueprint.milestones.forEach(m => {
        const item = document.createElement('div');
        item.className = `bp-item ${m.status}`;
        item.innerText = m.title;
        container.appendChild(item);
    });
}

function updateQuotaMonitor(quotaData) {
    const container = document.getElementById('quota-groups');
    if (!container) return;
    container.innerHTML = '';
    
    const creditsRow = document.createElement('div');
    creditsRow.className = 'quota-credits-row';
    creditsRow.innerHTML = '<span>Credits:</span><span class="credits-value">' + quotaData.credits.toLocaleString() + '</span>';
    container.appendChild(creditsRow);
    
    quotaData.groups.forEach(function(group) {
        const card = document.createElement('div');
        card.className = 'quota-group-card';
        
        const pct = group.usage_percent;
        let ringColor = '#4ade80';
        if (pct >= 100) ringColor = '#ef4444';
        else if (pct >= 80) ringColor = '#f59e0b';
        
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (pct / 100) * circumference;
        
        const statusClass = group.status === 'Healthy' ? 'status-healthy' : 'status-warn';
        
        let modelTags = '';
        group.models.forEach(function(m) {
            modelTags += '<span class="model-tag">' + m + '</span>';
        });
        
        card.innerHTML = '<div class="qg-header">' +
            '<span class="qg-name">' + group.name + '</span>' +
            '<span class="qg-toggle ' + (group.enabled ? 'on' : 'off') + '">' + (group.enabled ? 'ON' : 'OFF') + '</span>' +
            '</div>' +
            '<div class="qg-ring-row">' +
            '<svg class="qg-ring" width="54" height="54" viewBox="0 0 54 54">' +
            '<circle cx="27" cy="27" r="' + radius + '" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>' +
            '<circle cx="27" cy="27" r="' + radius + '" fill="none" stroke="' + ringColor + '" stroke-width="4"' +
            ' stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"' +
            ' stroke-linecap="round" transform="rotate(-90 27 27)"' +
            ' style="transition: stroke-dashoffset 1s ease;"/>' +
            '</svg>' +
            '<span class="qg-pct" style="color: ' + ringColor + '">' + pct.toFixed(0) + '%</span>' +
            '</div>' +
            '<div class="qg-details">' +
            '<div class="qg-detail-row"><span>Reset In</span><span>' + group.reset_in + '</span></div>' +
            '<div class="qg-detail-row"><span>Status</span><span class="' + statusClass + '">' + group.status + '</span></div>' +
            '</div>' +
            '<div class="qg-models">' + modelTags + '</div>';
        container.appendChild(card);
    });
}


function updateSofaTasks(tasks) {
    const ongoingList = document.getElementById('ongoing-tasks');
    const plannedList = document.getElementById('planned-tasks');
    const completedList = document.getElementById('completed-tasks');
    
    if (!ongoingList || !plannedList || !completedList) return;
    
    ongoingList.innerHTML = '';
    plannedList.innerHTML = '';
    completedList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerText = task.title || task.task;
        
        if (task.status === 'ongoing') {
            ongoingList.appendChild(li);
        } else if (task.status === 'next') {
            plannedList.appendChild(li);
        } else if (task.status === 'completed') {
            completedList.appendChild(li);
        }
    });
}


function logTerminal(msg, color = "#4ade80") {
    const logContainer = document.getElementById('log-content');
    if (!logContainer) return;
    
    const entry = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="opacity: 0.5">[${time}]</span> <span style="color: ${color}">${msg}</span>`;
    
    logContainer.appendChild(entry);
    
    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Keep only last 50 lines
    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = Math.random() * 100 + 'vh';
        p.style.animationDuration = (Math.random() * 10 + 5) + 's';
        p.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(p);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    const modal = document.getElementById('welcome-modal');
    const enterBtn = document.getElementById('enter-btn');
    if (enterBtn && modal) {
        enterBtn.addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                logTerminal("USER_CONNECTED: ACCESS GRANTED.", "#fff");
            }, 500);
        });
    }
    refreshOffice();
    setInterval(refreshOffice, 5000); 
});
