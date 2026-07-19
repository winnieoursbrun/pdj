# PDJ26 — Récapitulatif des features

Bilan de toutes les fonctionnalités intégrées dans l'application depuis le début du projet,
pensé pour être réutilisé comme base de départ pour de prochaines applications du même type
(PWA d'événement / festival, 100 % statique, sans backend), suivi du backlog des idées à
développer plus tard.

Stack : React + Vite + TypeScript, PWA mobile-only déployée sur GitHub Pages,
CSS vanilla avec design tokens, tests Vitest (jsdom), lint oxlint.

---

## 1. Socle PWA & offline

- **PWA installable** via `vite-plugin-pwa` (service worker + manifest générés au build).
  L'app fonctionne 100 % offline une fois installée : tous les assets (dont la police
  Bricolage Grotesque auto-hébergée via @fontsource) sont précachés (`globPatterns` workbox
  dans `vite.config.ts`).
- **Bouton d'installation** (`src/hooks/useInstallPrompt.ts`) : capte `beforeinstallprompt`
  sur Android/desktop ; sur iOS, où l'événement n'existe pas, affiche un guide d'installation
  manuel (Partager → Sur l'écran d'accueil).
- **Robustesse** : l'échec d'enregistrement du service worker est attrapé au lieu de faire
  planter l'app.
- **Déploiement continu** : push sur `main` → workflow GitHub Actions → GitHub Pages
  (`.github/workflows/deploy.yml`), avec `base` Vite aligné sur le nom du repo.

## 2. Navigation & shell

- **Shell à 5 onglets** (`src/App.tsx`) : Plan, Programme, Timeline (favoris), Prépa, Infos —
  tab bar fixe en bas, badge du nombre de favoris sur l'onglet Timeline.
- **Routing par onglet basé sur l'historique** (`#/program`, `#/timeline`…) : le bouton
  retour Android navigue entre les onglets au lieu de fermer la PWA.
- **Stabilité mobile** : hauteur en `100svh` (et non `100dvh`) pour que la tab bar ne saute
  pas quand la barre d'URL du navigateur se rétracte au scroll.
- **Lien d'invitation profond** : un hash `#join=CODE` ouvre directement la timeline avec le
  panneau de groupe pré-rempli (voir § groupes).

## 3. Programme & données

- **Données extraites du PDF officiel** (24 pages) versionnées dans `sources/` (PDF, texte
  `pdftotext`, analyse de palette). 66 événements dans `src/data/events.json`
  (`{id, title, artist, day, start, end, venue, category, subtype, description,
  recommendations?, speakers?}`), 9 catégories, 23 points du plan dans `src/data/venues.json`.
- **Onglet Programme** (`src/tabs/ProgramTab.tsx`) : filtres par jour et par catégorie ;
  le jour sélectionné est persisté (on rouvre l'app sur le jour où on était).
- **Règle horaire festival** : les horaires < 05:00 appartiennent à la fin de nuit du jour de
  grille (`timeMinutes()` dans `src/lib/schedule.ts`) — indispensable pour trier correctement
  un programme qui déborde après minuit. `eventStartDate()` recalcule la vraie date
  calendaire d'un événement (utilisé par les rappels).
- **Fiches événement enrichies** : recommandations musicales (« tu aimeras si tu aimes »)
  pour les concerts, bios des intervenant·es pour les conférences.
- **Météo des 3 jours** (`src/lib/weather.ts`, `src/hooks/useWeather.ts`) : prévision
  Open-Meteo (API gratuite sans clé), affichée en icône + température par jour dans le
  Programme, avec cache localStorage pour l'offline.

## 4. Favoris & timeline

- **Favoris** (`src/hooks/useFavorites.ts`) : `Set<string>` d'ids persisté en localStorage.
  Élément signature : le bouton favori est un **parapluie qui s'ouvre** (`Umbrella.tsx`),
  pas une étoile.
- **Onglet Timeline** (`src/tabs/TimelineTab.tsx`) : les favoris triés chronologiquement,
  c'est le « mon programme » de l'utilisateur.
- **Scroll auto vers le prochain événement** à l'ouverture de la timeline (et re-scroll si on
  y reste), en ignorant les animations « en continu » sans horaire pour ne pas bloquer le
  scroll.
- **Horloge partagée** `src/hooks/useNow.ts` + `isEventOngoing()` pour tout ce qui dépend de
  « maintenant » (événement en cours, présence, scroll).

## 5. Groupes de copains (partage sans backend)

Spec : `docs/superpowers/specs/2026-07-08-group-timeline-design.md`. Timeline partagée entre
amis **sans aucun serveur à héberger** :

