# PDJ26 — Programme des Pluies de Juillet

PWA mobile-only (React + Vite + TS) du programme du festival Les Pluies de Juillet 2026 (17–19 juillet, Champrepus). Déployée sur GitHub Pages : https://winnieoursbrun.github.io/pdj/

## Commandes

```bash
npm run dev        # dev server
npm run build      # tsc -b && vite build (+ génération SW/manifest via vite-plugin-pwa)
npm run preview    # sert dist/ en local
```

Déploiement : push sur `main` → workflow `.github/workflows/deploy.yml` → GitHub Pages (build type "workflow"). Le `base: '/pdj/'` dans `vite.config.ts` doit correspondre au nom du repo.

## Architecture

- `src/App.tsx` — shell : header (+ bouton installation PWA), 4 onglets, tab bar fixe en bas
- `src/tabs/` — `MapTab` (plan zoomable via react-zoom-pan-pinch + légende), `ProgramTab` (filtres jour/catégorie), `TimelineTab` (favoris chronologiques), `FaqTab` (infos pratiques + FAQ appli, accordéons par catégorie)
- `src/hooks/useFavorites.ts` — favoris = `Set<string>` d'ids, persisté en localStorage (`pdj26-favorites`)
- `src/hooks/useInstallPrompt.ts` — capte `beforeinstallprompt` ; sur iOS affiche un guide manuel
- `src/lib/schedule.ts` — constantes jours/catégories, tri chronologique
- `src/index.css` — tout le style, CSS vanilla avec design tokens

## Données (source : PDF officiel du programme)

Sources conservées dans `sources/` : `programme.pdf` (PDF officiel 24 pages, téléchargé depuis https://cdn.prod.website-files.com/632afd0e6e467cd2f4ef953f/6a354222a5d8c3d33248c54e_PDJ26%20-%20PROGRAMME.pdf), `programme.txt` (texte extrait par pdftotext — attention : les grilles horaires samedi/dimanche, pages 6–7, sont en paysage et leur texte est brouillé, croiser avec le rendu visuel du PDF), `palette.md` (analyse de l'identité visuelle du programme papier, base des design tokens de `index.css`).

- `src/data/events.json` — 66 événements. Schéma : `{id, title, artist, day: "ven"|"sam"|"dim", start: "HH:MM", end, venue, category, subtype, description}`. 9 catégories : concert, bal, spectacle, conference, atelier, imaginarium, balade, radio, famille.
- `src/data/venues.json` — les 23 points du plan (`{num, name, group}`), groupes : programmation, accueil, bienetre, vente.
- `public/map.png` — page 3 du PDF rendue en PNG 200 dpi (`pdftoppm`).
- `src/data/faq.json` — infos pratiques du festival en FAQ : `{id, category, question, answer}[]`, extraites des pages 21 (accessibilité/Lieu Sûr), 22 (Transhumance à vélo) et 24 (tarifs, horaires, paiement, camping) du PDF. La section "L'application" (offline, installation, favoris) est codée en dur dans `FaqTab.tsx`, pas dans ce fichier — elle ne dépend pas du PDF.

Règle de tri importante : les horaires < 05:00 sont la fin de nuit du jour de grille (ex. le set de 00h40 appartient au vendredi) — voir `timeMinutes()` dans `schedule.ts`.

Particularités des données : les « Animations surprises » du samedi soir n'ont pas d'horaires publiés ; les stands du village sont classés en catégorie `atelier` (subtype « stands du village »).

Si le festival publie une V2 du PDF : re-parser le PDF (idéalement via subagent), régénérer `events.json`/`venues.json` en respectant le schéma ci-dessus, ré-extraire la carte si elle change (`pdftoppm -png -f 3 -l 3 -r 200`), push.

## Design

Identité reprise du programme papier : écru `#f2ede2`, rose `#f49bc1`, jaune `#ffd02e`, contours noirs 2px, ombres « sticker » décalées (`--sticker`). Display : Bricolage Grotesque (auto-hébergée via @fontsource, requis pour l'offline). Dark mode via `prefers-color-scheme`. Élément signature : le bouton favori est un parapluie qui s'ouvre — ne pas le remplacer par une étoile.

L'app doit rester 100 % offline une fois installée : tout asset ajouté doit être précaché (vérifier les `globPatterns` du workbox dans `vite.config.ts`).
