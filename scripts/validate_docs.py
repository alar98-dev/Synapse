import os

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DOCS = os.path.join(BASE, 'docs')

required = [
    'index.md', 'architecture.md', 'cae-prompts.md', 'cae-api.md', 'deploy.md', 'plan.md'
]

missing = []
for name in required:
    if not os.path.exists(os.path.join(DOCS, name)):
        missing.append(name)

# Check index links (skip checking index.md itself)
with open(os.path.join(DOCS, 'index.md'), 'r', encoding='utf-8') as f:
    index_content = f.read()

unreferenced = []
for name in required:
    if name == 'index.md':
        continue
    if name not in index_content:
        unreferenced.append(name)

# Check prompt templates
prompts_dir = os.path.join(DOCS, 'prompts')
prompts_ok = os.path.isdir(prompts_dir) and any(os.scandir(prompts_dir))

print('DOCS VALIDATION REPORT')
print('Base:', DOCS)
print('')
if missing:
    print('MISSING FILES:')
    for m in missing:
        print(' -', m)
else:
    print('All required docs present ✅')

if unreferenced:
    print('\nUNREFERENCED IN index.md:')
    for u in unreferenced:
        print(' -', u)
else:
    print('\nAll required docs are referenced in index.md ✅')

print('\nPrompts directory exists and non-empty:' , prompts_ok)

# Simple markdown sanity: make sure none of the docs are empty
empty_files = []
for root, dirs, files in os.walk(DOCS):
    for fname in files:
        path = os.path.join(root, fname)
        if os.path.getsize(path) == 0:
            empty_files.append(os.path.relpath(path, DOCS))

if empty_files:
    print('\nEmpty files found:')
    for e in empty_files:
        print(' -', e)
else:
    print('\nNo empty files found ✅')

if missing or unreferenced or not prompts_ok or empty_files:
    exit(2)
else:
    exit(0)
