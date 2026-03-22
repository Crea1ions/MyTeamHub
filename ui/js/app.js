// MyTeamHub - Main App
const API_BASE = ''; // Same origin

// State
const state = {
    projects: [],
    currentProject: null,
    currentAgent: null,
    messages: [],
    loading: false
};

// DOM Elements
const elements = {
    projectList: document.getElementById('project-list'),
    searchInput: document.getElementById('search-projects'),
    canvasContent: document.getElementById('canvas-content'),
    projectName: document.getElementById('current-project-name'),
    agentMessages: document.getElementById('agent-messages'),
    messageInput: document.getElementById('message-input'),
    btnSend: document.getElementById('btn-send'),
    btnNewProject: document.getElementById('btn-new-project'),
    agentCards: document.querySelectorAll('.agent-card')
};

// API Functions
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    return response.json();
}

// Load Projects
async function loadProjects() {
    elements.projectList.innerHTML = '<div class="loading">Chargement...</div>';
    
    const data = await apiCall('/api/projects');
    state.projects = data;
    
    renderProjects();
}

// Render Projects
function renderProjects(filter = '') {
    const filtered = state.projects.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filtered.length === 0) {
        elements.projectList.innerHTML = '<div class="loading">Aucun projet</div>';
        return;
    }
    
    elements.projectList.innerHTML = filtered.map(project => `
        <div class="project-item ${state.currentProject?.id === project.id ? 'active' : ''}" 
             data-id="${project.id}">
            <span class="emoji">📁</span>
            <span class="name">${project.name}</span>
            <span class="status new"></span>
        </div>
    `).join('');
    
    // Add click handlers
    elements.projectList.querySelectorAll('.project-item').forEach(item => {
        item.addEventListener('click', () => selectProject(item.dataset.id));
    });
}

// Select Project
async function selectProject(projectId) {
    state.currentProject = state.projects.find(p => p.id === projectId);
    state.messages = [];
    
    // Update UI
    renderProjects(elements.searchInput.value);
    elements.projectName.textContent = state.currentProject.name;
    
    // Enable inputs
    elements.messageInput.disabled = !state.currentAgent;
    elements.btnSend.disabled = !state.currentAgent;
    
    // Load context
    const context = await apiCall(`/api/context/${projectId}`);
    renderContext(context);
}

// Render Context
function renderContext(context) {
    if (!context) {
        elements.canvasContent.innerHTML = `
            <div class="canvas-empty">
                <p>Aucun contexte pour ce projet</p>
            </div>
        `;
        return;
    }
    
    elements.canvasContent.innerHTML = `
        <div class="context-display">
            <h3>Contexte</h3>
            <div class="context-content">${context}</div>
        </div>
        <div class="session-history" id="session-history"></div>
    `;
}

// Select Agent
function selectAgent(agentId) {
    state.currentAgent = agentId;
    
    // Update UI
    elements.agentCards.forEach(card => {
        card.classList.toggle('active', card.dataset.agent === agentId);
    });
    
    elements.messageInput.disabled = !state.currentProject;
    elements.btnSend.disabled = !state.currentProject;
    
    if (state.currentProject) {
        elements.messageInput.focus();
    }
}

// Send Message
async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || !state.currentProject || !state.currentAgent) return;
    
    elements.messageInput.value = '';
    elements.btnSend.disabled = true;
    
    // Add user message
    addAgentMessage('user', message);
    
    // Show thinking
    const thinkingEl = addAgentMessage('system', '🤔 Réflexion en cours...');
    
    try {
        const response = await apiCall('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                projectId: state.currentProject.id,
                promptFile: `${state.currentAgent}.md`,
                message: message,
                model: 'minimax'
            })
        });
        
        // Remove thinking
        thinkingEl.remove();
        
        if (response.success) {
            addAgentMessage('assistant', response.data.message);
        } else {
            addAgentMessage('system', `Erreur: ${response.error}`);
        }
    } catch (e) {
        thinkingEl.remove();
        addAgentMessage('system', `Erreur: ${e.message}`);
    }
    
    elements.btnSend.disabled = false;
}

// Add Agent Message
function addAgentMessage(type, content) {
    const div = document.createElement('div');
    div.className = `agent-message ${type}`;
    div.textContent = content;
    elements.agentMessages.appendChild(div);
    elements.agentMessages.scrollTop = elements.agentMessages.scrollHeight;
    return div;
}

// Event Listeners
elements.searchInput.addEventListener('input', (e) => renderProjects(e.target.value));

elements.btnNewProject.addEventListener('click', async () => {
    const name = prompt('Nom du projet:');
    if (!name) return;
    
    await apiCall('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name })
    });
    
    await loadProjects();
});

elements.agentCards.forEach(card => {
    card.addEventListener('click', () => selectAgent(card.dataset.agent));
});

elements.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

elements.btnSend.addEventListener('click', sendMessage);

// Init
loadProjects();
