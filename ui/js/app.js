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

// Mobile toggle elements (may be null on non-mobile layouts)
const btnToggleProjects = document.getElementById('btn-toggle-projects');
const btnToggleContext = document.getElementById('btn-toggle-context');
const panelProjects = document.getElementById('panel-projects');

if (btnToggleProjects) {
    btnToggleProjects.addEventListener('click', () => {
        // Toggle overlay on mobile
        if (panelProjects.classList.contains('mobile-open')) {
            panelProjects.classList.remove('mobile-open');
            removeMobileBackdrop();
        } else {
            panelProjects.classList.add('mobile-open');
            addMobileBackdrop();
        }
    });
}

if (btnToggleContext) {
    // Initialize aria state
    btnToggleContext.setAttribute('aria-expanded', 'true');
    btnToggleContext.addEventListener('click', () => {
        const collapsed = elements.canvasContent.classList.toggle('collapsed');
        btnToggleContext.setAttribute('aria-expanded', String(!collapsed));
        // Update icon: show pencil when collapsed (to open), cross when expanded (to close)
        btnToggleContext.textContent = collapsed ? '📝' : '✖';
        console.log('[toggleContext] collapsed=', collapsed);
    });
}

function addMobileBackdrop() {
    if (document.getElementById('mobile-backdrop')) return;
    const d = document.createElement('div');
    d.id = 'mobile-backdrop';
    d.className = 'mobile-overlay-backdrop';
    d.addEventListener('click', () => {
        panelProjects.classList.remove('mobile-open');
        removeMobileBackdrop();
    });
    document.body.appendChild(d);
}

function removeMobileBackdrop() {
    const d = document.getElementById('mobile-backdrop');
    if (d) d.remove();
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    // Safely handle empty or non-JSON responses
    const text = await response.text();
    if (!text) return null;

    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
        try {
            return JSON.parse(text);
        } catch (e) {
            console.warn('[apiCall] invalid JSON response for', endpoint);
            return null;
        }
    }

    // Fallback: try parsing, otherwise return raw text
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

// Load Projects
async function loadProjects() {
    elements.projectList.innerHTML = '<div class="loading">Chargement...</div>';

    const data = await apiCall('/api/projects');
    if (!data || !Array.isArray(data)) {
        console.warn('[loadProjects] unexpected projects payload', data);
        state.projects = [];
    } else {
        state.projects = data;
    }

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
        item.addEventListener('click', () => {
            console.log('[renderProjects] project clicked', item.dataset.id);
            selectProject(item.dataset.id);
            // Ensure mobile overlay closes immediately after selection
            try { closeProjectsOverlay(); } catch (e) { console.warn('[renderProjects] closeProjectsOverlay failed', e); }
        });
    });
}

function closeProjectsOverlay() {
    if (panelProjects && panelProjects.classList.contains('mobile-open')) {
        panelProjects.classList.remove('mobile-open');
        removeMobileBackdrop();
        console.log('[closeProjectsOverlay] closed');
    }
}

// Select Project
async function selectProject(projectId) {
    state.currentProject = state.projects.find(p => p.id === projectId);
    state.messages = [];
    
    // Update UI
    renderProjects(elements.searchInput.value);
    elements.projectName.textContent = state.currentProject.name;

    console.log('[selectProject] selected', projectId, state.currentProject?.name);

    // If projects panel is open in mobile overlay, close it to reveal canvas/chat
    try {
        if (panelProjects && panelProjects.classList.contains('mobile-open')) {
            panelProjects.classList.remove('mobile-open');
            removeMobileBackdrop();
            console.log('[selectProject] closed mobile projects overlay');
        }
    } catch (e) {
        console.warn('[selectProject] panelProjects handling failed', e);
    }
    
    // Enable inputs
    // If there's only one agent card, auto-select it so input becomes active
    const agentCardsNow = document.querySelectorAll('.agent-card');
    if (!state.currentAgent && agentCardsNow.length === 1) {
        const onlyAgent = agentCardsNow[0].dataset.agent;
        if (onlyAgent) selectAgent(onlyAgent);
    }

    elements.messageInput.disabled = !state.currentProject || !state.currentAgent;
    elements.btnSend.disabled = !state.currentProject || !state.currentAgent;
    
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
            <div class="context-content">${escapeHtml(context)}</div>
            <div class="context-actions">
                <button id="btn-edit-context" class="btn-primary">Éditer</button>
            </div>
        </div>
        <div class="session-history" id="session-history"></div>
    `;

    // Attach edit handler
    const btnEdit = document.getElementById('btn-edit-context');
    if (btnEdit) {
        btnEdit.addEventListener('click', () => openContextEditor(context));
    }
}

// Escape HTML to prevent injection when rendering raw markdown/text
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\'/g, '&#039;');
}

// Open inline editor for the context
function openContextEditor(context) {
    const container = elements.canvasContent.querySelector('.context-display');
    if (!container) return;

    container.innerHTML = `
        <h3>Contexte</h3>
        <div class="context-editor">
            <textarea id="context-editor">${escapeHtml(context)}</textarea>
            <div class="context-actions">
                <button id="btn-save-context" class="btn-primary">Sauvegarder</button>
                <button id="btn-cancel-context" class="btn-secondary">Annuler</button>
            </div>
        </div>
    `;

    document.getElementById('btn-cancel-context').addEventListener('click', cancelContextEdit);
    document.getElementById('btn-save-context').addEventListener('click', saveContext);
}

function cancelContextEdit() {
    // Reload the current project context
    if (state.currentProject) selectProject(state.currentProject.id);
}

// Save context to server
async function saveContext() {
    const ta = document.getElementById('context-editor');
    if (!ta || !state.currentProject) return;

    const content = ta.value;
    const btn = document.getElementById('btn-save-context');
    btn.disabled = true;
    btn.textContent = 'Sauvegarde...';

    try {
        console.log('[saveContext] saving context for', state.currentProject.id);
        const res = await apiCall(`/api/context/${state.currentProject.id}`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });

        // Reload context after successful save
        await selectProject(state.currentProject.id);
        // Simple feedback
        alert('Contexte sauvegardé');
    } catch (e) {
        console.error('[saveContext] error', e);
        alert('Erreur lors de la sauvegarde');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Sauvegarder';
        }
    }
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

    // If agent cards are rendered/changed dynamically, ensure listeners attach
    function attachAgentCardListeners() {
        document.querySelectorAll('.agent-card').forEach(card => {
            card.removeEventListener('click', () => selectAgent(card.dataset.agent));
            card.addEventListener('click', () => selectAgent(card.dataset.agent));
        });
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