- **Code de groupe humain** `MOT-NN` (`src/lib/group.ts`) → dérivation PBKDF2 → clé AES-GCM
  + tag de discussion. Les relais ne voient jamais le code ni les données en clair.
- **Transport Nostr** (`src/lib/nostr.ts`) : 4 relais publics, événements remplaçables
  NIP-78 (kind 30078) — un event par membre, écrasé à chaque mise à jour.
- **État par membre chiffré** `{name, favorites, updatedAt, at?}` (`src/hooks/useGroup.ts`),
  fusion par union → `friendsByEvent`, cache localStorage, identité stable par appareil
  (clé secrète `pdj26-group-sk`).
- **UI** (`src/components/GroupPanel.tsx`) : créer/rejoindre un groupe, partage par QR code
  (`uqr`) et lien `#join=CODE`.
- **Favoris des amis dans la timeline** : bouton « Voir les favoris de mes amis » (actif par
  défaut) qui fusionne leurs événements avec des pastilles de pseudo.
- **Présence « j'y suis »** (`PresenceButton` dans `GroupBadges.tsx`) : sur un événement en
  cours (fenêtre 15 min avant le début → 15 min après la fin), publier où l'on est ; la
  pastille d'un ami présent passe en jaune avec un pin et remonte en tête de liste. Un seul
  événement à la fois, persisté localement.

## 6. Rappels de notification (sans serveur push)

Spec : `docs/superpowers/specs/2026-07-08-event-reminders-design.md`, plan :
`docs/superpowers/plans/2026-07-08-event-reminders.md`.

- **`setTimeout` locaux** 15 min avant chaque favori (`src/hooks/useReminders.ts`) — pas de
  push serveur, la PWA est 100 % statique. Rattrapage au retour au premier plan
  (`visibilitychange`), dédoublonnage (`pdj26-reminders-notified`).
- **Machine d'état** `ReminderStatus` (`unsupported`/`default`/`denied`/`enabled`/`disabled`)
  pilotée par la permission Notification + un opt-in localStorage.
- **UX d'activation** : bannière d'incitation une seule fois dans la Timeline
  (`ReminderBanner.tsx`), interrupteur dans la FAQ (`ReminderToggle.tsx`), notification de
  confirmation immédiate à l'activation (feedback que ça marche).
- **Limite connue** : dépend du fait que l'app tourne (au moins en arrière-plan récent) —
  voir backlog § backend de notifications.

## 7. Onglet Prépa

- **Compte à rebours** jusqu'au festival (`Countdown.tsx`, `useCountdown.ts`).
- **Comment venir** : adresse du site + lien carte universel (fonctionne iOS/Android sans
  imposer une appli de plans), infos Transhumance à vélo.
- **Checklist valise** (`usePackingList.ts`) : liste de choses à emporter cochable,
  persistée en localStorage.

## 8. Mes billets (import local du pass)

- **Import d'une photo du billet** (`src/hooks/useTickets.ts`) : décodage du QR code via
  `jsqr` (canvas redimensionné à 1600 px max) — seule la **valeur texte** décodée est
  stockée, jamais la photo. Plusieurs billets possibles (festival, camping…).
- **Affichage plein écran** d'un QR régénéré proprement via `uqr` (`TicketsCard.tsx` dans
  l'onglet Plan), renommage/suppression des billets.

## 9. Plan du site & infos pratiques

- **Plan zoomable** (`src/tabs/MapTab.tsx`, react-zoom-pan-pinch) : page plan du PDF rendue
  en PNG 200 dpi, légende des 23 points groupés (programmation, accueil, bien-être, vente).
- **Onglet Infos/FAQ** (`src/tabs/FaqTab.tsx`) : infos pratiques du festival en accordéons
  par catégorie (`src/data/faq.json` : tarifs, horaires, accessibilité, camping…) + une
  section « L'application » codée en dur (offline, installation, favoris, rappels).

## 10. Observabilité & mesure d'usage

- **Sentry** (`src/lib/sentry.ts`) : erreurs, tracing, session replay, logs ; upload des
  source maps en CI (no-op sans token en local).
- **Métriques produit** : `app.open` (avec `display_mode` standalone vs browser pour mesurer
  les installations PWA), `tab.view` par onglet, `favorite.toggle` enrichi de l'événement,
  compteurs `reminders.*`.
- **Utilisateurs uniques sans données personnelles** : UUID anonyme stable par appareil
  (`getDeviceId()`, localStorage) attaché via `Sentry.setUser({id})`.
- **GoatCounter** en complément pour un comptage de pages simple.

