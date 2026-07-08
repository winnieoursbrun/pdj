# Groupes d'amis — timeline partagée sans backend

Date : 2026-07-08

## Contexte et objectif

Partager sa timeline de favoris avec un groupe de copains : voir qui va à quoi en overlay sur le programme, et retrouver dans sa propre timeline les événements que ses amis ont mis en favori. PDJ est une PWA 100 % statique (GitHub Pages, aucun backend) : la synchro passe par des **relais Nostr publics** utilisés comme boîte aux lettres chiffrée (NIP-78, *Arbitrary custom app data*).

Itération V1 → V1.1 : la première version incluait un marquage « on y va ensemble » par événement (bouton + compteur). Retiré : l'utilisateur préférait retrouver directement dans « Ma timeline » les événements favoris de ses amis (avec un bouton pour les masquer/afficher), plutôt qu'un marquage séparé — les pastilles de pseudos suffisent à voir qui y va.

Alternatives écartées :
- **P2P WebRTC (Trystero, y-webrtc)** : exige deux téléphones en ligne simultanément, app au premier plan (iOS coupe WebRTC en arrière-plan) — rendez-vous improbables avec le réseau intermittent du festival.
- **Service hébergé gratuit (Firebase…)** : backend déguisé, quotas, clés API dans le client.

Le relais donne du **store-and-forward** : un téléphone seul en ligne quelques secondes dépose son état et ramasse celui des autres. L'état de tous est ensuite en cache local chez tous → l'overlay marche offline.

## Limites assumées

- Dépendance à la bonne volonté de relais publics bénévoles → 4 relais en parallèle, un seul suffit.
- Code de groupe court (`MOT-NN`, ~2 M de combinaisons) devinable par force brute → acceptable : payloads chiffrés, enjeu = favoris de festival.
- Pas de gestion de membres (kick/admin) en V1 ; quitter le groupe publie un tombstone best-effort (voir plus bas) mais ne peut pas forcer les autres à le recevoir hors-ligne.
- Un seul groupe à la fois en V1.

## Modèle de données

- **Identité** : paire de clés Nostr générée localement (`generateSecretKey`), jamais montrée à l'utilisateur. Pseudo choisi à la création/jonction.
- **Code de groupe** : `MOT-NN` (wordlist française ~200 mots + 2 chiffres), ex. `AVERSE-42`. Dérivations WebCrypto :
  - clé AES-GCM 256 = PBKDF2(code, salt `"pdj26-group-v1"`, 100 000 itérations, SHA-256) ;
  - tag de filtrage = hex(SHA-256(code + `"pdj26-tag-v1"`)).slice(0, 32). Les relais ne voient ni le code ni les données en clair.
- **État par membre** (payload chiffré) : `{ name, favorites: string[], updatedAt, left?: boolean }`. Chacun ne publie que son propre document → fusion = union, zéro conflit. `left: true` est un tombstone : publié une seule fois au moment de quitter le groupe, il signale aux autres de purger ce membre au lieu de fusionner son état.
- **Événement Nostr** : kind 30078 (remplaçable paramétré), tags `[["d", groupTag]]`, content = base64(IV ‖ ciphertext). Le relais ne garde que la dernière version par (pubkey, kind, d).

## Architecture

- `src/lib/group.ts` — wordlist, `generateGroupCode()`, `normalizeCode()`, `deriveGroupKeys(code)`, `encryptState()`/`decryptState()`.
- `src/lib/nostr.ts` — `RELAYS` (relay.damus.io, nos.lol, relay.nostr.band, offchain.pub), `publishState()`, `subscribeGroup()` via `SimplePool` (imports modulaires `nostr-tools/pure` + `nostr-tools/pool`).
- `src/hooks/useGroup.ts` — hook central instancié dans `App.tsx` :
  - localStorage : `pdj26-group` `{code, name, sk}` ; `pdj26-group-sk` (identité stable de l'appareil) ; `pdj26-group-members` (cache `{[pubkey]: état}`) ;
  - API : `{ group, others, create(name), join(code, name), leave(), friendsByEvent }` — `friendsByEvent` est une `Map<eventId, pseudos[]>` construite à partir des favoris de `others` ;
  - publication débouncée (~2 s) à chaque changement de favoris/pseudo, + `online` + `visibilitychange` ; réception → déchiffrement → garde le plus récent (`updatedAt`) → cache ; si l'état reçu porte `left: true`, le pubkey est retiré du cache au lieu d'être fusionné (l'ami disparaît de `others` et ses ids sortent de `friendsByEvent`) ;
  - `leave()` publie d'abord, en best-effort, un dernier état `{ ..., left: true }` sur le groupe qu'on quitte (même dérivation de clés), puis efface l'état local — les autres membres n'appliquent la purge que si un relais était joignable au moment du départ.
- `src/components/GroupPanel.tsx` — en tête de TimelineTab : créer/rejoindre (pseudo + code), groupe actif (code en gros, QR `uqr`, partage `navigator.share` du lien `…/pdj/#join=CODE`, liste des membres, quitter).
- `EventCard` — prop optionnelle `friends` (pseudos ayant mis l'événement en favori) ; pastilles sous le lieu, parapluie intouché. Utilisé dans `ProgramTab`.
- `TimelineTab` — bouton « Voir les favoris de mes amis » (switch, actif par défaut, persisté dans `pdj26-show-friends-favorites`) visible dès qu'un groupe existe. Quand actif, la liste affichée fusionne mes favoris et les événements favoris de `others` (union des ids) ; chaque événement montre les pastilles des amis qui l'ont favori. Les événements qui ne sont pas dans mes propres favoris sont visuellement distingués (`.tl-item-friend`, contour en pointillés) et leur parapluie reste cliquable pour se les approprier.
- `App.tsx` — lit `#join=CODE` au chargement → onglet timeline, code prérempli, hash nettoyé.

## Gestion des erreurs / cas limites

- Hors ligne : affichage depuis le cache, aucune erreur bloquante, resync à `online`/`visibilitychange`.
- Payload indéchiffrable ou JSON invalide (autre app sur le même kind, corruption) : événement ignoré silencieusement.
- Événement plus vieux que le cache (`updatedAt`) : ignoré.
- Membre retiré de mes favoris/du groupe : l'union se recalcule à l'affichage, rien à invalider.
- Tombstone (`left: true`) reçu plus vieux que le cache pour ce membre (`updatedAt` inférieur) : ignoré, même règle de fraîcheur que les mises à jour normales.
- Départ pendant une coupure réseau : le tombstone échoue silencieusement (comme toute publication hors-ligne) ; les autres membres continuent de voir l'ancien état jusqu'à une resynchro ultérieure de la personne partie — limite assumée, pas de mécanisme de rattrapage en V1.

## Tests

- `group.test.ts` : dérivation déterministe (même code → même tag/clé), normalisation (`averse 42` → `AVERSE-42`), roundtrip chiffrement/déchiffrement, échec propre avec une mauvaise clé.
- `useGroup.test.ts` : merge d'états reçus (pool mockée), rejet des payloads corrompus, `friendsByEvent` correct, exclusion de mon propre pubkey, persistance localStorage, remise à zéro au `leave()`, purge d'un ami dont le tombstone `left: true` arrive (et ses favoris disparaissent de `friendsByEvent`), tombstone plus vieux que le cache ignoré, `leave()` publie bien un état `left: true`.
- Manuel : deux navigateurs, créer/rejoindre, favoris croisés, coupure réseau → overlay depuis le cache, lien `#join`, toggle « favoris de mes amis » qui ajoute/retire les événements suggérés de la timeline.
