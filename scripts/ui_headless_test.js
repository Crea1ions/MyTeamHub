const fs = require('fs');
const path = require('path');
async function run() {
  const { JSDOM } = require('jsdom');
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'ui', 'index.html'), 'utf-8');
  const appJs = fs.readFileSync(path.join(root, 'ui', 'js', 'app.js'), 'utf-8');

  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'http://10.0.0.1:3001/' });
  const { window } = dom;

  // expose fetch from node (global) to the JSDOM window and resolve relative URLs
  if (typeof global.fetch === 'function') {
    window.fetch = (input, init) => {
      const url = new URL(input, window.location.href).toString();
      return global.fetch(url, init);
    };
  }

  // polyfill console to forward logs
  window.console = console;

  // Make sure modules that expect document/window exist
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;

  // Inject app.js into the JSDOM document so it runs in the browser-like context
  const scriptEl = window.document.createElement('script');
  scriptEl.type = 'text/javascript';
  scriptEl.textContent = appJs;
  window.document.body.appendChild(scriptEl);

  // Give module script time to execute and attach event listeners
  await new Promise(r => setTimeout(r, 800));

  // Wait briefly for initial loadProjects() to attempt fetch
  await new Promise(r => setTimeout(r, 800));

  // Debug: output current project-list HTML
  console.log('PROJECT-LIST HTML:', window.document.getElementById('project-list')?.innerHTML);

  // Ensure there is exactly one agent card -> auto-select should occur on selectProject
  const agentList = window.document.querySelector('.agent-list');
  // remove all but first agent card
  const cards = Array.from(agentList.querySelectorAll('.agent-card'));
  cards.slice(1).forEach(c => c.remove());

  // fetch projects from server to pick an id
  const projectsResp = await window.fetch('/api/projects');
  let projects = [];
  try { projects = await projectsResp.json(); } catch (e) { console.error('projects fetch failed', e); }

  console.log('PROJECTS FROM FETCH:', projects);

  if (!projects || projects.length === 0) {
    console.error('no projects found from /api/projects — aborting test');
    process.exit(2);
  }

  const projectId = projects[0].id;

  // trigger a click on the project item to select it (selectProject is called by the click handler)
  const projectItem = window.document.querySelector(`.project-item[data-id="${projectId}"]`) || window.document.querySelector('.project-item');
  if (!projectItem) {
    console.error('no project item found in DOM to select');
    process.exit(2);
  }
  projectItem.click();

  // wait for UI updates
  await new Promise(r => setTimeout(r, 300));

  const messageInput = window.document.getElementById('message-input');
  const sendBtn = window.document.getElementById('btn-send');

  console.log('projectId used:', projectId);
  console.log('message-input disabled?:', messageInput.disabled);
  console.log('btn-send disabled?:', sendBtn.disabled);

  if (!messageInput.disabled && !sendBtn.disabled) {
    console.log('TEST PASS: input and send button enabled after selecting project with single agent.');
    process.exit(0);
  } else {
    console.error('TEST FAIL: controls remain disabled');
    process.exit(3);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