## 11. Qualité

- **Suite de tests Vitest** en 3 priorités : P1 logique cœur (schedule, favoris, Programme,
  Timeline), P2 shell/EventCard/adresse/plan, P3 billets/météo/bannière rappels — plus les
  tests unitaires des hooks et libs (groupe, rappels, météo…).
- **Docs de conception avant les features non triviales** (`docs/superpowers/{specs,plans}/`) :
  contexte, architecture, cas limites, plan de tests. À imiter pour toute nouvelle feature
  de cette taille.

## Patterns réutilisables pour une prochaine app

- PWA statique GitHub Pages = zéro coût d'hébergement, offline complet, mais tout l'état vit
  en localStorage (préfixer les clés par app, ex. `pdj26-*`).
- Partage temps réel **sans backend** : relais Nostr publics + chiffrement dérivé d'un code
  humain — le serveur ne voit rien, rien à héberger, rien à maintenir.
- Notifications locales par `setTimeout` + rattrapage `visibilitychange` : suffisant pour un
  événement de 3 jours, à remplacer par du push serveur si l'usage l'exige.
- Import de QR par photo → ne stocker que la valeur décodée, régénérer le QR à l'affichage.
- Identité visuelle extraite du support papier officiel (palette, contours, ombres sticker)
  → l'app semble « officielle » sans designer dédié.
- Sentry metrics + UUID anonyme par appareil = mesure d'usage honnête sans cookie ni donnée
  personnelle.

---

## Backlog — à faire plus tard

### Multi-groupes avec sélecteur de timeline

Aujourd'hui on ne peut appartenir qu'à **un seul groupe** (`pdj26-group` stocke un seul
code). Évolution souhaitée :

- Pouvoir **rejoindre/créer plusieurs groupes** en parallèle (ex. « les copains », « la
  famille », « les collègues »), chacun avec son code `MOT-NN` et sa clé.
- Un **sélecteur de groupe** (dans la Timeline et/ou le GroupPanel) pour choisir quel(s)
  groupe(s) alimentent la timeline : afficher les favoris/présence d'un groupe donné, de
  plusieurs, ou de tous.
- Points d'attention : migrer le localStorage (`pdj26-group` → liste de groupes), un
  abonnement Nostr par groupe (multiplexer les souscriptions sur les mêmes relais), garder
  une identité (`pdj26-group-sk`) et un pseudo par groupe ou global, désambiguïser les
  pastilles quand deux groupes contiennent la même personne.

### Récapitulatif de l'événement (à préparer en amont)

Préparer dès maintenant la partie « bilan de ton festival » à afficher/générer après (ou
pendant) l'événement :

- S'appuyer sur les données déjà locales : favoris, présences « j'y suis » horodatées,
  groupe, billets importés — et enrichir la collecte si besoin (historique des présences
  plutôt qu'une seule à la fois, horodatage des favoris).
- Contenu envisagé : nombre de concerts vus, heures de programme suivies, catégories
  préférées, moments partagés avec le groupe, artistes découverts.
- Format : écran partageable (image générée type « wrapped », QR/lien), 100 % local pour
  rester sans backend.
- À préparer en amont car le récap n'est possible que si les bonnes données sont
  **collectées pendant** le festival.

### Notification quand quelqu'un rejoint le groupe

- Détecter l'arrivée d'un nouveau membre (nouvel event Nostr d'un pubkey inconnu dans
  `useGroup`) et déclencher une notification locale « X a rejoint le groupe ».
- Réutiliser l'infra des rappels (permission, statut, dédoublonnage) ; respecter l'opt-in
  notifications existant.
- Limite : ne fonctionne que si l'app est ouverte/au premier plan au moment de la détection —
  vraie solution avec le point suivant.

### Backend de notifications (push serveur)

Sortir les notifications du modèle « l'app doit tourner » :

- **Web Push** (VAPID) via le service worker : les notifications arrivent app fermée.
  Nécessite un petit backend pour stocker les subscriptions et envoyer les pushes
  (Cloudflare Workers / Deno Deploy / petite lambda — rester minimal et bon marché).
- Cas d'usage : rappels d'événements favoris fiables, arrivée d'un membre dans le groupe,
  annonces du festival (changement d'horaire, alerte météo).
- Points d'attention : rester compatible avec la philosophie « zéro donnée personnelle »
  (ne stocker que subscription + ids d'événements/groupe chiffrés ou hachés), gérer le
  support iOS (Web Push OK depuis iOS 16.4, PWA installée uniquement), garder le mode
  dégradé 100 % local si l'utilisateur refuse.
