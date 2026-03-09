# Hotfix de navigation (PR en conflit)

Si GitHub affiche un conflit sur `index.html`, applique uniquement le hotfix JS minimal (1 ligne) au lieu de merger toute la PR.

## Option A — cherry-pick du commit

```bash
git checkout <ta-branche-cible>
git cherry-pick d7df7f3
```

Si un conflit apparaît quand même, prends l'option B.

## Option B — patch manuel (recommandé en urgence)

Dans `index.html`, dans `renderNotebookPage()`, remplace :

```js
+ '<label class="notes-field-label" for="notebook-apply-' + note.resourceId + '">Comment je vais l'appliquer</label>'
```

par :

```js
+ '<label class="notes-field-label" for="notebook-apply-' + note.resourceId + '">Comment je vais l\'appliquer</label>'
```

Puis vérifie la syntaxe JS :

```bash
node --check <(python - <<'PY'
from pathlib import Path
import re
s=Path('index.html').read_text()
print(re.findall(r'<script>([\s\S]*?)</script>', s)[1])
PY
)
```
