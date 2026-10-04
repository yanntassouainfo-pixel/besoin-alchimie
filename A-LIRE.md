# Besoin d'Alchimie, prototype de la plateforme

Prototype navigable construit le 4 octobre 2026 sur le brief « bibliothèque privée
d'expériences à vivre à deux ». Tout est fictif mais écrit comme si c'était définitif.

## Ouvrir

Le prototype est un site statique : `index.html`, une feuille de style, deux fichiers
JavaScript. Aucun serveur, aucune base de données. Tout ce qu'un couple écrit reste
dans le navigateur (localStorage) de l'appareil.

- En local : `node .serve.js` puis http://localhost:4181 (ou le profil
  `alchimie-plateforme` du Browser pane).
- Sur un téléphone du même réseau : même adresse avec l'IP du Mac.
- En ligne : copier le dossier tel quel sur n'importe quel hébergement statique.
  Rien à compiler.

Pour repartir de zéro : Profil, puis « Effacer le prototype et recommencer ».

## En ligne

Publié le 4 octobre 2026 comme Artifact claude.ai, **privé** :
https://claude.ai/artifact/5eHy4rUEf34gA143JSVyjW

- Seul le compte de Yann l'ouvre tant qu'il n'est pas partagé (menu Partager de la page).
- Le fichier publié est `dist/besoin-alchimie.html`, assemblé depuis la source par
  `../_scripts/build_artifact.py`. Après toute modification : relancer le script, puis
  republier le même fichier (même lien).
- Les données d'un couple restent dans son navigateur, comme en local.

## Ce qu'il contient

- Onboarding en quatre écrans (prénoms, ancienneté et enfants facultatifs, goûts).
- Accueil : « De quoi avez-vous envie tous les deux ? », dix cartes, puis le temps,
  puis l'énergie, puis trois propositions. Jamais vide : si rien ne colle, la
  sélection s'élargit et le dit.
- Explorer : cinq territoires, recherche, six filtres combinables, onze collections.
- 33 expériences (6 Se retrouver, 6 Se redécouvrir, 6 Se dire, 6 Se désirer, 9 Vivre),
  dont 4 audio et 3 marquées intimes.
- Toutes sont jouables depuis « Commencer ». Les huit demandées ont une mécanique
  propre : deviner puis révéler, chrono avec pistes et sujets interdits, hôte et invité,
  playlist en huit pistes, écriture secrète puis règles puis révélation, coffre à
  souvenirs avec photo, lecteur audio avec repères.
- Surprends-nous : temps, lieu, énergie, animation des deux triangles, une expérience.
- « Même 10 minutes peuvent compter » : section et page.
- Notre couple : vécues, favoris, à faire ensemble, souvenirs (dont les lettres scellées
  à un an), réponses conservées sur choix explicite, envies, et le Canari.
- Après chaque expérience : « Vous voulez garder quelque chose de ce moment ? » puis
  « Et maintenant, retournez profiter de votre soirée. »
- Accès Découverte (12 expériences) et accès membre, à bascule dans le Profil.

## Décisions prises sans demander

- Le « Bocal » s'appelle **Le Canari**, la jarre en terre. Si le mot gêne (oiseau en
  France), « La Jarre » est prêt dans le texte.
- Mode deux téléphones : simulé par des écrans « Passe le téléphone à … ». La structure
  des réponses (A et B séparés) permet de passer à deux comptes plus tard.
- Aucune photo : marques géométriques et teinte par territoire. Les images viendront
  avec une vraie direction photo.
- Le couple est vouvoyé par la plateforme ; les consignes entre partenaires tutoient.
- Pas de prix affiché, pas de paiement.

## Ce qui n'est pas fait

- Les audios sont des lecteurs à vide, avec un bouton « avancer d'une minute » pour
  la démonstration.
- Pas de compte, pas de synchronisation entre deux appareils.
- Les photos gardées en souvenir sont réduites à 900 px et stockées dans le
  navigateur : au-delà de quelques dizaines, le stockage sature.

## Fichiers

- `index.html` : coquille, navigation haute (ordinateur) et barre d'onglets (téléphone).
- `css/app.css` : charte « Braise & néon », choisie le 4 octobre 2026 parmi trois
  propositions (`maquettes/palettes.html`, captures `maquettes/direction-*.png`).
  Noir prune #110A0D, dégradé braise #FF5A36 vers #F0326F, flamme #FFB547, blanc
  chaud #FFF1EA. Instrument Serif et Sans inchangées. Ancienne feuille sauvegardée
  dans `css/app.css.bak-palette-2026-10-04`.
- `js/data.js` : les territoires, envies, filtres, collections et les 33 expériences.
  C'est là qu'on ajoute ou corrige un contenu.
- `js/app.js` : état local, routeur, vues, moteur d'expériences.
- `assets/` : favicon (16, 32, 48 px) et icônes 180 et 512 px dans la palette braise,
  générés par `../_scripts/gen_icones_braise.py`. Planche de contrôle : `_controle-icones.png`.
