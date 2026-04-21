import re
import os

files = [
    'MarkdownLinkRenderer.module.css',
    'VaultFilePickerModal.module.css',
    'MetadataViewer.module.css',
    'GraphViewer.module.css',
    'VaultViewer.module.css',
    'TabPanel.module.css',
    'AgentsConfig.module.css',
    'MarkdownEditor.module.css',
    'SystemStatus.module.css',
    'KnowledgeGraphView.module.css',
    'ProjectExplorer.module.css',
    'APIConfig.module.css'
]

spacing_map = {
    0: 'var(--spacing-none, 0)',
    2: 'var(--spacing-xs, 2px)',
    4: 'var(--spacing-sm, 4px)',
    8: 'var(--spacing-md, 8px)',
    12: 'var(--spacing-lg, 12px)',
    16: 'var(--spacing-xl, 16px)',
    20: 'var(--spacing-2xl, 20px)',
    24: 'var(--spacing-3xl, 24px)',
    32: 'var(--spacing-4xl, 32px)',
    40: 'var(--spacing-5xl, 40px)',
    48: 'var(--spacing-6xl, 48px)'
}

icon_size_map = {
    14: 'var(--icon-size-xs, 14px)',
    16: 'var(--icon-size-sm, 16px)',
    20: 'var(--icon-size-md, 20px)',
    24: 'var(--icon-size-lg, 24px)',
    32: 'var(--icon-size-xl, 32px)'
}

def get_spacing(val):
    try:
        v = int(val)
        return spacing_map.get(v, f'{v}px')
    except: return f'{val}px'

def get_icon_size(val):
    try:
        v = int(val)
        return icon_size_map.get(v, f'{v}px')
    except: return f'{val}px'

def replace_px(match):
    prop = match.group(1)
    values_str = match.group(2)
    if prop in ['padding', 'margin', 'gap'] or 'padding-' in prop or 'margin-' in prop:
        parts = values_str.split()
        replaced = []
        for p in parts:
            m = re.match(r'^(\d+)px$', p)
            replaced.append(get_spacing(m.group(1)) if m else p)
        return f'{prop}: {" ".join(replaced)}'
    if prop in ['width', 'height']:
        m = re.match(r'^(\d+)px$', values_str.strip())
        if m:
            val = int(m.group(1))
            if val == 8: return f'{prop}: var(--scrollbar-width, 8px)'
            if val <= 40: return f'{prop}: {get_icon_size(val)}'
    return match.group(0)

tot_f, tot_r = 0, 0
for f_name in files:
    if not os.path.exists(f_name): continue
    with open(f_name, 'r') as f: content = f.read()
    pattern = r'((?:padding(?:-left|-right|-top|-bottom)?|margin(?:-left|-right|-top|-bottom)?|gap|width|height))\s*:\s*([^;]+)(?=;)'
    new_content, count = re.subn(pattern, replace_px, content)
    if count > 0:
        with open(f_name, 'w') as f: f.write(new_content)
        tot_f += 1; tot_r += count
        print(f'Refactored {f_name}: {count} replacements')
print(f'
Summary:
Total files refactored: {tot_f}
Total replacements count: {tot_r}')