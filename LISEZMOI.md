# Site perso

Ouvrir `index.html` pour prévisualiser (marche hors ligne). Version anglaise : `index.html?lang=en` ou bouton EN.

## Fichiers

- `index.html` : contenu en français
- `i18n/en.js` : textes anglais (même clé `data-i18n` que dans `index.html`)
- `style.css`, `app.js`
- `data/portefeuilles.js` : PEA et compte-titres, à mettre à jour en fin de mois
- `fonts/` : Hanken Grotesk, fichier d'origine intégré tel quel (licence OFL)
- `photo/` : portrait + captures de QuinTerminal (liste plus bas)
- `video/` : démo de QuinTerminal (`quinterminal-demo.mp4`)
- `pdf/` : CV (l'icône d'onglet est intégrée dans `index.html`)

## Mettre à jour

**Portefeuilles** : remplir `releves` ou `rendements`, puis `indice`, l'allocation, et passer `donneesFictives` à `false`.

**Étude « Quand l’Asie est fermée »** : le bouton ouvre un e-mail de demande. Pour publier le PDF (après le retour d’Amundi), le déposer dans `pdf/` et remplacer le lien `#sa-request` par :

```html
<a class="btn btn-secondary btn-compact" href="pdf/Quand-l-Asie-est-fermee_Tom-Hennequin.pdf" download data-i18n="sa.cta">Télécharger l’étude (PDF)</a>
```

puis mettre `'sa.cta': 'Download the study (PDF)'` dans `i18n/en.js`.

**QuinTerminal, captures et démo** : déposer les fichiers sous ces noms exacts, rien d'autre à modifier.

| Fichier | Slide |
|---|---|
| `video/quinterminal-demo.mp4` | Démo (MP4 H.264, sans son) |
| `photo/quinterminal-oil.png` | Cockpit (sert aussi d'affiche à la vidéo) |
| `photo/quinterminal-map.png` | Carte |
| `photo/quinterminal-bal.png` | Bilan |
| `photo/quinterminal-flow.png` | Détroits |
| `photo/quinterminal-ref.png` | Raffinage |
| `photo/quinterminal-crv.png` | Courbe |
| `photo/quinterminal-opt.png` | Options |
| `photo/quinterminal-fcst.png` | Prévision |
| `photo/quinterminal-fcst-validation.png` | Validation |
| `photo/quinterminal-risk.png` | Risques |
| `photo/quinterminal-pos.png` | Positions |

Captures en PNG de 1600 × 900. Le site vérifie les fichiers à l'ouverture de la section : une capture absente retire sa slide, et la démo n'apparaît que si la vidéo existe (sa durée s'affiche toute seule). Sans aucune capture, chaque slide affiche le code et le nom de la fonction. Pour changer l'ordre ou les textes : les onglets `#qt-tabs` dans `index.html` (`data-src`, `data-desc`) et les clés `qt.*` dans `i18n/en.js`.

**QuinTerminal en ligne** : une fois déployé sur GitHub Pages, ajouter après la liste `.qt-features` :

```html
<p class="qt-cta"><a class="btn btn-secondary btn-compact" href="https://..." target="_blank" rel="noopener">Ouvrir QuinTerminal</a></p>
```

**CV anglais** : déposer `pdf/CV_Hennequin_Tom_EN.pdf` et renseigner `CV_EN` en haut de la partie Contact de `app.js`.

## Menu et recherche

Les rubriques du menu et leurs panneaux sont dans l'en-tête de `index.html` ; l'index mobile et le pied de page reprennent les mêmes liens.
La recherche (bouton « Rechercher » ou touche `/`) lit la liste `COMMANDS` d'`app.js` : un code, une ancre (`id`) ou une action, un libellé fr/en et des mots-clés.
Pour une nouvelle destination, ajouter une ligne dans `COMMANDS` et, si besoin, un lien dans le panneau, l'index mobile et le pied de page.
Le calendrier du panneau Parcours est dans `featureRenderers.parcours` (dates des études, des stages et du stage visé).

## Pricer

`priceAutocall()` dans `app.js` : Monte Carlo risque-neutre, 10 000 tirages + antithétiques, mêmes tirages pour tous les réglages.
Le prix est linéaire en coupon (P = A + c·B), d'où le coupon d'équilibre c = (100 − marge − A) / B.
Vérifié sur deux cas fermés : obligation à coupon fixe (coupon au pair) et rappel certain en année 1.
