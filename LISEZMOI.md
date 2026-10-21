# Site perso

Ouvrir `index.html` pour prévisualiser (marche hors ligne). Version anglaise : `index.html?lang=en` ou bouton EN.

## Fichiers

- `index.html` : contenu en français
- `i18n/en.js` : textes anglais (même clé `data-i18n` que dans `index.html`)
- `style.css`, `app.js`
- `data/portefeuilles.js` : PEA et compte-titres, à mettre à jour en fin de mois
- `fonts/` : Hanken Grotesk, fichier d'origine intégré tel quel (licence OFL)
- `photo/` : portrait + captures Quinterminal (`quinterminal-markets.png`, `-vol`, `-fx-rates`, `-news`, `-air-traffic`, `-maritime`)
- `pdf/` : CV et `favicon.ico`

## Mettre à jour

**Portefeuilles** : remplir `releves` ou `rendements`, puis `indice`, l'allocation, et passer `donneesFictives` à `false`.

**Études** : quand une note est prête, remplacer « En préparation » par la date et mettre le lien :

```html
<p class="study-links"><a href="pdf/etude-autocall.pdf">Lire la note (PDF)</a></p>
```

**Quinterminal en ligne** : ajouter dans `.project-text`, après la liste :

```html
<p><a class="btn btn-secondary btn-compact" href="https://..." target="_blank" rel="noopener">Ouvrir Quinterminal</a></p>
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
