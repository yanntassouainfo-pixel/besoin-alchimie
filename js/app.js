/* Besoin d'Alchimie, prototype navigable.
   Un seul fichier : état local, routeur, vues, et le moteur d'expériences.
   Tout est en localStorage. Rien ne quitte l'appareil. */

(function () {
  'use strict';

  /* ------------------------------------------------------------ */
  /* Outils                                                          */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  /* Échappe le HTML et pose les espaces insécables de la typographie française
     (devant ? ! : ; » et après «), pour qu'un « ? » ne se retrouve jamais seul en bout de ligne. */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    .replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');
  const uid = () => Math.random().toString(36).slice(2, 10);
  const hasard = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const melange = (arr) => arr.slice().sort(() => Math.random() - 0.5);
  const dateFr = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  const app = $('#app');
  let timers = [];
  const plusTard = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const chaque = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
  const nettoyer = () => { timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = []; };

  /* Confirmation dans la page : les fenêtres natives (confirm) sont bloquées dans
     certains cadres d'hébergement, et elles cassent l'ambiance de toute façon. */
  function demander(message, oui, faire) {
    $$('.dialogue').forEach((d) => d.remove());
    const voile = $('#voile');
    const d = document.createElement('div');
    d.className = 'dialogue'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = `<p>${esc(message)}</p><div class="actions"><button class="btn" data-d="oui">${esc(oui)}</button><button class="btn btn--secondaire" data-d="non">Rester</button></div>`;
    const fermer = () => { d.remove(); if (voile) voile.hidden = true; };
    d.addEventListener('click', (ev) => { const b = ev.target.closest('[data-d]'); if (!b) return; fermer(); if (b.dataset.d === 'oui') faire(); });
    if (voile) { voile.hidden = false; voile.onclick = fermer; }
    document.body.appendChild(d);
    const bt = d.querySelector('[data-d=non]'); if (bt) bt.focus();
  }

  function toast(msg) {
    $$('.toast').forEach((t) => t.remove());
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), Math.max(2400, msg.length * 55));
  }

  /* ------------------------------------------------------------ */
  /* État                                                            */
  const CLE = 'besoin-alchimie.proto.v1';
  const defaut = () => ({
    onboarded: false,
    couple: { a: '', b: '', depuis: '', enfants: null, gouts: [] },
    membre: false,
    favoris: [], aFaire: [], vecues: [], souvenirs: [], reponses: {}, canari: [], envies: [],
    majeurs: false,
    essais: [],
    mesure: { actif: true, compteurs: {} }
  });
  let S = charger();
  function charger() {
    try {
      const j = localStorage.getItem(CLE);
      if (j) {
        const brut = JSON.parse(j);
        const s = Object.assign(defaut(), brut);
        /* Installations d'avant le quota : les expériences déjà vécues comptent. */
        if (!Array.isArray(brut.essais)) s.essais = [...new Set((s.vecues || []).map((v) => v.id))];
        return s;
      }
    } catch (e) { /* stockage indisponible */ }
    return defaut();
  }
  function ecrireLocal() {
    try { localStorage.setItem(CLE, JSON.stringify(S)); }
    catch (e) { toast('Impossible d’enregistrer sur cet appareil.'); }
  }
  /* Chaque enregistrement part aussi vers l'autre téléphone quand les deux sont reliés. */
  function sauver() { ecrireLocal(); if (S.lien && !enSync) planifierSync(1500); }
  /* ------------------------------------------------------------ */
  /* Mesure d'audience                                               */
  /* L'app compte ce qui est ouvert et terminé, jamais ce qui est écrit : ni prénoms,
     ni réponses, ni souvenirs. Pour « Se désirer », seul le territoire est compté,
     jamais l'expérience. Aujourd'hui les compteurs restent sur le téléphone (Profil,
     « Ce que l'app compte »). Pour les envoyer à un outil de mesure sans cookie, créer
     un compte Plausible et renseigner son domaine ici, après avoir vérifié les
     conditions d'exemption de consentement (CNIL) : */
  const MESURE_PLAUSIBLE = null;   // ex. 'yanntassouainfo-pixel.github.io'
  function mesure(nom, quoi) {
    if (!S.mesure) S.mesure = { actif: true, compteurs: {} };
    if (!S.mesure.actif) return;
    const cle = quoi ? nom + ' · ' + quoi : nom;
    S.mesure.compteurs[cle] = (S.mesure.compteurs[cle] || 0) + 1;
    sauver();
    if (MESURE_PLAUSIBLE && navigator.sendBeacon) {
      try {
        const corps = JSON.stringify({ name: nom, domain: MESURE_PLAUSIBLE, url: location.origin + location.pathname, props: quoi ? { quoi } : {} });
        navigator.sendBeacon('https://plausible.io/api/event', new Blob([corps], { type: 'text/plain' }));
      } catch (e) { /* envoi impossible : le compteur local suffit */ }
    }
  }
  /* Le nom compté pour une expérience : le détail jamais pour l'intime. */
  const nomMesure = (e) => (e.intime || e.territoire === 'desirer') ? 'Se désirer (détail non compté)' : e.titre;

  const noms = () => ({ A: S.couple.a || 'Toi', B: S.couple.b || 'L’autre' });
  const nom = (qui) => noms()[qui] || qui;

  /* ------------------------------------------------------------ */
  /* Accès aux données                                               */
  /* Date du jour sur ce téléphone, au format AAAA-MM-JJ. */
  const aujourdhui = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  /* Une nouveauté de la semaine n'existe qu'à partir de sa date de parution. */
  const EXP = BA.experiences.filter((e) => !e.parution || e.parution <= aujourdhui());
  const exp = (id) => EXP.find((e) => e.id === id);
  const terr = (id) => BA.territoires.find((t) => t.id === id);
  const libelle = (liste, id) => { const x = liste.find((o) => o.id === id); return x ? x.nom : id; };
  const tempsCourt = (id) => { const x = BA.temps.find((o) => o.id === id); return x ? x.court : id; };
  const estMembre = () => S.membre;
  /* Accès Découverte : QUOTA_DECOUVERTE expériences au choix, comptées au premier
     « Commencer ». Une expérience déjà entamée reste rejouable. Au-delà, toute la
     bibliothèque reste visible mais ne se lance plus sans l'accès membre.
     Limite de prototype : le compte vit dans le navigateur ; effacer les données du
     site le remet à zéro. Le vrai verrou viendra avec les comptes. */
  const QUOTA_DECOUVERTE = 6;
  /* Inscription par mail (Brevo), au moment où le quota est atteint : deux
     expériences de plus, offertes. Tant que FORMULAIRE_BREVO est vide, rien ne
     s'affiche. Y coller l'adresse « action » du formulaire Brevo
     (https://….sibforms.com/serve/…). Le mail de confirmation contient le lien
     https://besoindalchimie.com/#/cadeau?c=CODE_CADEAU et le code en clair, pour
     qui ouvre le mail ailleurs que dans l'app (iPhone : l'app installée a ses
     propres données). Le code est partageable : c'est un geste, pas un verrou. */
  const FORMULAIRE_BREVO = '';   /* prêt : formulaire « Cadeau : 2 expériences offertes » (liste n°3), voir BREVO_A-CONFIGURER.md */
  /* Liste d'attente de l'accès membre : adresse « action » d'un second formulaire Brevo. */
  const FORMULAIRE_ATTENTE = 'https://22f1f212.sibforms.com/serve/MUIFAD-3oFNBsP2eXd7gN8XPxS1YN3sCrQHyWJssAOXOPE71unR5q4sARPXevJFo7mvjwuPwFq__Zks-D5NZQ7CyU55vSj3Hp2DL3tlaJOGSwhUx1FAYZdzOxYT0o5F6twZF-mEhbMxQ3-k0UqLsnxa2SD7McvnzE867anla-CRYDQYPtpjaDBBx_Tm7eQcOh92KHa5qtTKPq_ZoqQ==';   /* « Liste d'attente : accès membre » (liste n°4) */
  const CODE_CADEAU = 'BRAISE';
  const BONUS_CADEAU = 2;
  const quota = () => QUOTA_DECOUVERTE + (S.cadeau ? BONUS_CADEAU : 0);
  const essais = () => (Array.isArray(S.essais) ? S.essais : []);
  const dejaEssayee = (e) => essais().includes(e.id);
  const essaisRestants = () => Math.max(0, quota() - essais().length);
  /* Réservées aux membres, hors quota : les audios guidés et les nouveautés de la semaine.
     Une expérience déjà commencée reste ouverte. */
  const reservee = (e) => !!(e.audio || e.parution);
  const accessible = (e) => estMembre() || dejaEssayee(e) || (!reservee(e) && essaisRestants() > 0);
  /* Mode test : la bascule membre n'apparaît que sur un téléphone passé par #/testeur. */
  const testeur = () => { try { return localStorage.getItem('ba-testeur') === '1'; } catch (e) { return false; } };
  /* Collections de saison : visibles seulement à leur période (mois-jour, peut passer le 31 décembre). */
  const enSaison = (c) => { if (!c.saison) return true; const j = aujourdhui().slice(5); const { du, au } = c.saison; return du <= au ? (j >= du && j <= au) : (j >= du || j <= au); };
  const collections = () => BA.collections.filter(enSaison);
  const nouveaute = () => EXP.filter((e) => e.parution).sort((a, b) => (a.parution < b.parution ? 1 : -1))[0] || null;

  function meta(e) {
    const lieu = e.lieux[0] === 'partout' ? 'N’importe où' : libelle(BA.lieux, e.lieux[0]).replace('À la maison', 'Maison');
    const amb = libelle(BA.ambiances, e.ambiances[0]);
    const budget = e.budget === 'gratuit' ? 'Gratuit' : (e.budget === 'petit' ? 'Petit budget' : 'Budget libre');
    return [tempsCourt(e.temps), lieu, amb, budget];
  }

  /* Les expériences d'une collection. */
  function expsCollection(c) {
    if (c.ids) return c.ids.map(exp).filter(Boolean);
    return EXP.filter((e) => {
      const r = c.regle;
      if (r.energies && !r.energies.some((x) => e.energies.includes(x))) return false;
      if (r.lieux && !r.lieux.some((x) => e.lieux.includes(x))) return false;
      if (r.temps && !r.temps.includes(e.temps)) return false;
      if (r.budgets && !r.budgets.includes(e.budget)) return false;
      if (r.ambiances && !r.ambiances.some((x) => e.ambiances.includes(x))) return false;
      return true;
    });
  }

  /* Filtrage manuel de la bibliothèque. */
  function filtrer(f) {
    const q = (f.q || '').trim().toLowerCase();
    return EXP.filter((e) => {
      if (f.terr && e.territoire !== f.terr) return false;
      if (f.temps && e.temps !== f.temps) return false;
      if (f.lieu && f.lieu !== 'partout' && !(e.lieux.includes(f.lieu) || e.lieux.includes('partout'))) return false;
      if (f.energie && !e.energies.includes(f.energie)) return false;
      if (f.amb && !e.ambiances.includes(f.amb)) return false;
      if (f.budget && e.budget !== f.budget) return false;
      if (q) {
        const texte = (e.titre + ' ' + e.accroche + ' ' + e.mecanique + ' ' + e.avant).toLowerCase();
        if (!texte.includes(q)) return false;
      }
      return true;
    });
  }

  /* Recommandation : envie + temps + énergie. Jamais vide : si rien ne colle,
     on relâche d'abord l'énergie, puis le temps, et on le dit. */
  const ordreTemps = ['10', '30', '60', 'soiree', 'demi', 'weekend'];
  function recommander(envieId, temps, energie, n) {
    const envie = BA.envies.find((x) => x.id === envieId);
    const score = (e, strict) => {
      let s = 0;
      const it = envie.territoires.indexOf(e.territoire);
      if (it === 0) s += 4; else if (it > 0) s += 2;
      envie.ambiances.forEach((a) => { if (e.ambiances.includes(a)) s += 2; });
      const d = Math.abs(ordreTemps.indexOf(e.temps) - ordreTemps.indexOf(temps));
      if (d === 0) s += 4; else if (d === 1 && !strict) s += 1; else if (strict) return -99; else s -= 3;
      if (e.energies.includes(energie)) s += 3; else if (strict) return -99; else s -= 2;
      if (it < 0) s -= 4;
      return s;
    };
    let res = EXP.map((e) => ({ e, s: score(e, true) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    let relache = false;
    if (res.length < n) {
      relache = true;
      res = EXP.map((e) => ({ e, s: score(e, false) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    }
    return { liste: res.slice(0, n).map((x) => x.e), relache };
  }

  /* ------------------------------------------------------------ */
  /* Composants                                                      */
  const svgFav = '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>';

  function carte(e, opts) {
    opts = opts || {};
    const m = meta(e);
    const tags = [];
    if (e.audio) tags.push('<span class="tag tag--audio">Audio</span>');
    if (e.intime) tags.push('<span class="tag tag--intime">Intime</span>');
    const verrou = !accessible(e);
    if (!verrou && reservee(e) && !estMembre() && !dejaEssayee(e)) tags.push('<span class="tag tag--verrou">Membres</span>');
    if (verrou) tags.push('<span class="tag tag--verrou"><svg viewBox="0 0 12 14" aria-hidden="true"><rect x="1.5" y="6" width="9" height="7" rx="1.5" fill="currentColor"/><path d="M3.5 6V4.2a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>Membres</span>');
    const fav = S.favoris.includes(e.id);
    return `<article class="carte t-${e.territoire}${verrou ? ' carte--verrou' : ''}">
      <a class="carte__lien" href="#/experience/${e.id}" aria-label="${esc(e.titre)}"></a>
      <div class="carte__haut"><div class="carte__terr">${esc(terr(e.territoire).nom)}</div>${tags.length ? `<div class="carte__tags">${tags.join('')}</div>` : ''}</div>
      <h3 class="carte__titre">${esc(e.titre)}</h3>
      <p class="carte__accroche">${esc(e.accroche)}</p>
      <div class="carte__pied"><div class="carte__meta">${m.slice(0, 3).map(esc).join('<span class="pt"> · </span>')}</div><button class="fav ${fav ? 'actif' : ''}" data-act="fav" data-id="${e.id}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${svgFav}</button></div>
    </article>`;
  }

  function grille(liste, vide) {
    if (!liste.length) return `<div class="vide">${esc(vide || 'Rien ici pour l’instant.')}</div>`;
    return `<div class="grille">${liste.map((e) => carte(e)).join('')}</div>`;
  }

  function salut() {
    const h = new Date().getHours();
    return (h >= 18 || h < 5) ? 'Bonsoir' : 'Bonjour';
  }

  /* ------------------------------------------------------------ */
  /* Rendu et routeur                                                */
  function rendre(html, plein) {
    nettoyer();
    document.body.classList.toggle('plein', !!plein);
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  /* Redessine l'écran courant sur place (un bouton bascule, un favori, une option)
     en gardant ce que la personne a saisi, l'élément actif et la position de
     défilement. Sans cela, chaque redessin effaçait les champs non enregistrés. */
  let enPlace = false;
  function rerendre(fn) {
    const y = window.scrollY;
    const actif = document.activeElement && document.activeElement.id;
    const saisies = {};
    $$('#app input[id], #app textarea[id], #app select[id]').forEach((el) => { if (el.type !== 'file') saisies[el.id] = el.value; });
    enPlace = true;
    try { fn(); } finally { enPlace = false; }
    Object.keys(saisies).forEach((k) => { const el = document.getElementById(k); if (el) el.value = saisies[k]; });
    window.scrollTo(0, y);
    if (actif) { const el = document.getElementById(actif); if (el) el.focus({ preventScroll: true }); }
  }
  function navActif(cle) {
    $$('[data-nav]').forEach((a) => a.classList.toggle('actif', a.dataset.nav === cle));
  }
  function aller(h) { location.hash = h; }

  function route() {
    const brut = location.hash.replace(/^#/, '') || '/';
    const [chemin, requete] = brut.split('?');
    const q = {};
    (requete || '').split('&').filter(Boolean).forEach((p) => { const [k, v] = p.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    const seg = chemin.split('/').filter(Boolean);

    if (annoncerDemenagement()) return;
    if (seg[0] === 'recevoir') return vueRecevoir(q);
    if (seg[0] === 'rejoindre') return vueRejoindre(q);
    if (seg[0] === 'aide') { navActif(''); return vueAide(); }
    if (seg[0] === 'confidentialite') { navActif(''); return vueConfidentialite(); }
    if (seg[0] === 'cadeau') { appliquerCadeau(q.c, true); return; }
    if (!S.majeurs) { if (seg[0] !== 'age') { aller('/age'); return; } return vueAge(q.non === '1'); }
    if (!S.onboarded && seg[0] !== 'bienvenue') { aller('/bienvenue'); return; }

    const r = seg[0] || '';
    if (r === 'age') { aller(S.onboarded ? '/' : '/bienvenue'); return; }
    if (!enPlace) mesure('Page', r === 'experience' || r === 'jouer' ? r : (r || 'accueil'));
    if (r === 'bienvenue') return vueOnboarding(parseInt(q.etape || '0', 10));
    if (r === '') { navActif('accueil'); return vueAccueil(); }
    if (r === 'envie') { navActif('accueil'); return vueEnvie(seg[1], seg[2], seg[3]); }
    if (r === 'explorer') { navActif('explorer'); return vueExplorer(q); }
    if (r === 'territoire') { navActif('explorer'); return vueTerritoire(seg[1]); }
    if (r === 'collection') { navActif('explorer'); return vueCollection(seg[1]); }
    if (r === 'dix-minutes') { navActif('explorer'); return vueDixMinutes(); }
    if (r === 'experience') { navActif('explorer'); return vueExperience(seg[1]); }
    if (r === 'jouer') { return jouer(seg[1]); }
    if (r === 'surprends') { navActif('surprends'); return vueSurprends(q); }
    if (r === 'couple') { navActif('couple'); return vueCouple(q.o || 'vecues'); }
    if (r === 'profil') { navActif('profil'); return vueProfil(); }
    if (r === 'membre') { navActif('profil'); return vueMembre(); }
    if (r === 'relier') { navActif('profil'); return vueRelier(); }
    if (r === 'testeur') { try { localStorage.setItem('ba-testeur', '1'); } catch (e) { /* stockage indisponible */ } toast('Mode test : la bascule membre est dans le Profil.'); return aller('/profil'); }
    aller('/');
  }

  /* ------------------------------------------------------------ */
  /* Porte d'âge                                                     */
  const marqueSvg = '<svg class="brand__mark" viewBox="0 0 64 28" aria-hidden="true"><path d="M14 4 L26 24 L2 24 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M38 4 L62 4 L50 24 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  function vueAge(non) {
    if (non) {
      return rendre(`<div class="onb">${marqueSvg}
        <h1>Ce n\u2019est pas encore pour vous.</h1>
        <p class="corps">Besoin d\u2019Alchimie est réservé aux couples dont les deux partenaires ont 18 ans ou plus. Revenez quand ce sera le cas.</p>
        <div class="actions"><a class="btn btn--discret" href="#/age">Je me suis trompé</a></div>
      </div>`, true);
    }
    rendre(`<div class="onb">${marqueSvg}
      <div class="surtitre">Avant d\u2019entrer</div>
      <h1>Avez-vous tous les deux 18 ans ou plus&nbsp;?</h1>
      <p class="corps">Besoin d\u2019Alchimie s\u2019adresse aux couples adultes. Certaines expériences parlent de désir, de toucher et de sensualité.</p>
      <div class="actions actions--col" style="max-width:360px">
        <button class="btn" data-act="majeurs">Oui, tous les deux</button>
        <a class="btn btn--secondaire" href="#/age?non=1">Non</a>
      </div>
      <p class="note">Votre réponse est gardée sur ce téléphone uniquement.</p>
    </div>`, true);
  }

  /* ------------------------------------------------------------ */
  /* Si quelque chose ne va pas                                      */
  /* Numéros vérifiés le 4 octobre 2026 à leur source officielle :
     France, service-public.gouv.fr (page vérifiée le 1er avril 2026) ;
     Belgique, ecouteviolencesconjugales.be, et 112 numéro d'urgence européen ;
     Togo, conseils aux voyageurs de France Diplomatie (mise à jour du 15 septembre 2026).
     Aucune ligne togolaise dédiée aux violences n'a pu être vérifiée : aucune n'est affichée.
     Cette page n'est jamais comptée par la mesure d'audience. */
  function vueAide() {
    const num = (n, tel, detail) => `<div class="aide-num"><a href="tel:${tel}">${n}</a><span>${detail}</span></div>`;
    rendre(`
      <a class="retour" href="#/">← Retour</a>
      <section class="hero"><div class="surtitre">Si quelque chose ne va pas</div>
        <h1>Personne ne devrait porter ça sans aide.</h1>
        <p>Besoin d\u2019Alchimie est fait pour les couples qui vont bien, ou à peu près. Si l\u2019un de vous a peur de l\u2019autre, se sent surveillé, rabaissé, contrôlé ou menacé, ces expériences ne sont pas faites pour ce moment-là. Parlez-en à quelqu\u2019un de confiance, et à un service d\u2019aide.</p>
      </section>
      <div class="aide-pays">
        <div class="profil-bloc"><h3>France</h3>
          ${num('39 19', '3919', 'Violences Femmes Info. Gratuit, anonyme, 24 h sur 24 et 7 jours sur 7. L\u2019appel n\u2019apparaît pas sur la facture.')}
          ${num('17', '17', 'Police secours, en cas d\u2019urgence. Le 112 fonctionne aussi.')}
          ${num('114', 'sms:114', 'Par SMS, gratuit, 24 h sur 24, si vous ne pouvez pas parler.')}
        </div>
        <div class="profil-bloc"><h3>Belgique</h3>
          ${num('0800 30 030', '080030030', 'Écoute Violences Conjugales. Gratuit et anonyme.')}
          ${num('112', '112', 'Numéro d\u2019urgence européen.')}
        </div>
        <div class="profil-bloc"><h3>Togo</h3>
          ${num('117', '117', 'Police secours depuis un téléphone fixe.')}
          ${num('161', '161', 'Police secours depuis un téléphone portable.')}
          ${num('172', '172', 'Gendarmerie.')}
        </div>
        <div class="profil-bloc"><h3>Ailleurs</h3><p class="muted small">Appelez le numéro d\u2019urgence de la police de votre pays. Un médecin, un centre de santé ou une association locale peuvent aussi vous orienter.</p></div>
      </div>
      <p class="note">Numéros vérifiés le 4 octobre 2026 sur des sources officielles. Cette page n\u2019est jamais comptée dans les statistiques de l\u2019app.</p>
      <div class="actions"><button class="btn btn--secondaire" data-act="sortie">Quitter vite cette page</button></div>
    `);
  }

  /* ------------------------------------------------------------ */
  /* Onboarding                                                      */
  const GOUTS = ['Parler', 'Rire', 'Sortir', 'Découvrir', 'Créer', 'Tendresse', 'Sensualité', 'Surprises'];
  let onb = { a: '', b: '', depuis: '', enfants: null, gouts: [] };

  function vueOnboarding(etape) {
    const points = `<div class="points">${[0, 1, 2, 3].map((i) => `<i class="${i <= etape ? 'actif' : ''}"></i>`).join('')}</div>`;
    const marque = '<svg class="brand__mark" viewBox="0 0 64 28" aria-hidden="true"><path d="M14 4 L26 24 L2 24 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M38 4 L62 4 L50 24 Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>';
    let html = '';
    if (etape === 0) {
      html = `<div class="onb">${marque}
        <h1>Bienvenue dans Besoin d’Alchimie.</h1>
        <p class="corps">Ici, il n’y a rien à réussir.</p>
        <p class="corps">Vous n’avez pas besoin d’avoir un problème de couple pour être là. Choisissez simplement ce dont vous avez envie, et laissez-nous vous proposer quelque chose à vivre ensemble.</p>
        <div class="actions"><a class="btn" href="#/bienvenue?etape=1">Commencer</a></div>
      </div>`;
    } else if (etape === 1) {
      html = `<div class="onb">${points}
        <h1>Vous deux.</h1>
        <p class="corps">Des prénoms, ou des surnoms. C’est ce que la plateforme utilisera pour s’adresser à chacun.</p>
        <div class="champ"><label for="onb-a">Premier prénom</label><input type="text" id="onb-a" value="${esc(onb.a)}" autocomplete="off" /></div>
        <div class="champ"><label for="onb-b">Second prénom</label><input type="text" id="onb-b" value="${esc(onb.b)}" autocomplete="off" /></div>
        <div class="actions"><button class="btn" data-act="onb-1">Continuer</button></div>
      </div>`;
    } else if (etape === 2) {
      html = `<div class="onb">${points}
        <h1>Deux questions, facultatives.</h1>
        <p class="corps">Elles servent uniquement à mieux choisir ce qu’on vous propose.</p>
        <div class="champ"><label for="onb-d">Depuis combien de temps êtes-vous ensemble ?</label>
          <select id="onb-d">${[['', 'Je préfère ne pas dire'], ['moins-2', 'Moins de deux ans'], ['2-7', 'Entre deux et sept ans'], ['7-15', 'Entre sept et quinze ans'], ['15-plus', 'Plus de quinze ans']].map(([v, l]) => `<option value="${v}"${onb.depuis === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="champ"><label>Avez-vous des enfants ?</label>
          <div class="puces"><button class="puce ${onb.enfants === true ? 'actif' : ''}" data-act="onb-enf" data-v="oui">Oui</button><button class="puce ${onb.enfants === false ? 'actif' : ''}" data-act="onb-enf" data-v="non">Non</button></div></div>
        <div class="actions"><button class="btn" data-act="onb-2">Continuer</button><a class="btn btn--discret" href="#/bienvenue?etape=3">Passer</a></div>
      </div>`;
    } else if (etape === 3) {
      html = `<div class="onb">${points}
        <h1>Qu’est-ce qui vous attire ?</h1>
        <p class="corps">Plusieurs réponses possibles. Vous pourrez toujours explorer le reste.</p>
        <div class="champ"><div class="puces">${GOUTS.map((g) => `<button class="puce ${onb.gouts.includes(g) ? 'actif' : ''}" data-act="onb-gout" data-v="${g}">${g}</button>`).join('')}</div></div>
        <div class="actions"><button class="btn" data-act="onb-3">Terminer</button></div>
      </div>`;
    } else {
      html = `<div class="onb">${marque}
        <h1>Votre espace est prêt.</h1>
        <p class="corps">${esc(nom('A'))} et ${esc(nom('B'))}, il ne reste plus qu’à choisir de quoi vous avez envie.</p>
        <div class="actions"><a class="btn" href="#/">Entrer</a></div>
      </div>`;
    }
    rendre(html, true);
  }

  /* ------------------------------------------------------------ */
  /* Accueil                                                         */
  function vueAccueil() {
    const dix = EXP.filter((e) => e.temps === '10');
    const aFaire = S.aFaire.map(exp).filter(Boolean).slice(0, 3);
    const colls = collections().filter((c) => c.saison).concat(melange(collections().filter((c) => !c.saison))).slice(0, 3);
    rendre(`
      <section class="hero">
        <div class="surtitre">${salut()}${S.couple.a ? ', ' + esc(S.couple.a) + ' et ' + esc(S.couple.b) : ''}</div>
        <h1>De quoi avez-vous envie tous les deux ?</h1>
        <p>Choisissez, on vous propose quelque chose à vivre. Rien à préparer, rien à réussir.</p>
      </section>
      <section class="section">
        <div class="envies">${BA.envies.map((v) => `<a class="envie${v.id === 'desires' ? ' envie--fort' : ''}" href="#/envie/${v.id}">${esc(v.texte)}</a>`).join('')}</div>
      </section>
      ${blocNouveaute()}
      <section class="section">
        <div class="bandeau">
          <div class="bandeau__mark"><svg viewBox="0 0 100 100"><path d="M30 20 L50 55 L10 55 Z"/><path d="M50 45 L90 45 L70 80 Z"/></svg></div>
          <div class="surtitre">Surprends-nous</div>
          <h2>Ce soir, on choisit pour vous.</h2>
          <p>Dites-nous simplement de combien de temps et d’énergie vous disposez. On s’occupe du reste.</p>
          <a class="btn" href="#/surprends">Laisser choisir</a>
        </div>
      </section>
      <section class="section">
        <div class="section__tete"><div><h2>Même 10 minutes peuvent compter.</h2><p class="section__sous">Pour les soirs où il ne reste presque rien. Rien de miraculeux : juste de quoi se retrouver un peu.</p></div><a href="#/dix-minutes">Tout voir</a></div>
        <div class="rangee">${dix.map((e) => carte(e)).join('')}</div>
      </section>
      ${aFaire.length ? `<section class="section">
        <div class="section__tete"><h2>À faire ensemble</h2><a href="#/couple?o=afaire">Votre liste</a></div>
        <div class="grille">${aFaire.map((e) => carte(e)).join('')}</div>
      </section>` : ''}
      <section class="section">
        <div class="section__tete"><h2>Collections</h2><a href="#/explorer">Explorer</a></div>
        <div class="collections">${colls.map(carteCollection).join('')}</div>
      </section>
    `);
    proposerInstallation();
  }

  function carteCollection(c) {
    const n = expsCollection(c).length;
    return `<a class="collection" href="#/collection/${c.id}"><small>${c.saison ? 'De saison · Membres' : 'Collection'}</small><h3>${esc(c.nom)}</h3><p>${esc(c.phrase)}</p><span class="compte">${n} expérience${n > 1 ? 's' : ''}</span></a>`;
  }

  /* ------------------------------------------------------------ */
  /* Parcours envie → temps → énergie → propositions                 */
  function vueEnvie(envieId, temps, energie) {
    const envie = BA.envies.find((v) => v.id === envieId);
    if (!envie) return aller('/');
    if (!temps) {
      return rendre(`
        <a class="retour" href="#/">← Changer d’envie</a>
        <section class="hero"><div class="surtitre">${esc(envie.texte)}</div><h1>Combien de temps avez-vous ?</h1><p>Soyez honnêtes. Dix vraies minutes valent mieux qu’une heure qu’on n’a pas.</p></section>
        <div class="pile pile--2">${BA.temps.map((t) => `<a class="choix" href="#/envie/${envie.id}/${t.id}">${esc(t.nom)}</a>`).join('')}</div>
      `);
    }
    if (!energie) {
      return rendre(`
        <a class="retour" href="#/envie/${envie.id}">← Changer de durée</a>
        <section class="hero"><div class="surtitre">${esc(envie.texte)} · ${esc(libelle(BA.temps, temps))}</div><h1>Et votre énergie ?</h1><p>Il n’y a pas de mauvaise réponse. Il y a des expériences pour chaque état.</p></section>
        <div class="pile">${BA.energies.map((n) => `<a class="choix" href="#/envie/${envie.id}/${temps}/${n.id}">${esc(n.nom)}<small>${esc(n.phrase)}</small></a>`).join('')}</div>
      `);
    }
    const r = recommander(envieId, temps, energie, 3);
    mesure('Propositions vues', envie.texte);
    rendre(`
      <a class="retour" href="#/envie/${envie.id}/${temps}">← Changer d’énergie</a>
      <section class="hero"><div class="surtitre">${esc(envie.texte)} · ${esc(libelle(BA.temps, temps))} · ${esc(libelle(BA.energies, energie))}</div>
        <h1>On en fait une ?</h1>
        <p>${r.relache ? 'Rien ne collait exactement, alors on a élargi un peu. Si ça ne vous parle pas, changez la durée ou l’énergie.' : 'Trois propositions, choisies pour ce soir. Posez le téléphone entre vous et regardez-les ensemble.'}</p></section>
      ${grille(r.liste)}
      <div class="actions"><a class="btn btn--secondaire" href="#/surprends">Laisser choisir à notre place</a><a class="btn btn--discret" href="#/explorer?temps=${temps}&energie=${energie}">Voir toute la bibliothèque avec ces critères</a></div>
    `);
  }

  /* ------------------------------------------------------------ */
  /* Explorer                                                        */
  function vueExplorer(q) {
    const f = { q: q.q || '', terr: q.terr || '', temps: q.temps || '', lieu: q.lieu || '', energie: q.energie || '', amb: q.amb || '', budget: q.budget || '' };
    const liste = filtrer(f);
    const actifs = Object.keys(f).filter((k) => k !== 'q' && f[k]).length;
    const lien = (k, v) => { const n = Object.assign({}, f); n[k] = (f[k] === v ? '' : v); return '#/explorer?' + Object.keys(n).filter((x) => n[x]).map((x) => x + '=' + encodeURIComponent(n[x])).join('&'); };
    const groupe = (k, titre, liste) => `<div class="filtre"><span>${titre}</span><div class="puces">${liste.map((o) => `<a class="puce ${f[k] === o.id ? 'actif' : ''}" href="${lien(k, o.id)}">${esc(o.nom)}</a>`).join('')}</div></div>`;
    rendre(`
      <section class="hero"><div class="surtitre">Explorer</div><h1>Vous avez 30 minutes devant vous ?</h1><p>C’est largement suffisant pour vivre quelque chose. Cinq territoires, des filtres à combiner, et ${EXP.length} expériences.</p></section>
      <div class="territoires section">${BA.territoires.map((t) => `<a class="territoire t-${t.id}" href="#/territoire/${t.id}"><small>${EXP.filter((e) => e.territoire === t.id).length} expériences</small><h3>${esc(t.nom)}</h3><p>${esc(t.phrase)}</p></a>`).join('')}</div>
      <section class="section">
        <div class="recherche"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" id="recherche" placeholder="Chercher une expérience" value="${esc(f.q)}" /></div>
        <button class="btn btn--secondaire btn--petit filtres__toggle" data-act="filtres">${actifs ? actifs + ' filtre' + (actifs > 1 ? 's' : '') + ' actif' + (actifs > 1 ? 's' : '') : 'Filtres'}</button>
        <div class="filtres" id="filtres" ${actifs ? '' : 'hidden'}>
          ${groupe('terr', 'Besoin', BA.territoires)}
          ${groupe('temps', 'Temps', BA.temps.map((t) => ({ id: t.id, nom: t.court })))}
          ${groupe('lieu', 'Lieu', BA.lieux)}
          ${groupe('energie', 'Énergie', BA.energies)}
          ${groupe('amb', 'Ambiance', BA.ambiances)}
          ${groupe('budget', 'Budget', BA.budgets)}
          ${actifs ? '<a class="btn btn--discret" href="#/explorer">Tout effacer</a>' : ''}
        </div>
        <p class="compte" style="margin-bottom:12px">${liste.length} expérience${liste.length > 1 ? 's' : ''}</p>
        ${grille(liste, 'On n’a rien trouvé avec cette combinaison. Enlevez un filtre et on devrait pouvoir vous surprendre.')}
      </section>
      <section class="section"><div class="section__tete"><h2>Collections</h2></div><div class="collections">${collections().map(carteCollection).join('')}</div></section>
    `);
    const inp = $('#recherche');
    let t;
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const n = Object.assign({}, f, { q: inp.value }); location.replace('#/explorer?' + Object.keys(n).filter((x) => n[x]).map((x) => x + '=' + encodeURIComponent(n[x])).join('&')); const i2 = $('#recherche'); if (i2) { i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); } }, 250); });
  }

  function vueTerritoire(id) {
    const t = terr(id); if (!t) return aller('/explorer');
    const liste = EXP.filter((e) => e.territoire === id);
    rendre(`<a class="retour" href="#/explorer">← Explorer</a>
      <section class="hero t-${id}"><div class="surtitre" style="color:var(--teinte)">Territoire</div><h1>${esc(t.nom)}</h1><p>${esc(t.phrase)}</p></section>
      <section class="section">${grille(liste)}</section>`);
  }

  function vueCollection(id) {
    const c = collections().find((x) => x.id === id); if (!c) return aller('/explorer');
    const ferme = c.membre && !estMembre();
    rendre(`<a class="retour" href="#/explorer">← Explorer</a>
      <section class="hero"><div class="surtitre">${c.saison ? 'Collection de saison' : 'Collection'}</div><h1>${esc(c.nom)}</h1><p>${esc(c.phrase)}</p></section>
      <section class="section">${ferme ? `<div class="membre-encart"><div class="surtitre">Réservée aux membres</div><h2>Les collections de saison font partie de l’accès membre.</h2><p>${expsCollection(c).length} expériences choisies pour cette période de l’année. Elles changent avec les saisons.</p><a class="btn" href="#/membre">Voir l’accès membre</a></div>` : grille(expsCollection(c))}</section>`);
  }

  function vueDixMinutes() {
    rendre(`<a class="retour" href="#/">← Accueil</a>
      <section class="hero"><div class="surtitre">On n’a que 10 minutes</div><h1>Même 10 minutes peuvent compter.</h1><p>Ce ne sont pas des rituels miracles. Ce sont de petites expériences faites pour une contrainte réelle : il est tard, vous êtes fatigués, et vous avez quand même envie de vous retrouver un peu.</p></section>
      <section class="section">${grille(EXP.filter((e) => e.temps === '10'))}</section>`);
  }

  /* ------------------------------------------------------------ */
  /* Page d'une expérience                                           */
  function vueExperience(id) {
    const e = exp(id); if (!e) return aller('/explorer');
    const m = meta(e);
    const t = terr(e.territoire);
    const fav = S.favoris.includes(e.id), af = S.aFaire.includes(e.id);
    const vecue = S.vecues.filter((v) => v.id === e.id).length;
    const colls = collections().filter((c) => expsCollection(c).some((x) => x.id === e.id)).slice(0, 3);
    const ok = accessible(e);
    rendre(`
      <a class="retour" href="#/territoire/${e.territoire}">← ${esc(t.nom)}</a>
      <header class="exp-hero t-${e.territoire}">
        <div class="surtitre">${esc(t.nom)}${e.audio ? ' · Expérience audio' : ''}${e.intime ? ' · Expérience intime' : ''}</div>
        <h1>${esc(e.titre)}</h1>
        <p class="accroche">${esc(e.accroche)}</p>
        <p class="meta">${m.map(esc).join(' · ')}${vecue ? ' · Déjà vécue ' + (vecue > 1 ? vecue + ' fois' : 'une fois') : ''}</p>
      </header>
      <div class="exp-cols">
        <div>
          <div class="exp-bloc"><h3>Ce qu’il vous faut</h3><p>${esc(e.ilVousFaut)}</p></div>
          <div class="exp-bloc"><h3>Avant de commencer</h3><p>${esc(e.avant)}</p></div>
          <div class="exp-bloc"><h3>Comment ça se passe</h3><p>${esc(e.mecanique)}. ${e.etapes.length > 1 ? e.etapes.length + ' temps, dévoilés un par un.' : 'Un seul temps, guidé.'} On ne vous montre pas tout à l’avance : la surprise fait partie de l’expérience.</p></div>
          ${e.intime ? '<div class="encart encart--intime"><strong>Chacun peut arrêter, modifier ou passer une consigne.</strong>À tout moment, sans avoir à l’expliquer. Rien ici ne mène quelque part où l’un de vous n’a pas envie d’aller.</div>' : ''}
          <p class="note"><a class="lien-aide" href="#/aide">Si votre relation vous fait peur</a></p>
          ${!ok ? `<div class="membre-encart"><div class="surtitre">Accès membre</div><h2>${reservee(e) ? (e.audio ? 'Les audios guidés font partie de l’accès membre.' : 'La nouveauté de la semaine est réservée aux membres.') : `Vous avez utilisé vos ${quota()} expériences offertes.`}</h2><p>Les ${EXP.length} expériences restent à portée de regard. L’accès membre les ouvre toutes, et la bibliothèque grandit chaque semaine. Celles que vous avez déjà commencées restent ouvertes.</p><ul><li>Toute la bibliothèque, ${EXP.length} expériences aujourd’hui</li><li>Une nouvelle expérience chaque semaine</li><li>Les audios guidés</li><li>Les collections de saison</li></ul><a class="btn" href="#/membre">Voir l’accès membre</a></div>` : ''}
        </div>
        <aside class="exp-cote">
          ${ok ? `<a class="btn" href="#/jouer/${e.id}">Commencer l’expérience</a>` : '<button class="btn" disabled>Réservée aux membres</button>'}
          ${!estMembre() ? `<p class="quota">${reservee(e) && !dejaEssayee(e) ? 'Expérience membre : elle ne compte pas dans vos expériences offertes.' : (!ok ? `Vos ${quota()} expériences offertes sont utilisées.` : (dejaEssayee(e) ? 'Déjà commencée : elle reste ouverte pour vous.' : `Expérience offerte : il vous en reste ${essaisRestants()} sur ${quota()}. La commencer en utilise une.`))}</p>` : ''}
          ${!ok && !reservee(e) ? blocCadeau() : ''}
          <button class="btn btn--secondaire" data-act="fav" data-id="${e.id}">${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}</button>
          <button class="btn btn--secondaire" data-act="afaire" data-id="${e.id}">${af ? 'Retirer de « À faire ensemble »' : 'Ajouter à « À faire ensemble »'}</button>
          ${colls.length ? `<div class="encart"><strong>Dans les collections</strong>${colls.map((c) => `<a href="#/collection/${c.id}" style="display:block;color:var(--ambre)">${esc(c.nom)}</a>`).join('')}</div>` : ''}
        </aside>
      </div>
    `);
  }

  /* ------------------------------------------------------------ */
  /* Surprends-nous                                                  */
  let surprise = { temps: '', lieu: '', energie: '' };
  function vueSurprends(q) {
    if (q.go === '1' && surprise.temps && surprise.lieu && surprise.energie) return scenerieSurprise();
    const groupe = (k, titre, liste) => `<div class="filtre"><span>${titre}</span><div class="puces">${liste.map((o) => `<button class="puce ${surprise[k] === o.id ? 'actif' : ''}" data-act="surp" data-k="${k}" data-v="${o.id}">${esc(o.nom)}</button>`).join('')}</div></div>`;
    const pret = surprise.temps && surprise.lieu && surprise.energie;
    rendre(`
      <section class="hero"><div class="surtitre">Surprends-nous</div><h1>Ce soir, Besoin d’Alchimie choisit pour vous.</h1><p>Dites-nous simplement de combien de temps et d’énergie vous disposez. On s’occupe du reste.</p></section>
      <div class="filtres">
        ${groupe('temps', 'Temps', BA.temps.map((t) => ({ id: t.id, nom: t.court })))}
        ${groupe('lieu', 'Lieu', BA.lieux)}
        ${groupe('energie', 'Énergie', BA.energies)}
      </div>
      <div class="actions"><button class="btn" data-act="surp-go" ${pret ? '' : 'disabled'}>Choisissez pour nous</button></div>
    `);
  }
  function scenerieSurprise() {
    const cand = filtrer({ temps: surprise.temps, lieu: surprise.lieu, energie: surprise.energie }).filter(accessible);
    let liste = cand;
    if (!liste.length) liste = filtrer({ temps: surprise.temps, energie: surprise.energie }).filter(accessible);
    if (!liste.length) liste = filtrer({ temps: surprise.temps }).filter(accessible);
    if (!liste.length) liste = EXP.filter(accessible);
    const choisie = hasard(liste);
    const phrases = ['On regarde ce que vous avez devant vous.', 'On écarte ce qui demanderait trop.', 'On en garde une.'];
    rendre(`
      <div class="surprise-scene">
        <div>
          <div class="alambic"><svg viewBox="-15 0 130 100"><defs><linearGradient id="braise" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB547"/><stop offset=".5" stop-color="#FF5A36"/><stop offset="1" stop-color="#F0326F"/></linearGradient></defs><path class="haut" d="M50 22 L74 64 L26 64 Z"/><path class="bas" d="M50 78 L26 36 L74 36 Z"/></svg></div>
          <p class="phrase" id="phrase">${phrases[0]}</p>
        </div>
      </div>
    `);
    plusTard(() => { const p = $('#phrase'); if (p) p.textContent = phrases[1]; }, 900);
    plusTard(() => { const p = $('#phrase'); if (p) p.textContent = phrases[2]; }, 1700);
    plusTard(() => {
      rendre(`
        <section class="hero"><div class="surtitre">Surprends-nous</div><h1>Ce soir, ce sera celle-ci.</h1><p>${cand.length ? 'Elle correspond à ce que vous nous avez dit.' : 'Rien ne collait exactement, alors on a élargi un peu.'}</p></section>
        <div class="surprise-res grille grille--2">${carte(choisie)}</div>
        <div class="actions"><a class="btn" href="#/jouer/${choisie.id}">On la fait</a><button class="btn btn--secondaire" data-act="surp-go">Une autre</button><a class="btn btn--discret" href="#/surprends">Changer les critères</a></div>
      `);
    }, 2500);
  }

  /* ------------------------------------------------------------ */
  /* Notre couple                                                    */
  function vueCouple(o) {
    const onglets = [['vecues', 'Vécues'], ['favoris', 'Favoris'], ['afaire', 'À faire ensemble'], ['souvenirs', 'Souvenirs'], ['reponses', 'Nos réponses'], ['envies', 'Nos envies'], ['canari', 'Le Canari']];
    let corps = '';
    if (o === 'vecues') {
      const l = S.vecues.slice().reverse();
      corps = `<p class="muted" style="margin-bottom:14px">Les moments que vous avez déjà partagés ici.</p>` + (l.length ? `<div class="liste">${l.map((v) => { const e = exp(v.id); return e ? `<a class="ligne" href="#/experience/${e.id}"><div class="ligne__corps"><div class="ligne__titre">${esc(e.titre)}</div><div class="ligne__sous">${esc(terr(e.territoire).nom)} · ${dateFr(v.date)}</div></div></a>` : ''; }).join('')}</div>` : '<div class="vide">Rien encore. La première viendra vite.</div>');
    } else if (o === 'favoris') {
      corps = `<p class="muted" style="margin-bottom:14px">Les idées que vous avez envie de garder sous le coude.</p>` + grille(S.favoris.map(exp).filter(Boolean), 'Pas encore de favoris. L’icône en bas des cartes sert à ça.');
    } else if (o === 'afaire') {
      corps = `<p class="muted" style="margin-bottom:14px">Votre liste commune. Ce que vous vous êtes promis de vivre, un de ces soirs.</p>` + grille(S.aFaire.map(exp).filter(Boolean), 'La liste est vide. Depuis une expérience, « Ajouter à À faire ensemble ».');
    } else if (o === 'souvenirs') {
      const l = S.souvenirs.slice().reverse();
      corps = `<p class="muted" style="margin-bottom:14px">Ce que vous avez choisi de garder. Photos, phrases, lettres scellées.</p>` + (l.length ? `<div class="grille grille--2">${l.map(carteSouvenir).join('')}</div>` : '<div class="vide">Votre coffre est vide. Après une expérience, on vous proposera d’y mettre quelque chose.</div>');
    } else if (o === 'reponses') {
      const ids = Object.keys(S.reponses);
      corps = `<p class="muted" style="margin-bottom:14px">Uniquement ce que vous avez explicitement choisi de conserver.</p>` + (ids.length ? ids.map((id) => { const e = exp(id), r = S.reponses[id]; if (!e) return ''; return `<div class="souvenir" style="margin-bottom:12px"><div class="surtitre">${esc(e.titre)} · ${dateFr(r.date)}</div>${Object.keys(r.questions).map((qid) => `<div class="revel__q" style="margin-top:8px">${esc(r.questions[qid])}</div><div class="revel__rep"><div class="rep"><small>${esc(nom('A'))}</small><div class="txt">${esc(r.rep.A[qid] || '…')}</div></div><div class="rep"><small>${esc(nom('B'))}</small><div class="txt">${esc(r.rep.B[qid] || '…')}</div></div></div>`).join('')}<button class="btn btn--discret btn--petit" data-act="rep-suppr" data-id="${id}" style="align-self:flex-start">Ne plus conserver</button></div>`; }).join('') : '<div class="vide">Aucune réponse conservée. C’est le cas par défaut.</div>');
    } else if (o === 'envies') {
      const types = ['Restaurant', 'Activité', 'Destination', 'À essayer'];
      corps = `<p class="muted">Restaurants, activités, destinations, choses que vous aimeriez essayer ensemble.</p>
        <div class="ajout"><input type="text" id="envie-txt" placeholder="Une envie" /><select id="envie-type">${types.map((t) => `<option>${t}</option>`).join('')}</select><select id="envie-par"><option value="A">${esc(nom('A'))}</option><option value="B">${esc(nom('B'))}</option></select><button class="btn btn--petit" data-act="envie-add">Ajouter</button></div>
        <div class="liste" style="margin-top:16px">${S.envies.length ? S.envies.slice().reverse().map((v) => `<div class="ligne"><div class="ligne__corps"><div class="ligne__titre">${esc(v.texte)}</div><div class="ligne__sous">${esc(v.type)} · proposé par ${esc(nom(v.par))}</div></div><button class="btn btn--discret btn--petit" data-act="envie-suppr" data-id="${v.id}">Retirer</button></div>`).join('') : '<div class="vide">La liste est vide. Une envie à la fois.</div>'}</div>`;
    } else if (o === 'canari') {
      const dedans = S.canari.filter((c) => !c.tire), tirees = S.canari.filter((c) => c.tire).reverse();
      corps = `<p class="muted">Chacun y glisse une idée, discrètement. Quand vous ne savez pas quoi faire, vous en tirez une au hasard.</p>
        <div class="canari" id="canari">${svgCanari(dedans.length)}</div>
        <p class="center compte">${dedans.length ? dedans.length + ' idée' + (dedans.length > 1 ? 's' : '') + ' dans le Canari' : 'Le Canari est vide'}</p>
        <div class="actions" style="justify-content:center"><button class="btn" data-act="canari-tirer" ${dedans.length ? '' : 'disabled'}>Tirer une idée</button>${!S.canari.length ? '<button class="btn btn--discret" data-act="canari-exemples">Mettre quelques exemples</button>' : ''}</div>
        <div id="idee"></div>
        <div class="ajout"><input type="text" id="canari-txt" placeholder="J’aimerais qu’on…" /><select id="canari-par"><option value="A">${esc(nom('A'))}</option><option value="B">${esc(nom('B'))}</option></select><button class="btn btn--petit" data-act="canari-add">Glisser</button></div>
        <p class="note">L’autre ne voit pas ce que vous glissez. Il le découvrira au tirage.</p>
        ${tirees.length ? `<hr class="sep"><h3 style="margin-bottom:10px">Déjà tirées</h3><div class="liste">${tirees.map((c) => `<div class="ligne"><div class="ligne__corps"><div class="ligne__titre">${esc(c.texte)}</div><div class="ligne__sous">glissée par ${esc(nom(c.par))}</div></div><button class="btn btn--discret btn--petit" data-act="canari-remettre" data-id="${c.id}">Remettre</button></div>`).join('')}</div>` : ''}`;
    }
    rendre(`
      <section class="hero"><div class="surtitre">Notre couple</div><h1>${esc(nom('A'))} et ${esc(nom('B'))}</h1><p>Pas de score, pas de diagnostic. Ce que vous avez vécu, ce que vous gardez, ce que vous voulez encore.</p></section>
      <div class="onglets">${onglets.map(([id, n]) => `<a href="#/couple?o=${id}" class="${o === id ? 'actif' : ''}">${n}</a>`).join('')}</div>
      ${corps}
    `);
  }

  function svgCanari(n) {
    const papiers = Math.min(3, Math.max(n ? 1 : 0, Math.ceil(n / 2)));
    const slips = [[70, 120, -8], [95, 110, 6], [120, 125, -3]].slice(0, papiers).map(([x, y, r]) => `<g class="papier"><rect x="${x}" y="${y}" width="26" height="16" rx="2" fill="#FFF1EA" transform="rotate(${r} ${x + 13} ${y + 8})"/></g>`).join('');
    /* La jarre en terre, rougie comme une braise : corps en dégradé flamme vers fuchsia. */
    return `<svg viewBox="0 0 200 220" aria-hidden="true">
      <defs>
        <linearGradient id="jarre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A45"/><stop offset=".55" stop-color="#F0326F"/><stop offset="1" stop-color="#8E1446"/></linearGradient>
        <radialGradient id="lueur" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#F0326F" stop-opacity=".45"/><stop offset="1" stop-color="#F0326F" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="100" cy="130" rx="98" ry="92" fill="url(#lueur)"/>
      <path d="M62 40 Q100 30 138 40 L146 60 Q170 90 160 150 Q150 200 100 205 Q50 200 40 150 Q30 90 54 60 Z" fill="url(#jarre)"/>
      <path d="M62 40 Q100 30 138 40 L146 60 Q100 72 54 60 Z" fill="#7A1235"/>
      <ellipse cx="100" cy="40" rx="38" ry="9" fill="#110A0D" stroke="#FFB547" stroke-width="1.5"/>
      <path d="M54 62 Q100 76 146 62" fill="none" stroke="#FFB547" stroke-width="1.5" opacity=".7"/>
      <path d="M48 120 Q100 136 152 120" fill="none" stroke="#FFF1EA" stroke-width="1" opacity=".25"/>
      ${slips}
    </svg>`;
  }

  function carteSouvenir(s) {
    const e = exp(s.expId);
    const scelle = s.scelle && new Date(s.scelle.ouvrir) > new Date();
    return `<div class="souvenir ${scelle ? 'scelle' : ''}">
      ${s.photo ? `<img src="${s.photo}" alt="" />` : ''}
      ${s.texte ? `<div class="txt">${esc(s.texte)}</div>` : ''}
      <div class="date">${e ? esc(e.titre) + ' · ' : ''}${dateFr(s.date)}${s.par ? ' · ' + esc(nom(s.par)) : ''}</div>
      ${scelle ? `<div class="encart"><strong>Lettre scellée</strong>À ouvrir le ${dateFr(s.scelle.ouvrir)}. <button class="btn btn--discret btn--petit" data-act="souv-ouvrir" data-id="${s.id}">Ouvrir quand même (prototype)</button></div>` : ''}
      <button class="btn btn--discret btn--petit" data-act="souv-suppr" data-id="${s.id}" style="align-self:flex-start">Retirer</button>
    </div>`;
  }

  /* ------------------------------------------------------------ */
  /* Installer l'application (PWA)                                   */
  let invitation = null;
  window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); invitation = ev; if (location.hash.indexOf('/profil') > -1) vueProfil(); });
  window.addEventListener('appinstalled', () => { invitation = null; mesure('App installée'); toast('Besoin d\u2019Alchimie est sur votre écran d\u2019accueil.'); });
  const installee = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const iOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const encadree = () => { try { return window.self !== window.top; } catch (e) { return true; } };
  function blocInstaller() {
    if (encadree()) return '';   // affiché dans un cadre (Artifact) : l'installation y est impossible
    if (installee()) return '<div class="profil-bloc"><h3>Application</h3><p class="muted small">Vous utilisez l\u2019application installée.</p></div>';
    let corps;
    if (invitation) corps = '<p class="muted small">Ajoutez Besoin d\u2019Alchimie à votre écran d\u2019accueil : il s\u2019ouvre en plein écran, comme une application, même sans connexion.</p><div class="actions"><button class="btn" data-act="installer">Installer l\u2019application</button></div>';
    else if (dansAppli()) corps = '<p class="muted small">' + consigneAppli() + '</p>';
    else if (iOS()) corps = '<p class="muted small">Sur iPhone, ouvrez cette page dans Safari, touchez le bouton Partager (le carré avec une flèche vers le haut), puis « Sur l\u2019écran d\u2019accueil ».</p><p class="note">L\u2019application installée garde ses propres données : ce que vous avez enregistré dans Safari n\u2019y sera pas.</p>';
    else corps = '<p class="muted small">Dans le menu de votre navigateur, choisissez « Installer l\u2019application » ou « Ajouter à l\u2019écran d\u2019accueil ».</p>';
    return '<div class="profil-bloc"><h3>Sur votre écran d\u2019accueil</h3>' + corps + '</div>';
  }

  /* Invitation à installer, une fois que le couple a goûté à l'app.
     Téléphone uniquement, sur l'accueil, jamais pendant une expérience ;
     trois fois au plus, espacées de dix jours. Chaque navigateur installe
     à sa façon : Chrome sur Android propose son propre bouton, Safari sur
     iPhone passe par Partager, et les navigateurs intégrés (Instagram,
     Facebook, TikTok) ne savent pas installer du tout. */
  const mobile = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /macintosh/i.test(navigator.userAgent));
  const nomAppli = () => { const u = navigator.userAgent; if (/Instagram/i.test(u)) return 'Instagram'; if (/FBAN|FBAV|FB_IAB/i.test(u)) return 'Facebook'; if (/TikTok|musical_ly|BytedanceWebview/i.test(u)) return 'TikTok'; if (/Snapchat/i.test(u)) return 'Snapchat'; if (/LinkedInApp/i.test(u)) return 'LinkedIn'; return ''; };
  const dansAppli = () => !!nomAppli();
  const icoPartager = '<svg class="ico-partager" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M8 10H5v11h14V10h-3"/></svg>';
  const consigneAppli = () => `Vous lisez cette page dans ${nomAppli()}, qui ne permet pas d’installer une application. Ouvrez-la d’abord dans ${iOS() ? 'Safari' : 'Chrome'} : touchez <b>⋯</b> en haut à droite, puis « Ouvrir dans le navigateur ». Ou copiez le lien et collez-le dans ${iOS() ? 'Safari' : 'Chrome'}.`;

  function proposerInstallation() {
    if (encadree() || installee() || !mobile() || ancienneAdresse()) return;
    if (!S.majeurs || !S.onboarded) return;
    if (!S.premiereVisite) { S.premiereVisite = new Date().toISOString(); sauver(); }
    const inv = S.invitationApp || { fois: 0, dernier: null };
    if (inv.fois >= 3) return;
    if (inv.dernier && Date.now() - new Date(inv.dernier).getTime() < 10 * 864e5) return;
    const goute = essais().length > 0 || S.vecues.length > 0 || Date.now() - new Date(S.premiereVisite).getTime() > 864e5;
    if (!goute) return;
    plusTard(() => {
      const h = (location.hash.replace(/^#/, '') || '/').split('?')[0];
      if (h === '/' && !$('.dialogue')) ouvrirInvitation();
    }, 3000);
  }

  function fermerInvitation() { $$('.dialogue--invite').forEach((d) => d.remove()); const v = $('#voile'); if (v) v.hidden = true; }

  function ouvrirInvitation() {
    const inv = S.invitationApp || { fois: 0, dernier: null };
    S.invitationApp = { fois: inv.fois + 1, dernier: new Date().toISOString() }; sauver();
    const cas = dansAppli() ? 'appli' : (invitation ? 'bouton' : (iOS() ? 'iphone' : 'menu'));
    mesure('Invitation installer', cas);
    const intro = '<p class="corps">Le soir où l’envie vient, pas besoin de retrouver le lien : la braise vous attend à côté de vos autres applications. Elle s’ouvre en plein écran, même sans réseau.</p>';
    let corps, actions;
    if (cas === 'appli') {
      corps = `<p class="corps">${consigneAppli()}</p>`;
      actions = '<button class="btn" data-act="inv-copier">Copier le lien</button>';
    } else if (cas === 'bouton') {
      corps = intro;
      actions = '<button class="btn" data-act="inv-installer">Installer</button>';
    } else if (cas === 'iphone') {
      corps = intro + `<ol class="gestes"><li>Touchez ${icoPartager} <b>Partager</b>, en bas de Safari (ou dans le menu ⋯).</li><li>Choisissez « Sur l’écran d’accueil ». Faites défiler si vous ne le voyez pas.</li><li>Touchez « Ajouter ».</li></ol><p class="note">L’application installée repart de zéro : ce que vous avez enregistré ici reste dans Safari.</p>`;
      actions = '<button class="btn" data-act="inv-fermer">C’est noté</button>';
    } else {
      corps = intro + '<ol class="gestes"><li>Touchez <b>⋮</b> en haut à droite du navigateur.</li><li>Choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».</li></ol>';
      actions = '<button class="btn" data-act="inv-fermer">C’est noté</button>';
    }
    fermerInvitation();
    const d = document.createElement('div');
    d.className = 'dialogue dialogue--invite'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'inv-titre');
    d.innerHTML = `<div class="invite__tete"><img src="assets/icone-braise-192.png" alt="" width="56" height="56" /><div><div class="surtitre">Sur votre téléphone</div><h2 id="inv-titre">Gardez Besoin d’Alchimie sur votre écran d’accueil.</h2></div></div>${corps}<div class="actions">${actions}<button class="btn btn--discret" data-act="inv-fermer">Plus tard</button></div>`;
    const v = $('#voile'); if (v) { v.hidden = false; v.onclick = fermerInvitation; }
    document.body.appendChild(d);
  }

  /* ------------------------------------------------------------ */
  /* Déménagement : l'ancienne adresse GitHub Pages renvoie vers le
     domaine. Pas de redirection automatique : les souvenirs d'un couple
     sont rangés dans le navigateur, adresse par adresse, et ne suivent
     pas. Celui qui en a peut rester le temps de les noter. */
  const NOUVELLE_ADRESSE = 'https://besoindalchimie.com/';
  const ancienneAdresse = () => /github\.io$/i.test(location.hostname);
  function annoncerDemenagement() {
    if (!ancienneAdresse() || encadree()) return false;
    try { if (sessionStorage.getItem('ba-rester')) return false; } catch (e) { /* stockage indisponible */ }
    const garde = S.onboarded && (S.souvenirs.length + S.favoris.length + S.vecues.length + S.canari.length + S.aFaire.length) > 0;
    rendre(`<div class="onb">${marqueSvg}
      <div class="surtitre">Nous avons déménagé</div>
      <h1>Besoin d’Alchimie vit maintenant sur besoindalchimie.com</h1>
      <p class="corps">Même bibliothèque, mêmes expériences, nouvelle adresse.${installee() ? ' Cette icône mène à l’ancienne : installez la nouvelle depuis besoindalchimie.com, puis supprimez celle-ci.' : ' Pensez à mettre à jour le lien dans vos favoris.'}</p>
      <div class="actions actions--col" style="max-width:360px">
        ${garde ? '<button class="btn" data-act="emporter">Emporter nos souvenirs</button><a class="btn btn--secondaire" href="' + NOUVELLE_ADRESSE + '">Y aller sans rien emporter</a><button class="btn btn--discret" data-act="rester">Rester ici pour l’instant</button>' : '<a class="btn" href="' + NOUVELLE_ADRESSE + '">Aller sur besoindalchimie.com</a>'}
      </div>
      ${garde ? '<p class="note">Vos souvenirs, vos favoris, vos réponses et votre Canari sont enregistrés dans ce téléphone, à l’ancienne adresse. « Emporter » les recopie sur la nouvelle, sur ce même téléphone. Rien ne passe par nos serveurs.</p>' : ''}
    </div>`, true);
    return true;
  }

  /* Transfert des données d'une adresse à l'autre, sur le même téléphone.
     L'état voyage dans l'adresse de la nouvelle page, après le # : cette partie
     ne quitte jamais le téléphone (le navigateur ne l'envoie pas au serveur).
     Un onglet séparé aurait permis d'envoyer plus lourd, mais Instagram,
     Facebook et les applications installées l'ouvrent souvent à la place de la
     page de départ, et le transfert se perdait. Les photos suivent tant que
     l'adresse reste sous PLAFOND caractères ; les autres restent à l'ancienne
     adresse, et la nouvelle page le dit. Rien n'est effacé au départ. */
  const PLAFOND = 600000;
  const b64u = (octets) => { let bin = ''; for (let i = 0; i < octets.length; i += 0x8000) bin += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000)); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const deb64u = (t) => { const b = atob(t.replace(/-/g, '+').replace(/_/g, '/')); const o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; };
  async function compresser(obj) {
    const octets = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream === 'undefined') return 'j' + b64u(octets);
    const flux = new Blob([octets]).stream().pipeThrough(new CompressionStream('gzip'));
    return 'g' + b64u(new Uint8Array(await new Response(flux).arrayBuffer()));
  }
  async function decompresser(t) {
    const octets = deb64u(t.slice(1));
    if (t[0] === 'g') return JSON.parse(await new Response(new Blob([octets]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
    return JSON.parse(new TextDecoder().decode(octets));
  }

  async function emporter() {
    mesure('Transfert', 'lancé');
    const etat = JSON.parse(JSON.stringify(S)); delete etat.mesure; delete etat.invitationApp;
    const avecPhoto = (etat.souvenirs || []).filter((sv) => sv && sv.photo);
    const photos = avecPhoto.map((sv) => { const p = sv.photo; delete sv.photo; return p; });
    etat._photosLaissees = photos.length;
    let d = await compresser(etat);
    for (let i = 0; i < avecPhoto.length; i++) {
      avecPhoto[i].photo = photos[i]; etat._photosLaissees--;
      const essai = await compresser(etat);
      if (essai.length > PLAFOND) { delete avecPhoto[i].photo; etat._photosLaissees++; break; }
      d = essai;
    }
    location.href = NOUVELLE_ADRESSE + '#/recevoir?d=' + d;
  }

  let aImporter = null;
  function vueRecevoir(q) {
    if (!q.d) return aller('/');
    /* Les données ne restent pas dans l'historique du navigateur. */
    try { history.replaceState(null, '', location.pathname + location.search + '#/recevoir'); } catch (e) { /* sans historique */ }
    rendre(`<div class="onb">${marqueSvg}<h1>Un instant…</h1></div>`, true);
    decompresser(q.d).then((etat) => confirmerImport(etat)).catch(() => rendre(`<div class="onb">${marqueSvg}<h1>Ce lien est abîmé.</h1><p class="corps">Retournez sur l’ancienne adresse et touchez à nouveau « Emporter nos souvenirs ».</p><div class="actions"><a class="btn btn--secondaire" href="#/">Ouvrir Besoin d’Alchimie</a></div></div>`, true));
  }

  function confirmerImport(etat) {
    if (!etat || typeof etat !== 'object' || Array.isArray(etat)) return aller('/');
    const L = (k) => (Array.isArray(etat[k]) ? etat[k].length : 0);
    aImporter = etat;
    const lignes = [[L('souvenirs'), 'souvenir', 'souvenirs'], [L('vecues'), 'expérience vécue', 'expériences vécues'], [L('favoris'), 'favori', 'favoris'], [L('aFaire'), 'idée « à faire ensemble »', 'idées « à faire ensemble »'], [L('canari'), 'mot dans le Canari', 'mots dans le Canari']].filter((x) => x[0] > 0);
    const prenoms = etat.couple && etat.couple.a ? esc(etat.couple.a) + ' et ' + esc(etat.couple.b || '') : '';
    rendre(`<div class="onb">${marqueSvg}
      <div class="surtitre">Déménagement</div>
      <h1>${prenoms ? prenoms + ', vos' : 'Vos'} souvenirs sont arrivés.</h1>
      ${lignes.length ? `<ul class="gestes">${lignes.map((x) => `<li>${x[0]} ${x[0] > 1 ? x[2] : x[1]}</li>`).join('')}</ul>` : '<p class="corps">Rien à recopier : l’ancienne adresse était vide.</p>'}
      ${etat._photosLaissees ? `<p class="note">${etat._photosLaissees} photo${etat._photosLaissees > 1 ? 's sont restées' : ' est restée'} sur l’ancienne adresse : trop lourdes pour le voyage. Le texte de ces souvenirs, lui, est arrivé.</p>` : ''}
      <div class="actions actions--col" style="max-width:360px">
        <button class="btn" data-act="importer">${S.onboarded ? 'Les ajouter à ce que vous avez ici' : 'Les ranger ici'}</button>
        <a class="btn btn--discret" href="#/">Ne rien ajouter</a>
      </div>
    </div>`, true);
  }

  function importer() {
    const e = aImporter; aImporter = null; if (!e) return aller('/');
    const tab = (v) => (Array.isArray(v) ? v : []);
    const parId = (a, b) => { const ids = new Set(a.map((x) => x && x.id)); return a.concat(tab(b).filter((x) => x && x.id && !ids.has(x.id))); };
    const union = (a, b) => [...new Set(tab(a).concat(tab(b)))];
    if (!S.onboarded) {
      const garder = { mesure: S.mesure, invitationApp: S.invitationApp };
      S = Object.assign(defaut(), e, garder);
      delete S._photosLaissees;
    } else {
      S.souvenirs = parId(S.souvenirs, e.souvenirs);
      S.canari = parId(S.canari, e.canari);
      S.favoris = union(S.favoris, e.favoris); S.aFaire = union(S.aFaire, e.aFaire); S.essais = union(S.essais, e.essais);
      const cle = (v) => v && (v.id + '|' + v.date);
      const deja = new Set(S.vecues.map(cle));
      S.vecues = S.vecues.concat(tab(e.vecues).filter((v) => v && !deja.has(cle(v))));
      if (e.reponses && typeof e.reponses === 'object') S.reponses = Object.assign({}, e.reponses, S.reponses);
      S.membre = S.membre || !!e.membre;
    }
    S.majeurs = S.majeurs || !!e.majeurs;
    sauver(); mesure('Transfert', 'reçu');
    toast('Vos souvenirs sont rangés ici.');
    aller('/');
  }

  /* ------------------------------------------------------------ */
  /* Le cadeau contre l'adresse mail                                 */
  function blocCadeau() {
    if (!FORMULAIRE_BREVO || S.cadeau) return '';
    if (S.inscrit) return `<div class="cadeau"><div class="surtitre">Regardez votre boîte mail</div><h3>Le lien est parti.</h3>
      <p>Touchez-le dans le mail : vos deux expériences s’ouvrent. S’il s’ouvre ailleurs que dans cette application, tapez plutôt le code écrit dans le mail.</p>
      <div class="cadeau__ligne"><input type="text" id="cadeau-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Le code reçu" aria-label="Code reçu par mail" /><button class="btn btn--secondaire" data-act="cadeau-code">Valider</button></div>
      <p class="note">Rien reçu ? Regardez dans les indésirables, ou <button class="lien-bouton" data-act="cadeau-refaire">changez d’adresse</button>.</p></div>`;
    return `<div class="cadeau"><div class="surtitre">Un cadeau pour continuer</div><h3>Deux expériences de plus, offertes.</h3>
      <p>Laissez votre adresse : on vous envoie un lien qui les ouvre tout de suite. Ensuite, de temps en temps, une idée pour vos soirées. Un clic suffit pour ne plus rien recevoir.</p>
      <form class="cadeau__form" data-form="cadeau" novalidate>
        <input type="email" id="cadeau-mail" autocomplete="email" inputmode="email" placeholder="votre@adresse.com" aria-label="Votre adresse mail" />
        <label class="cadeau__accord"><input type="checkbox" id="cadeau-accord" /> <span>J’accepte de recevoir les mails de Besoin d’Alchimie.</span></label>
        <button class="btn" type="submit">Recevoir mes deux expériences</button>
      </form>
      <p class="note">Votre adresse part chez Brevo, notre outil d’envoi, et nulle part ailleurs. Vos prénoms, vos réponses et vos souvenirs restent sur ce téléphone. <a class="lien-aide" href="#/confidentialite">Confidentialité</a></p></div>`;
  }

  function appliquerCadeau(code, depuisLien) {
    const ok = String(code || '').trim().toUpperCase() === CODE_CADEAU;
    if (ok && !S.cadeau) { S.cadeau = true; S.inscrit = true; sauver(); mesure('Cadeau mail', depuisLien ? 'lien' : 'code'); }
    const msg = ok ? 'Deux expériences de plus, offertes. Belle soirée.' : 'Ce code ne correspond pas.';
    if (depuisLien) { aller('/'); setTimeout(() => toast(msg), 500); }
    else { toast(msg); if (ok) rerendre(route); }
  }

  function vueConfidentialite() {
    rendre(`
      <a class="retour" href="#/">← Retour</a>
      <section class="hero"><div class="surtitre">Confidentialité</div><h1>Ce qui reste chez vous, ce qui part.</h1></section>
      <div class="profil-bloc"><h3>Sur votre téléphone, et nulle part ailleurs</h3><p class="muted small">Vos prénoms, vos réponses, vos souvenirs et leurs photos, vos favoris, votre Canari : tout est rangé dans ce navigateur, sur cet appareil. Nous n’y avons pas accès. Effacer les données du site, ou utiliser « Effacer et recommencer » dans le Profil, les supprime.</p></div>
      <div class="profil-bloc"><h3>Votre adresse mail, si vous nous la donnez</h3><p class="muted small">Elle est envoyée à Brevo, l’outil qui envoie nos mails, pour vous adresser le lien de vos deux expériences offertes, puis nos nouvelles. Elle n’est ni vendue ni partagée. Chaque mail contient un lien pour ne plus rien recevoir.</p></div>
      <div class="profil-bloc"><h3>Si vous reliez vos deux téléphones</h3><p class="muted small">Ce que vous partagez (prénoms, favoris, souvenirs et leurs photos, Canari, envies, réponses conservées) est chiffré sur votre téléphone avant de partir vers notre serveur, puis déchiffré sur l’autre téléphone. La clé ne quitte jamais vos téléphones : nous ne pouvons pas lire votre espace. Quitter l’espace commun le supprime de notre serveur.</p></div>
      <div class="profil-bloc"><h3>Ce que l’app compte</h3><p class="muted small">Des compteurs anonymes (quelles expériences sont ouvertes et terminées) restent sur ce téléphone. Vous pouvez les arrêter dans le Profil.</p></div>
      <div class="profil-bloc"><h3>Les polices de caractères</h3><p class="muted small">Elles sont chargées depuis Google Fonts : votre navigateur contacte Google pour les afficher.</p></div>
      <div class="profil-bloc"><h3>Vos droits</h3><p class="muted small">Pour consulter, corriger ou supprimer votre adresse : <a class="lien-aide" href="mailto:contact@besoindalchimie.com">contact@besoindalchimie.com</a>.</p></div>
    `);
  }

  /* ------------------------------------------------------------ */
  /* Nouveauté de la semaine (accueil)                               */
  function blocNouveaute() {
    const e = nouveaute(); if (!e) return '';
    const jours = Math.round((new Date(aujourdhui()) - new Date(e.parution)) / 864e5);
    return `<section class="section">
        <div class="section__tete"><div><h2>${jours < 7 ? 'Nouvelle cette semaine' : 'La dernière nouveauté'}</h2><p class="section__sous">${estMembre() ? 'Une expérience de plus chaque semaine, pour les membres.' : 'Chaque semaine, une expérience de plus pour les membres. <a class="lien-aide" href="#/membre">L’accès membre</a>'}</p></div></div>
        <div class="grille grille--une">${carte(e)}</div>
      </section>`;
  }

  /* ------------------------------------------------------------ */
  /* L'accès membre : ce qu'il change, et la liste d'attente         */
  function vueMembre() {
    const nAudio = EXP.filter((e) => e.audio).length;
    const nSaison = BA.collections.filter((c) => c.saison).length;
    const oui = '<span class="cmp-oui" aria-label="Oui">✓</span>', non = '<span class="cmp-non">Non</span>';
    const lignes = [
      ['Expériences', quota() + ' au choix', 'Toutes (' + EXP.length + ')'],
      ['Une nouvelle expérience chaque semaine', non, oui],
      ['Les audios guidés' + (nAudio ? ' (' + nAudio + ')' : ''), non, oui],
      ['Les collections de saison' + (nSaison ? '' : ''), non, oui],
      ['Vos deux téléphones reliés, chiffrés de bout en bout', non, oui],
      ['Favoris, souvenirs, Canari, Surprends-nous', oui, oui],
      ['Vos données restent sur votre téléphone', oui, oui]
    ];
    let attente;
    if (estMembre()) attente = '<div class="profil-bloc"><h3>Vous êtes membre.</h3><p class="muted small">Toute la bibliothèque est ouverte sur ce téléphone.</p></div>';
    else if (S.attente) attente = '<div class="cadeau"><div class="surtitre">C’est noté</div><h3>On vous écrit le jour de l’ouverture.</h3><p>Votre adresse est sur la liste. Rien d’autre à faire d’ici là.</p></div>';
    else if (FORMULAIRE_ATTENTE) attente = `<div class="cadeau"><div class="surtitre">Bientôt</div><h3>L’accès membre ouvre bientôt.</h3><p>Laissez votre adresse : on vous écrit le jour de l’ouverture, avec le prix. Pas d’engagement, aucun paiement d’ici là.</p>
        <form class="cadeau__form" data-form="attente" novalidate>
          <input type="email" id="attente-mail" autocomplete="email" inputmode="email" placeholder="votre@adresse.com" aria-label="Votre adresse mail" />
          <label class="cadeau__accord"><input type="checkbox" id="attente-accord" /> <span>J’accepte de recevoir les mails de Besoin d’Alchimie.</span></label>
          <button class="btn" type="submit">Prévenez-moi à l’ouverture</button>
        </form>
        <p class="note">Votre adresse part chez Brevo, notre outil d’envoi, et nulle part ailleurs. <a class="lien-aide" href="#/confidentialite">Confidentialité</a></p></div>`;
    else attente = '<div class="cadeau"><div class="surtitre">Bientôt</div><h3>L’accès membre ouvre bientôt.</h3><p>Pour être prévenus le jour de l’ouverture, écrivez-nous un mot : <a class="lien-aide" href="mailto:contact@besoindalchimie.com?subject=Pr%C3%A9venez-nous%20%C3%A0%20l%E2%80%99ouverture">contact@besoindalchimie.com</a>.</p></div>';
    rendre(`
      <a class="retour" href="#/">← Retour</a>
      <section class="hero"><div class="surtitre">L’accès membre</div><h1>Vous ne tombez jamais à court.</h1>
        <p>En Découverte, vous vivez ${quota()} soirées au choix. Ensuite, la bibliothèque reste là, mais elle ne s’ouvre plus. Membre, elle s’ouvre en entier et elle grandit : une expérience de plus chaque semaine.</p></section>
      <div class="comparatif" role="table" aria-label="Découverte et accès membre">
        <div class="cmp-ligne cmp-tete" role="row"><span role="columnheader"></span><span role="columnheader">Découverte</span><span role="columnheader">Membre</span></div>
        ${lignes.map((l) => `<div class="cmp-ligne" role="row"><span role="rowheader">${l[0]}</span><span role="cell">${l[1]}</span><span role="cell">${l[2]}</span></div>`).join('')}
      </div>
      ${attente}
    `);
  }

  /* ------------------------------------------------------------ */
  /* Deux téléphones, un même espace de couple (membres)             */
  /* Chiffrement de bout en bout. La clé (32 octets) naît sur le premier téléphone et
     voyage dans le lien ou le QR code après le # : elle n'atteint jamais le serveur.
     Le serveur ne reçoit qu'un jeton tiré de la clé (HMAC) et des blocs AES-GCM.
     Partagé : prénoms, favoris, à faire, expériences vécues, souvenirs et leurs photos,
     Canari, envies, réponses conservées. Jamais une réponse secrète en cours : elles ne
     vivent que dans la séance.
     Fusion à trois voies (dernier état commun, ce téléphone, l'autre) : un ajout ou un
     retrait fait d'un côté passe de l'autre, sans doublon ; si les deux ont changé la
     même chose, la modification l'emporte sur la suppression. */
  const API_ESPACES = 'https://api.besoindalchimie.com/v1';
  const PARTAGE = ['couple', 'favoris', 'aFaire', 'vecues', 'souvenirs', 'canari', 'envies', 'reponses', 'essais', 'membre', 'majeurs', 'onboarded'];
  const RE_ESPACE = /^[A-Za-z0-9_-]{22}$/, RE_CLE = /^[A-Za-z0-9_-]{43}$/;
  const aleatoire = (n) => crypto.getRandomValues(new Uint8Array(n));
  const jetons = {};
  async function jetonDe(cle) {
    if (jetons[cle]) return jetons[cle];
    const k = await crypto.subtle.importKey('raw', deb64u(cle), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    jetons[cle] = b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode('besoin-alchimie/jeton-espace'))));
    return jetons[cle];
  }
  async function cleAES(cle) { return crypto.subtle.importKey('raw', deb64u(cle), 'AES-GCM', false, ['encrypt', 'decrypt']); }
  async function chiffrer(cle, octets) {
    const iv = aleatoire(12);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await cleAES(cle), octets));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out;
  }
  async function dechiffrer(cle, octets) { return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: octets.slice(0, 12) }, await cleAES(cle), octets.slice(12))); }
  async function gz(octets, sens) {
    if (typeof CompressionStream === 'undefined') return octets;
    const flux = new Blob([octets]).stream().pipeThrough(sens ? new DecompressionStream('gzip') : new CompressionStream('gzip'));
    return new Uint8Array(await new Response(flux).arrayBuffer());
  }
  /* Le document partagé : 1 octet de format (1 = gzip, 0 = brut), puis le JSON. */
  async function ecrireDoc(cle, doc) {
    const brut = new TextEncoder().encode(JSON.stringify(doc));
    const zip = typeof CompressionStream !== 'undefined';
    const corps = zip ? await gz(brut, false) : brut;
    const tout = new Uint8Array(corps.length + 1); tout[0] = zip ? 1 : 0; tout.set(corps, 1);
    return b64u(await chiffrer(cle, tout));
  }
  async function lireDoc(cle, data) {
    const tout = await dechiffrer(cle, deb64u(data));
    const corps = tout.slice(1);
    return JSON.parse(new TextDecoder().decode(tout[0] === 1 ? await gz(corps, true) : corps));
  }
  async function appelEspace(methode, chemin, lien, corps, brut) {
    const h = { Authorization: 'Bearer ' + (await jetonDe(lien.cle)) };
    let body;
    if (brut) { body = brut; h['Content-Type'] = 'application/octet-stream'; }
    else if (corps) { body = JSON.stringify(corps); h['Content-Type'] = 'application/json'; }
    return fetch(API_ESPACES + '/espaces/' + lien.id + chemin, { method: methode, headers: h, body, cache: 'no-store' });
  }

  /* ---------- Ce qui est partagé, et la fusion ---------- */
  const copie = (x) => (x === undefined ? null : JSON.parse(JSON.stringify(x)));
  function partage(s) {
    const d = {};
    PARTAGE.forEach((k) => { d[k] = copie(s[k]); });
    if (Array.isArray(d.souvenirs)) d.souvenirs = d.souvenirs.map((x) => { const c = Object.assign({}, x); if (c.photo) { delete c.photo; c.p = 1; } return c; });
    return d;
  }
  const cleElement = (x) => {
    if (x === null || typeof x !== 'object') return 'v:' + JSON.stringify(x);
    const ks = Object.keys(x);
    if (x.id && x.date && ks.length === 2) return 'd:' + x.id + '|' + x.date;   // expériences vécues
    if (x.id) return 'i:' + x.id;
    return 'j:' + JSON.stringify(x);
  };
  const pareil = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /* Règle commune aux listes et aux objets, élément par élément. */
  function trancher(enB, enL, enR, vb, vl, vr) {
    if (enL && enR) return { garde: true, v: !pareil(vl, vb) ? vl : vr };
    if (enL) return enB && pareil(vl, vb) ? { garde: false } : { garde: true, v: vl };   // retiré de l'autre côté, sauf si modifié ici
    if (enR) return enB && pareil(vr, vb) ? { garde: false } : { garde: true, v: vr };   // retiré ici, sauf si modifié de l'autre côté
    return { garde: false };
  }
  function fusionListe(b, l, r) {
    const mb = new Map((b || []).map((x) => [cleElement(x), x]));
    const ml = new Map((l || []).map((x) => [cleElement(x), x]));
    const mr = new Map((r || []).map((x) => [cleElement(x), x]));
    const ordre = [...new Set([...mr.keys(), ...ml.keys()])];
    const res = [];
    ordre.forEach((k) => { const t = trancher(mb.has(k), ml.has(k), mr.has(k), mb.get(k), ml.get(k), mr.get(k)); if (t.garde) res.push(t.v); });
    return res;
  }
  function fusionObjet(b, l, r) {
    b = b || {}; l = l || {}; r = r || {};
    const res = {};
    [...new Set([...Object.keys(r), ...Object.keys(l)])].forEach((k) => { const t = trancher(k in b, k in l, k in r, b[k], l[k], r[k]); if (t.garde) res[k] = t.v; });
    return res;
  }
  function fusionner(b, l, r) {
    const out = {};
    PARTAGE.forEach((k) => {
      const vb = b ? b[k] : undefined, vl = l[k], vr = r[k];
      if (typeof vl === 'boolean' || typeof vr === 'boolean') out[k] = !!vl || !!vr;
      else if (Array.isArray(vl) || Array.isArray(vr)) out[k] = fusionListe(vb, vl, vr);
      else if ((vl && typeof vl === 'object') || (vr && typeof vr === 'object')) out[k] = fusionObjet(vb, vl, vr);
      else out[k] = vl !== undefined && vl !== null ? vl : vr;
    });
    return out;
  }
  function appliquer(doc) {
    const photos = {};
    (S.souvenirs || []).forEach((s) => { if (s.photo) photos[s.id] = s.photo; });
    PARTAGE.forEach((k) => { if (doc[k] !== null && doc[k] !== undefined) S[k] = copie(doc[k]); });
    S.souvenirs = (S.souvenirs || []).map((s) => { const c = Object.assign({}, s); if (photos[c.id]) c.photo = photos[c.id]; return c; });
  }

  /* ---------- Photos : chiffrées une par une ---------- */
  const octetsDePhoto = (dataUrl) => { const b = atob(dataUrl.split(',')[1] || ''); const o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; };
  const photoDeOctets = (o) => { let s = ''; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode.apply(null, o.subarray(i, i + 0x8000)); return 'data:image/jpeg;base64,' + btoa(s); };
  async function envoyerPhotos(lien) {
    lien.photos = Array.isArray(lien.photos) ? lien.photos : [];
    for (const s of S.souvenirs || []) {
      if (!s.photo || lien.photos.includes(s.id)) continue;
      const r = await appelEspace('PUT', '/photos/' + s.id, lien, null, await chiffrer(lien.cle, octetsDePhoto(s.photo)));
      if (r.ok) lien.photos.push(s.id);
    }
  }
  async function recupererPhotos(lien) {
    lien.photos = Array.isArray(lien.photos) ? lien.photos : [];
    let nouvelles = 0;
    for (const s of S.souvenirs || []) {
      if (!s.p || s.photo) continue;
      const r = await appelEspace('GET', '/photos/' + s.id, lien);
      if (!r.ok) continue;
      s.photo = photoDeOctets(await dechiffrer(lien.cle, new Uint8Array(await r.arrayBuffer())));
      if (!lien.photos.includes(s.id)) lien.photos.push(s.id);
      nouvelles++;
    }
    return nouvelles;
  }

  /* ---------- La synchronisation ---------- */
  let enSync = false, aRefaire = false, minuteurSync = null;
  function planifierSync(ms) { clearTimeout(minuteurSync); minuteurSync = setTimeout(() => synchroniser(), ms || 0); }
  function rafraichirVue() {
    if (document.querySelector('.jeu') || document.querySelector('.dialogue')) return;
    const a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
    rerendre(route);
  }
  function espaceFerme() {
    S.lien = null; ecrireLocal();
    toast('Votre espace commun est fermé. Tout ce qui est sur ce téléphone reste là.');
    rafraichirVue();
  }
  async function synchroniser() {
    const lien = S.lien; if (!lien) return false;
    if (enSync) { aRefaire = true; return false; }
    enSync = true;
    try {
      for (let essai = 0; essai < 4; essai++) {
        const r = await appelEspace('GET', '/etat', lien);
        if (r.status === 410 || r.status === 404) { espaceFerme(); return false; }
        if (!r.ok) throw new Error('lecture ' + r.status);
        const distant = await r.json();
        const docR = distant.data ? await lireDoc(lien.cle, distant.data) : null;
        const avant = JSON.stringify(partage(S));
        const fusion = docR ? fusionner(lien.base || {}, partage(S), docR) : partage(S);
        appliquer(fusion);
        const photosRecues = await recupererPhotos(lien);
        await envoyerPhotos(lien);
        let version = distant.version;
        if (!docR || !pareil(fusion, docR)) {
          const w = await appelEspace('PUT', '/etat', lien, { base: distant.version, data: await ecrireDoc(lien.cle, fusion) });
          if (w.status === 409) continue;   // l'autre téléphone vient d'écrire : on refusionne
          if (w.status === 410 || w.status === 404) { espaceFerme(); return false; }
          if (!w.ok) throw new Error('écriture ' + w.status);
          version = (await w.json()).version;
        }
        if (S.lien !== lien) return false;
        lien.base = fusion; lien.version = version; lien.derniere = new Date().toISOString(); lien.erreur = null;
        ecrireLocal();
        if (photosRecues || JSON.stringify(partage(S)) !== avant) rafraichirVue();
        return true;
      }
      throw new Error('trop de conflits');
    } catch (e) {
      if (S.lien === lien) { lien.erreur = navigator.onLine === false ? 'hors-ligne' : 'serveur'; ecrireLocal(); }
      return false;
    } finally {
      enSync = false;
      if (aRefaire) { aRefaire = false; planifierSync(400); }
    }
  }
  setInterval(() => { if (S.lien && !document.hidden) synchroniser(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.lien) synchroniser(); });
  window.addEventListener('online', () => { if (S.lien) synchroniser(); });

  /* ---------- Créer, montrer le QR, rejoindre, quitter ---------- */
  const autreQue = (qui) => (qui === 'A' ? 'B' : 'A');
  const lienRejoindre = (l) => location.origin + location.pathname + '#/rejoindre?e=' + l.id + '&k=' + l.cle;
  function ilya(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'à l’instant';
    if (s < 3600) return 'il y a ' + Math.round(s / 60) + ' min';
    if (s < 86400) return 'il y a ' + Math.round(s / 3600) + ' h';
    return 'le ' + dateFr(iso);
  }
  let qrPret = null;
  function chargerQR() {
    if (window.qrcode) return Promise.resolve();
    if (!qrPret) qrPret = new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'js/qrcode.js?v=1'; s.onload = ok; s.onerror = () => { qrPret = null; ko(); }; document.head.appendChild(s); });
    return qrPret;
  }

  function blocTelephones() {
    if (encadree()) return '';
    if (S.lien) {
      const etat = S.lien.erreur ? 'Pas de connexion au serveur pour l’instant : vos changements partiront plus tard.' : (S.lien.derniere ? 'Dernière synchronisation ' + ilya(S.lien.derniere) + '.' : 'Synchronisation en cours…');
      return `<div class="profil-bloc"><h3>Vos deux téléphones</h3>
        <p class="muted small">Reliés. Sur ce téléphone, vous êtes ${esc(nom(S.lien.moi))}. ${etat}</p>
        <div class="actions"><button class="btn btn--secondaire btn--petit" data-act="tel-sync">Synchroniser maintenant</button><a class="btn btn--discret btn--petit" href="#/relier">Afficher le QR code</a><button class="btn btn--discret btn--petit" data-act="tel-quitter">Quitter l’espace commun</button></div></div>`;
    }
    return `<div class="profil-bloc"><h3>Vos deux téléphones</h3>
      <p class="muted small">Chacun garde le sien, et vos favoris, vos souvenirs et leurs photos, votre Canari se retrouvent des deux côtés. Chiffré de bout en bout : personne ne peut lire votre espace, même pas nous.</p>
      <div class="actions">${estMembre() ? '<a class="btn btn--petit" href="#/relier">Relier nos deux téléphones</a>' : '<a class="btn btn--secondaire btn--petit" href="#/membre">Réservé aux membres</a>'}</div>
      <div class="champ" style="margin:16px 0 0"><label for="tel-lien">Vous avez reçu un lien ?</label><div class="cadeau__ligne" style="margin-top:0"><input type="text" id="tel-lien" placeholder="Collez-le ici" autocomplete="off" spellcheck="false" /><button class="btn btn--secondaire btn--petit" data-act="tel-rejoindre-lien">Rejoindre</button></div></div></div>`;
  }

  function vueRelier() {
    if (!S.lien) {
      if (!estMembre()) return aller('/membre');
      return rendre(`<a class="retour" href="#/profil">← Profil</a>
        <section class="hero"><div class="surtitre">Vos deux téléphones</div><h1>Sur ce téléphone, vous êtes…</h1>
        <p>Chacun garde son téléphone. Ce que vous ajoutez d’un côté apparaît de l’autre : favoris, souvenirs, photos, Canari. Vos réponses secrètes, elles, restent sur le téléphone de celui qui les écrit.</p></section>
        <div class="actions actions--col" style="max-width:360px"><button class="btn" data-act="tel-creer" data-qui="A">${esc(nom('A'))}</button><button class="btn btn--secondaire" data-act="tel-creer" data-qui="B">${esc(nom('B'))}</button></div>`);
    }
    const autre = nom(autreQue(S.lien.moi)), url = lienRejoindre(S.lien);
    rendre(`<a class="retour" href="#/profil">← Profil</a>
      <section class="hero"><div class="surtitre">Vos deux téléphones</div><h1>À ${esc(autre)}, maintenant.</h1>
      <p>Sur le téléphone de ${esc(autre)}, ouvrez l’appareil photo et visez ce code. Ou envoyez-lui le lien.</p></section>
      <div class="qr-carte" id="qr" aria-label="QR code pour rejoindre votre espace"></div>
      <div class="actions"><button class="btn" data-act="tel-partager">Envoyer le lien</button><button class="btn btn--secondaire" data-act="tel-copier">Copier le lien</button></div>
      <div class="profil-bloc" style="margin-top:24px"><h3>Ce lien est aussi votre code de secours</h3><p class="muted small">Gardez-le dans un endroit sûr : vos notes, ou un mail à vous-même. Il permet de retrouver votre espace sur un nouveau téléphone. Sans lui et sans vos deux téléphones, personne ne peut le retrouver, même pas nous : c’est le prix d’un espace que nous ne pouvons pas lire.</p></div>
      <p class="note">Si l’app est installée sur l’écran d’accueil de ${esc(autre)} : ouvrir l’app, aller dans Profil, puis coller le lien dans « Vous avez reçu un lien ? ».</p>`);
    chargerQR().then(() => {
      const z = $('#qr'); if (!z || !window.qrcode) return;
      const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
      z.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true, alt: 'QR code pour rejoindre votre espace' });
    }).catch(() => { const z = $('#qr'); if (z) z.innerHTML = '<p class="note">Le QR code ne s’affiche pas : envoyez plutôt le lien.</p>'; });
  }

  async function creerEspace(qui) {
    if (!estMembre()) return aller('/membre');
    const id = b64u(aleatoire(16)), cle = b64u(aleatoire(32));
    const r = await fetch(API_ESPACES + '/espaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, jeton: await jetonDe(cle) }) });
    if (!r.ok) throw new Error('création ' + r.status);
    S.lien = { id, cle, moi: qui === 'B' ? 'B' : 'A', version: 0, base: {}, photos: [], cree: new Date().toISOString() };
    ecrireLocal(); mesure('Deux téléphones', 'espace créé');
    await synchroniser();
  }

  let aRejoindre = null;
  async function vueRejoindre(q) {
    const id = q.e, cle = q.k;
    try { history.replaceState(null, '', location.pathname + location.search + '#/rejoindre'); } catch (e) { /* sans historique */ }
    if (id && cle) aRejoindre = { id, cle };
    const cible = aRejoindre;
    if (!cible || !RE_ESPACE.test(cible.id) || !RE_CLE.test(cible.cle)) return rendre(`<div class="onb">${marqueSvg}<h1>Ce lien est incomplet.</h1><p class="corps">Demandez à l’autre de vous le renvoyer depuis Profil, « Afficher le QR code ».</p><div class="actions"><a class="btn btn--secondaire" href="#/">Ouvrir Besoin d’Alchimie</a></div></div>`, true);
    if (S.lien && S.lien.id === cible.id) { toast('Ce téléphone est déjà relié.'); return aller('/profil'); }
    if (S.lien) return rendre(`<div class="onb">${marqueSvg}<h1>Ce téléphone est déjà relié à un autre espace.</h1><p class="corps">Quittez d’abord cet espace depuis Profil, puis rouvrez le lien.</p><div class="actions"><a class="btn btn--secondaire" href="#/profil">Aller dans Profil</a></div></div>`, true);
    rendre(`<div class="onb">${marqueSvg}<h1>Un instant…</h1></div>`, true);
    try {
      const r = await appelEspace('GET', '/etat', cible);
      if (r.status === 404 || r.status === 410) return rendre(`<div class="onb">${marqueSvg}<h1>Cet espace n’existe plus.</h1><p class="corps">Il a été fermé depuis l’autre téléphone. Vous pouvez en créer un nouveau depuis Profil.</p><div class="actions"><a class="btn btn--secondaire" href="#/">Ouvrir Besoin d’Alchimie</a></div></div>`, true);
      if (!r.ok) throw new Error();
      const distant = await r.json();
      const doc = distant.data ? await lireDoc(cible.cle, distant.data) : null;
      const c = (doc && doc.couple) || {};
      cible.noms = { A: c.a || 'Le premier', B: c.b || 'Le second' };
      const local = S.onboarded && (S.souvenirs.length + S.favoris.length + S.vecues.length + S.canari.length) > 0;
      rendre(`<div class="onb">${marqueSvg}
        <div class="surtitre">Vos deux téléphones</div>
        <h1>Rejoindre l’espace de ${esc(cible.noms.A)} et ${esc(cible.noms.B)}</h1>
        <p class="corps">Sur ce téléphone, vous êtes :</p>
        <div class="actions actions--col" style="max-width:360px"><button class="btn" data-act="tel-moi" data-qui="A">${esc(cible.noms.A)}</button><button class="btn btn--secondaire" data-act="tel-moi" data-qui="B">${esc(cible.noms.B)}</button></div>
        ${local ? '<p class="note">Ce que vous avez déjà sur ce téléphone rejoindra votre espace commun.</p>' : ''}
      </div>`, true);
    } catch (e) {
      rendre(`<div class="onb">${marqueSvg}<h1>Impossible d’ouvrir l’espace pour l’instant.</h1><p class="corps">Vérifiez la connexion, puis rouvrez le lien.</p><div class="actions"><a class="btn btn--secondaire" href="#/">Ouvrir Besoin d’Alchimie</a></div></div>`, true);
    }
  }
  async function rejoindre(qui) {
    const cible = aRejoindre; if (!cible) return aller('/');
    aRejoindre = null;
    /* Les prénoms viennent de l'autre téléphone : on considère ceux d'ici comme inchangés. */
    S.lien = { id: cible.id, cle: cible.cle, moi: qui === 'B' ? 'B' : 'A', version: 0, base: { couple: copie(S.couple) }, photos: [], rejoint: new Date().toISOString() };
    ecrireLocal(); mesure('Deux téléphones', 'espace rejoint');
    const ok = await synchroniser();
    toast(ok ? 'Vos deux téléphones sont reliés.' : 'Relié. La synchronisation reprendra dès que possible.');
    aller(S.majeurs ? '/' : '/age');
  }
  function quitterEspace() {
    demander('Quitter l’espace commun ? Vous gardez tout ce qui est sur ce téléphone, et l’autre téléphone garde aussi sa copie. Ensuite, vos deux téléphones ne se parleront plus.', 'Quitter', async () => {
      const lien = S.lien; if (!lien) return;
      try { await appelEspace('DELETE', '', lien); } catch (e) { /* on coupe quand même ici */ }
      S.lien = null; ecrireLocal(); mesure('Deux téléphones', 'espace quitté');
      toast('Espace commun quitté. Tout reste sur ce téléphone.');
      rerendre(vueProfil);
    });
  }

  /* ------------------------------------------------------------ */
  /* Profil                                                          */
  function blocMesure() {
    const m = S.mesure || { actif: true, compteurs: {} };
    const lignes = Object.entries(m.compteurs).filter(([k]) => !k.startsWith('Page')).sort((a, b) => b[1] - a[1]);
    const pages = Object.entries(m.compteurs).filter(([k]) => k.startsWith('Page')).reduce((t, [, v]) => t + v, 0);
    return `<div class="profil-bloc">
      <h3>Ce que l\u2019app compte</h3>
      <div class="bascule"><div><strong>${m.actif ? 'Compteurs activés' : 'Compteurs arrêtés'}</strong><div class="muted small">Quelles expériences sont ouvertes et terminées. Jamais vos prénoms, vos réponses ni vos souvenirs. Pour « Se désirer », seul le territoire est compté.</div></div><button class="${m.actif ? 'actif' : ''}" data-act="mesure-bascule" aria-label="Activer ou arrêter les compteurs"></button></div>
      ${lignes.length ? `<ul class="compteurs">${lignes.map(([k, v]) => `<li><span>${esc(k)}</span><b>${v}</b></li>`).join('')}<li class="muted"><span>Écrans ouverts</span><b>${pages}</b></li></ul>` : '<p class="note">Rien n\u2019est encore compté.</p>'}
      <p class="note">${MESURE_PLAUSIBLE ? 'Ces chiffres sont aussi envoyés, sans cookie ni identifiant, à notre outil de mesure.' : 'Aujourd\u2019hui, ces chiffres restent sur ce téléphone. Pendant la phase de test, vous pouvez les copier et nous les envoyer.'}</p>
      <div class="actions"><button class="btn btn--secondaire btn--petit" data-act="mesure-copier">Copier mes chiffres</button><button class="btn btn--discret btn--petit" data-act="mesure-zero">Remettre à zéro</button></div>
    </div>`;
  }

  function vueProfil() {
    rendre(`
      <section class="hero"><div class="surtitre">Profil</div><h1>Votre espace.</h1><p>Deux prénoms, quelques préférences, et c’est tout ce qu’on sait de vous.</p></section>
      <div class="profil-bloc">
        <h3>Vous deux</h3>
        <div class="champ"><label for="pf-a">Premier prénom</label><input type="text" id="pf-a" value="${esc(S.couple.a)}" /></div>
        <div class="champ"><label for="pf-b">Second prénom</label><input type="text" id="pf-b" value="${esc(S.couple.b)}" /></div>
        <div class="champ"><label>Enfants</label><div class="puces"><button class="puce ${S.couple.enfants === true ? 'actif' : ''}" data-act="pf-enf" data-v="oui">Oui</button><button class="puce ${S.couple.enfants === false ? 'actif' : ''}" data-act="pf-enf" data-v="non">Non</button></div></div>
        <div class="champ"><label>Ce qui vous attire</label><div class="puces">${GOUTS.map((g) => `<button class="puce ${S.couple.gouts.includes(g) ? 'actif' : ''}" data-act="pf-gout" data-v="${g}">${g}</button>`).join('')}</div></div>
        <button class="btn btn--secondaire" data-act="pf-sauver">Enregistrer</button>
      </div>
      <div class="profil-bloc">
        <h3>Accès</h3>
        <div class="bascule"><div><strong>${estMembre() ? 'Membre Besoin d’Alchimie' : 'Découverte'}</strong><div class="muted small">${estMembre() ? 'Toute la bibliothèque, la nouveauté de chaque semaine, les audios guidés, les collections de saison.' : (quota() - essaisRestants()) + ' sur ' + quota() + ' expériences offertes utilisées.'}</div></div>${testeur() ? `<button class="${estMembre() ? 'actif' : ''}" data-act="membre" aria-label="Basculer l’accès membre (mode test)"></button>` : ''}</div>
        ${testeur() ? '<p class="note">Mode test : la bascule ouvre ou ferme l’accès membre sur ce téléphone.</p>' : ''}
        ${estMembre() ? '' : '<div class="actions"><a class="btn btn--secondaire btn--petit" href="#/membre">Voir ce que change l’accès membre</a></div>'}
      </div>
      ${blocTelephones()}
      ${blocInstaller()}
      ${blocMesure()}
      <div class="profil-bloc">
        <h3>Si quelque chose ne va pas</h3>
        <p class="muted small">Si l\u2019un de vous a peur de l\u2019autre, des numéros d\u2019aide gratuits et vérifiés.</p>
        <div class="actions"><a class="btn btn--secondaire btn--petit" href="#/aide">Voir les numéros d\u2019aide</a></div>
      </div>
      <div class="profil-bloc">
        <h3>Vos données</h3>
        <p class="muted small">Tout ce que vous écrivez ici reste sur cet appareil${S.lien ? ', et sur l’autre téléphone : ce que vous partagez passe chiffré par notre serveur, qui ne peut pas le lire' : ''}.${FORMULAIRE_BREVO ? ' Seule votre adresse mail, si vous nous la donnez, part chez Brevo pour vous écrire.' : ' Rien n’est envoyé nulle part.'} Dans le produit final, un couple pourra lier deux téléphones ; ce prototype en simule un seul, qu’on se passe.</p>
        <p class="muted small">Une question, une idée : <a class="lien-aide" href="mailto:contact@besoindalchimie.com">contact@besoindalchimie.com</a>${FORMULAIRE_BREVO ? ' · <a class="lien-aide" href="#/confidentialite">Confidentialité</a>' : ''}</p>
        <div class="actions"><button class="btn btn--discret" data-act="reset">Effacer le prototype et recommencer</button></div>
      </div>
    `);
  }

  /* ------------------------------------------------------------ */
  /* Le moteur d'expériences                                         */
  function jouer(id) {
    const e = exp(id); if (!e) return aller('/explorer');
    if (!accessible(e)) return aller('/experience/' + id);
    if (!estMembre() && !dejaEssayee(e)) {
      S.essais = essais().concat(e.id); sauver();
      if (essaisRestants() === 0) mesure('Quota Découverte atteint');
    }
    const etapes = e.etapes.concat([{ t: 'fin' }]);
    const sess = { i: 0, sub: 0, passe: -1, rep: { A: {}, B: {} }, dev: { A: {}, B: {} }, choix: {}, secret: {}, opn: { A: {}, B: {} }, playlist: [], surprises: {}, questions: {}, vecue: false, tirages: {}, vus: {}, finFichier: null };
    const N = noms();
    mesure('Expérience commencée', nomMesure(e));

    rendre(`<div class="jeu t-${e.territoire}">
      <div class="jeu__tete"><span class="titre">${esc(e.titre)}</span><button class="jeu__quitter" data-act="quitter" data-id="${e.id}">Quitter</button></div>
      <div class="jeu__prog"><i id="prog"></i></div>
      <div class="jeu__corps" id="corps"></div>
    </div>`, true);

    const corps = $('#corps');
    const questionsDe = (et) => {
      if (et.questions && et.questions[0] && et.questions[0].q) return et.questions;
      for (let k = sess.i - 1; k >= 0; k--) if (etapes[k].t === 'reponse' && etapes[k].questions && etapes[k].questions[0].q) return etapes[k].questions;
      return [];
    };
    const propositionsDe = (et) => { if (et.propositions) return et.propositions; for (let k = sess.i - 1; k >= 0; k--) if (etapes[k].t === 'oui-peut-etre-non' && etapes[k].propositions) return etapes[k].propositions; return []; };
    const qTexte = (qid) => { for (const et of etapes) if (et.t === 'reponse' && et.questions) { const q = et.questions.find((x) => x.id === qid); if (q) return q.q; } return qid; };

    function suivant() { sess.i++; sess.sub = 0; montrer(); }
    function montrer() {
      nettoyer();
      const et = etapes[sess.i];
      $('#prog').style.width = Math.round((sess.i / (etapes.length - 1)) * 100) + '%';
      const besoinPasse = et.qui && ['reponse', 'devine', 'secret', 'oui-peut-etre-non'].includes(et.t) && sess.passe !== sess.i;
      let html = '';
      if (besoinPasse) {
        const autre = et.qui === 'A' ? 'B' : 'A';
        html = `<div class="etape passe">
          <div class="main"><svg viewBox="0 0 100 100"><rect x="30" y="14" width="40" height="72" rx="8"/><path d="M44 22h12"/><path d="M12 55 Q 26 48 30 60" /><path d="M88 55 Q 74 48 70 60"/></svg></div>
          <div class="surtitre">À ${esc(N[et.qui])}</div>
          <h2>Passe le téléphone à ${esc(N[et.qui])}.</h2>
          <p class="corps" style="margin:14px auto 0;max-width:36ch">${esc(N[autre])}, c’est le moment de regarder ailleurs. Ce qui s’écrit ici reste secret jusqu’à la révélation.</p>
          <div class="actions" style="justify-content:center"><button class="btn" data-j="passe">C’est moi, ${esc(N[et.qui])}</button></div>
        </div>`;
        corps.innerHTML = html; return;
      }
      const r = RENDUS[et.t] || RENDUS.texte;
      corps.innerHTML = `<div class="etape">${r.html(et)}</div>`;
      if (r.apres) r.apres(et, corps);
      corps.scrollTop = 0;
    }

    const RENDUS = {
      texte: {
        html: (et) => `<div class="surtitre">${esc(e.titre)}</div><h2>${esc(et.titre || '')}</h2><p class="corps">${esc(et.corps || '')}</p><div class="actions"><button class="btn" data-j="suivant">${esc(et.bouton || 'Continuer')}</button></div>`
      },
      conversation: {
        html: (et) => { const p = et.pistes[sess.sub]; const dernier = sess.sub >= et.pistes.length - 1; return `<div class="surtitre">${esc(et.titre || 'À deux')}${et.pistes.length > 1 ? ' · ' + (sess.sub + 1) + '/' + et.pistes.length : ''}</div><p class="question">${esc(p)}</p><p class="corps muted">À voix haute, l’un après l’autre. Celui qui écoute attend la fin avant de répondre.</p><div class="actions"><button class="btn" data-j="${dernier ? 'suivant' : 'sub'}">${dernier ? 'Continuer' : 'Question suivante'}</button></div>`; }
      },
      tirage: {
        html: (et) => { const k = sess.i; const tire = sess.tirages[k]; return `<div class="surtitre">${esc(et.titre)}</div>${tire ? `<p class="question">${esc(tire.texte)}</p><p class="corps muted">${tire.relances ? 'Vous avez relancé. Celle-ci est la bonne.' : 'Si elle ne vous inspire vraiment pas, vous pouvez relancer une fois.'}</p><div class="actions"><button class="btn" data-j="suivant">Continuer</button>${tire.relances ? '' : '<button class="btn btn--secondaire" data-j="tirer">Relancer</button>'}</div>` : `<p class="corps">Posez le téléphone entre vous. On tire au sort.</p><div class="actions"><button class="btn" data-j="tirer">Tirer</button></div>`}`; }
      },
      chrono: {
        html: (et) => `<div class="surtitre">${esc(et.titre)}</div>
          <div class="chrono" id="chrono">${mmss(et.minutes * 60)}</div>
          <div class="interdits">${(et.interdits || []).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
          <div class="actions"><button class="btn" id="chrono-btn" data-j="chrono">Lancer</button><button class="btn btn--secondaire" data-j="piste">Tirer une piste</button></div>
          <div id="piste"></div>
          <div class="actions"><button class="btn btn--discret" data-j="suivant">C’est fini pour nous</button></div>`,
        apres: (et) => { sess.chrono = { reste: et.minutes * 60, marche: false, vues: [] }; }
      },
      reponse: {
        html: (et) => { const qs = questionsDe(et); const q = qs[sess.sub]; const dernier = sess.sub >= qs.length - 1; const val = sess.rep[et.qui][q.id] || ''; return `<div class="surtitre">${esc(N[et.qui])} · ${sess.sub + 1}/${qs.length}</div><p class="question">${esc(q.q)}</p><div class="champ"><textarea id="rep" placeholder="Ta réponse, en quelques mots">${esc(val)}</textarea></div><div class="actions"><button class="btn" data-j="rep" data-q="${q.id}" data-dernier="${dernier ? 1 : 0}">${dernier ? 'J’ai fini' : 'Suivant'}</button></div>`; },
        apres: () => { const t = $('#rep'); if (t) t.focus(); }
      },
      devine: {
        html: (et) => { const qid = et.questions[sess.sub]; const dernier = sess.sub >= et.questions.length - 1; const val = sess.dev[et.qui][qid] || ''; return `<div class="surtitre">${esc(N[et.qui])} devine · ${sess.sub + 1}/${et.questions.length}</div><p class="corps muted">Qu’a répondu ${esc(N[et.cible])} à cette question ?</p><p class="question">${esc(qTexte(qid))}</p><div class="champ"><textarea id="dev" placeholder="Ce que ${esc(N[et.cible])} a probablement écrit">${esc(val)}</textarea></div><div class="actions"><button class="btn" data-j="dev" data-q="${qid}" data-dernier="${dernier ? 1 : 0}">${dernier ? 'J’ai fini' : 'Suivant'}</button></div>`; },
        apres: () => { const t = $('#dev'); if (t) t.focus(); }
      },
      revelation: {
        html: (et) => `<div class="surtitre">Révélation</div><h2>Posez le téléphone entre vous.</h2><p class="corps muted">Touchez une réponse pour la dévoiler. Marquez celles qui vous ont surpris : on y reviendra.</p>
          <div class="revel">${et.questions.map((qid) => { const a = sess.rep.A[qid] || '…', b = sess.rep.B[qid] || '…'; const dA = sess.dev.A[qid], dB = sess.dev.B[qid]; return `<div><div class="revel__q">${esc(qTexte(qid))}</div><div class="revel__rep">
            <div class="rep ${sess.vus[qid + 'A'] ? '' : 'cache'}" data-j="devoiler" data-cle="${qid}A"><small>${esc(N.A)}</small><div class="txt">${esc(a)}</div>${!et.sansDevine && dB ? `<div class="devine">${esc(N.B)} pensait : <b>${esc(dB)}</b></div>` : ''}</div>
            <div class="rep ${sess.vus[qid + 'B'] ? '' : 'cache'}" data-j="devoiler" data-cle="${qid}B"><small>${esc(N.B)}</small><div class="txt">${esc(b)}</div>${!et.sansDevine && dA ? `<div class="devine">${esc(N.A)} pensait : <b>${esc(dA)}</b></div>` : ''}</div>
          </div><button class="puce surprise ${sess.surprises[qid] ? 'actif' : ''}" data-j="surprise" data-q="${qid}" style="margin-top:8px">${sess.surprises[qid] ? 'Ça nous a surpris' : 'Ça m’a surpris'}</button></div>`; }).join('')}</div>
          <div class="actions"><button class="btn" data-j="suivant">Continuer</button></div>`
      },
      choix: {
        html: (et) => `<div class="surtitre">${esc(e.titre)}</div><h2>${esc(et.titre)}</h2><p class="corps">${esc(et.question || '')}</p><div class="pile" style="margin-top:18px">${et.options.map((o) => `<button class="choix" data-j="choix" data-cle="${et.cle}" data-v="${esc(o)}">${esc(o === 'A' || o === 'B' ? N[o] : o)}</button>`).join('')}</div>`
      },
      secret: {
        html: (et) => `<div class="surtitre">${esc(N[et.qui])} · secret</div><p class="question">${esc(et.consigne)}</p><div class="champ"><textarea id="sec" class="${et.long ? 'long' : ''}" placeholder="${et.long ? 'Écris comme ça vient.' : 'Une seule chose.'}">${esc(sess.secret[et.qui] || '')}</textarea></div><div class="actions"><button class="btn" data-j="secret" data-qui="${et.qui}">Sceller</button></div>`,
        apres: () => { const t = $('#sec'); if (t) t.focus(); }
      },
      regles: {
        html: (et) => `<div class="surtitre">${esc(et.titre)}</div><ul class="regles">${et.regles.map((r) => `<li>${esc(r)}</li>`).join('')}</ul><div class="actions"><button class="btn" data-j="suivant">On a lu, on est d’accord</button></div>`
      },
      'revelation-secret': {
        html: () => `<div class="surtitre">Révélation</div><h2>L’un après l’autre.</h2><p class="corps muted">Touchez une carte pour la lire. Celui qui a écrit se tait pendant que l’autre lit.</p>
          <div class="secret-carte cache" data-j="devoiler"><small>${esc(N.A)} demande</small><div class="txt">${esc(sess.secret.A || '…')}</div></div>
          <div class="secret-carte cache" data-j="devoiler"><small>${esc(N.B)} demande</small><div class="txt">${esc(sess.secret.B || '…')}</div></div>
          <div class="actions"><button class="btn" data-j="suivant">Continuer</button></div>`
      },
      sceller: {
        html: (et) => `<div class="surtitre">${esc(e.titre)}</div><h2>${esc(et.titre)}</h2><p class="corps">${esc(et.corps)}</p><div class="actions"><button class="btn" data-j="sceller">Ranger les lettres</button></div>`
      },
      'oui-peut-etre-non': {
        html: (et) => { const props = propositionsDe(et); const o = sess.opn[et.qui]; const complet = props.every((p, i) => o[i]); return `<div class="surtitre">${esc(N[et.qui])} · en secret</div><h2>Oui, peut-être, non.</h2><p class="corps muted">Personne ne verra tes « non ». Seuls les « oui » communs apparaîtront.</p><div class="opn">${props.map((p, i) => `<div class="opn__ligne"><span>${esc(p)}</span><div class="opn__btns">${[['oui', 'Oui'], ['peut', 'Peut-être'], ['non', 'Non']].map(([v, l]) => `<button class="${o[i] === v ? 'actif' : ''}" data-j="opn" data-i="${i}" data-v="${v}">${l}</button>`).join('')}</div></div>`).join('')}</div><div class="actions"><button class="btn" data-j="suivant" ${complet ? '' : 'disabled'}>J’ai fini</button></div>`; }
      },
      'revelation-oui': {
        html: () => { const props = propositionsDe({}); const oui = [], peut = []; props.forEach((p, i) => { const a = sess.opn.A[i], b = sess.opn.B[i]; if (a === 'oui' && b === 'oui') oui.push(p); else if ((a === 'oui' || a === 'peut') && (b === 'oui' || b === 'peut')) peut.push(p); }); return `<div class="surtitre">Révélation</div><h2>${oui.length ? 'Vos oui communs.' : 'Pas de oui commun ce soir.'}</h2><p class="corps muted">${oui.length ? 'Rien d’autre n’est montré. Les « non » restent à chacun.' : 'Ça arrive, et ça ne veut rien dire de grave. Les « peut-être » partagés sont peut-être une porte.'}</p><ul class="oui-liste">${oui.map((p) => `<li>${esc(p)}</li>`).join('')}${peut.map((p) => `<li class="peut">${esc(p)} <small class="muted">· peut-être, tous les deux</small></li>`).join('')}</ul><div class="actions"><button class="btn" data-j="suivant">Continuer</button></div>`; }
      },
      playlist: {
        html: (et) => { if (sess.sub < et.moments.length) { const m = et.moments[sess.sub]; const p = sess.playlist[sess.sub] || {}; return `<div class="surtitre">Piste ${sess.sub + 1}/${et.moments.length}</div><p class="question">${esc(m)}</p><p class="corps muted">Une chanson pour ce moment. Mettez-la en fond pendant que vous cherchez la suivante.</p><div class="champ"><label for="pl-t">Titre</label><input type="text" id="pl-t" value="${esc(p.titre || '')}" /></div><div class="champ"><label for="pl-a">Artiste</label><input type="text" id="pl-a" value="${esc(p.artiste || '')}" /></div><div class="actions"><button class="btn" data-j="pl">${sess.sub === et.moments.length - 1 ? 'Terminer la bande originale' : 'Piste suivante'}</button></div>`; }
          return `<div class="center"><div class="vinyle"></div><div class="surtitre">Votre bande originale est prête.</div><h2>${esc(N.A)} &amp; ${esc(N.B)}</h2></div><ol class="pistes-bo">${et.moments.map((m, i) => { const p = sess.playlist[i] || {}; return `<li><div><div class="mom">${esc(m)}</div><div class="ti">${esc(p.titre || 'Sans titre')}</div><div class="ar">${esc(p.artiste || '')}</div></div></li>`; }).join('')}</ol><div class="actions"><button class="btn" data-j="suivant">Continuer</button></div>`; },
        apres: () => { const t = $('#pl-t'); if (t) t.focus(); }
      },
      souvenir: {
        html: (et) => { const p = et.pistes[sess.sub]; const dernier = sess.sub >= et.pistes.length - 1; const photo = et.mode === 'photo'; return `<div class="surtitre">${photo ? 'Photo' : 'Souvenir'} ${sess.sub + 1}/${et.pistes.length}</div><p class="question">${esc(p)}</p><p class="corps muted">${photo ? 'Prenez-la, puis gardez-la ici si vous voulez.' : 'Celui qui commence raconte. L’autre complète ce qui manque.'}</p>
          <div id="garde" hidden><div class="champ"><textarea id="sv-txt" placeholder="${photo ? 'Une légende, si vous voulez' : 'Une phrase pour s’en souvenir'}"></textarea></div><div class="champ"><label for="sv-photo">Une photo (facultatif)</label><input type="file" id="sv-photo" accept="image/*" /></div><div class="actions"><button class="btn btn--petit" data-j="sv-ok">Garder</button></div></div>
          <div class="actions"><button class="btn btn--secondaire" data-j="sv-garder">${photo ? 'Garder cette photo' : 'Garder ce souvenir'}</button><button class="btn" data-j="${dernier ? 'suivant' : 'sub'}">${dernier ? 'Continuer' : 'Suivant'}</button></div>`; }
      },
      audio: {
        html: (et) => `<div class="surtitre">Expérience audio${et.intime ? ' · intime' : ''}</div><h2>${esc(et.titre)}</h2><p class="corps muted">Posez le téléphone, montez un peu le son, et laissez la voix faire. ${et.intime ? 'Chacun peut passer une consigne ou arrêter, à tout moment.' : ''}</p>
          <div class="lecteur" id="lecteur">
            <div class="lecteur__onde">${Array.from({ length: 40 }, (_, i) => `<i data-i="${i}" style="height:${18 + Math.round(Math.abs(Math.sin(i * 0.9)) * 70)}%"></i>`).join('')}</div>
            <div class="lecteur__ctrl"><button class="lecteur__play" data-j="play" aria-label="Lecture"><svg id="ico" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button><div class="lecteur__temps"><span id="t-cur">00:00</span> <span>/ ${mmss(et.duree)}</span></div></div>
            <ul class="reperes">${et.reperes.map(([s, l]) => `<li data-s="${s}"><b>${mmss(s)}</b>${esc(l)}</li>`).join('')}</ul>
            <div class="lecteur__demo">Prototype : l’audio n’est pas encore enregistré. <button data-j="avancer">Avancer d’une minute</button></div>
          </div>
          <div class="actions"><button class="btn btn--discret" data-j="suivant">C’est terminé pour nous</button></div>`,
        apres: (et) => { sess.audio = { pos: 0, joue: false, duree: et.duree }; majAudio(); }
      },
      'liste-envies': {
        html: (et) => `<div class="surtitre">${esc(et.titre)}</div><p class="corps">${esc(et.consigne)}</p><div class="ajout"><input type="text" id="le-txt" placeholder="Un lieu" /><select id="le-par"><option value="A">${esc(N.A)}</option><option value="B">${esc(N.B)}</option></select><button class="btn btn--petit" data-j="le-add">Ajouter</button></div><div class="liste" id="le-liste" style="margin-top:14px">${listeEnviesSession(et)}</div><div class="actions"><button class="btn" data-j="suivant">On a notre liste</button></div>`,
        apres: () => { const t = $('#le-txt'); if (t) t.focus(); }
      },
      fin: {
        html: () => { if (!sess.vecue) { sess.vecue = true; S.vecues.push({ id: e.id, date: new Date().toISOString() }); sauver(); mesure('Expérience terminée', nomMesure(e)); } sess.fin = sess.fin || { souvenir: false, phrase: false, refaire: S.aFaire.includes(e.id), favori: S.favoris.includes(e.id), reponses: false }; const f = sess.fin; const aRep = Object.keys(sess.rep.A).length > 0; return `<div class="surtitre">C’est fini</div><h2>Vous voulez garder quelque chose de ce moment ?</h2>
          <div class="fin-options">
            <button class="choix ${f.souvenir ? 'actif' : ''}" data-j="fin" data-k="souvenir"><b>Ajouter un souvenir</b><small>Une photo, une note, dans votre coffre.</small></button>
            <button class="choix ${f.phrase ? 'actif' : ''}" data-j="fin" data-k="phrase"><b>Écrire une phrase</b><small>Juste une, celle qui reste.</small></button>
            <button class="choix ${f.refaire ? 'actif' : ''}" data-j="fin" data-k="refaire"><b>Refaire plus tard</b><small>Dans « À faire ensemble ».</small></button>
            <button class="choix ${f.favori ? 'actif' : ''}" data-j="fin" data-k="favori"><b>Ajouter aux favoris</b><small>Sous le coude.</small></button>
            ${aRep ? `<button class="choix ${f.reponses ? 'actif' : ''}" data-j="fin" data-k="reponses"><b>Garder nos réponses</b><small>Sinon, elles s’effacent en sortant.</small></button>` : ''}
          </div>
          <div id="fin-form" ${f.souvenir || f.phrase ? '' : 'hidden'} style="margin-top:14px"><div class="champ"><textarea id="fin-txt" placeholder="${f.phrase && !f.souvenir ? 'La phrase.' : 'Ce que vous voulez vous rappeler de ce moment.'}">${esc(f.texte || '')}</textarea></div>${f.souvenir ? '<div class="champ"><label for="fin-photo">Une photo (facultatif)</label><input type="file" id="fin-photo" accept="image/*" />' + (sess.finFichier ? '<p class="note">Photo choisie : ' + esc(sess.finFichier.name) + '</p>' : '') + '</div>' : ''}</div>
          <div class="actions"><button class="btn" data-j="fin-ok">${f.souvenir || f.phrase || f.reponses || f.refaire !== S.aFaire.includes(e.id) || f.favori !== S.favoris.includes(e.id) ? 'Garder et fermer' : 'Ne rien garder'}</button></div>`; }
      }
    };

    function listeEnviesSession(et) {
      const l = S.envies.filter((v) => v.type === (et.type === 'destination' ? 'Destination' : et.type) && v.session === sess.id);
      return l.length ? l.map((v) => `<div class="ligne"><div class="ligne__corps"><div class="ligne__titre">${esc(v.texte)}</div><div class="ligne__sous">${esc(nom(v.par))}</div></div></div>`).join('') : '<div class="vide" style="padding:18px;font-size:1rem">Encore rien.</div>';
    }
    sess.id = uid();

    function majAudio() {
      const a = sess.audio; if (!a) return;
      const cur = $('#t-cur'); if (!cur) return;
      cur.textContent = mmss(a.pos);
      const frac = a.pos / a.duree;
      $$('.lecteur__onde i').forEach((b, i) => { b.classList.toggle('passe', i / 40 < frac); b.classList.toggle('courant', Math.floor(frac * 40) === i); });
      let courant = null;
      $$('.reperes li').forEach((li) => { const s = +li.dataset.s; li.classList.toggle('passe', a.pos > s); if (a.pos >= s) courant = li; });
      $$('.reperes li').forEach((li) => li.classList.remove('courant')); if (courant) courant.classList.add('courant');
      const ico = $('#ico'); if (ico) ico.innerHTML = a.joue ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
      const lec = $('#lecteur'); if (lec) lec.classList.toggle('joue', a.joue);
      if (a.pos >= a.duree) { a.joue = false; a.pos = a.duree; if (lec) lec.classList.remove('joue'); }
    }

    function lireFichier(source, cb) {
      const f = (typeof File !== 'undefined' && source instanceof File) ? source : (source && source.files && source.files[0]); if (!f) return cb(null);
      const img = new Image(); const url = URL.createObjectURL(f);
      img.onload = () => { const max = 900; const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', 0.78)); };
      img.onerror = () => cb(null); img.src = url;
    }

    corps.addEventListener('change', (ev) => { if (ev.target.id === 'fin-photo' && ev.target.files[0]) sess.finFichier = ev.target.files[0]; });
    corps.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-j]'); if (!b) return;
      const j = b.dataset.j; const et = etapes[sess.i];
      if (j === 'passe') { sess.passe = sess.i; montrer(); }
      else if (j === 'suivant') suivant();
      else if (j === 'sub') { sess.sub++; montrer(); }
      else if (j === 'tirer') { const prev = sess.tirages[sess.i]; const reste = et.pistes.filter((p) => !prev || p !== prev.texte); sess.tirages[sess.i] = { texte: hasard(reste), relances: prev ? 1 : 0 }; montrer(); }
      else if (j === 'chrono') { const c = sess.chrono; c.marche = !c.marche; b.textContent = c.marche ? 'Pause' : 'Reprendre'; if (c.marche) { nettoyer(); chaque(() => { if (!c.marche) return; c.reste--; const el = $('#chrono'); if (!el) return; el.textContent = mmss(c.reste); if (c.reste <= 0) { c.marche = false; el.classList.add('fini'); el.textContent = '00:00'; const bt = $('#chrono-btn'); if (bt) bt.textContent = 'Terminé'; nettoyer(); } }, 1000); } }
      else if (j === 'piste') { const c = sess.chrono; const reste = et.pistes.filter((p) => !c.vues.includes(p)); const z = $('#piste'); if (!reste.length) { z.innerHTML = '<div class="piste piste--vide">Vous avez tout tiré. À vous de jouer, maintenant.</div>'; return; } const p = hasard(reste); c.vues.push(p); z.innerHTML = `<div class="piste">${esc(p)}</div>`; }
      else if (j === 'rep') { const v = $('#rep').value.trim(); sess.rep[et.qui][b.dataset.q] = v; if (b.dataset.dernier === '1') suivant(); else { sess.sub++; montrer(); } }
      else if (j === 'dev') { const v = $('#dev').value.trim(); sess.dev[et.qui][b.dataset.q] = v; if (b.dataset.dernier === '1') suivant(); else { sess.sub++; montrer(); } }
      else if (j === 'devoiler') { b.classList.remove('cache'); if (b.dataset.cle) sess.vus[b.dataset.cle] = true; }
      else if (j === 'surprise') { sess.surprises[b.dataset.q] = !sess.surprises[b.dataset.q]; const y = corps.scrollTop; montrer(); corps.scrollTop = y; }
      else if (j === 'choix') { sess.choix[b.dataset.cle] = b.dataset.v; suivant(); }
      else if (j === 'secret') { const v = $('#sec').value.trim(); if (!v) { toast('Écris au moins quelques mots.'); return; } sess.secret[b.dataset.qui] = v; suivant(); }
      else if (j === 'sceller') { const ouvrir = new Date(); ouvrir.setFullYear(ouvrir.getFullYear() + 1); ['A', 'B'].forEach((q) => { if (sess.secret[q]) S.souvenirs.push({ id: uid(), expId: e.id, date: new Date().toISOString(), texte: sess.secret[q], par: q, scelle: { ouvrir: ouvrir.toISOString() } }); }); sauver(); toast('Deux lettres scellées, à ouvrir le ' + dateFr(ouvrir.toISOString())); suivant(); }
      else if (j === 'opn') { sess.opn[et.qui][b.dataset.i] = b.dataset.v; const y = corps.scrollTop; montrer(); corps.scrollTop = y; }
      else if (j === 'pl') { sess.playlist[sess.sub] = { titre: $('#pl-t').value.trim(), artiste: $('#pl-a').value.trim() }; sess.sub++; montrer(); }
      else if (j === 'sv-garder') { $('#garde').hidden = false; $('#sv-txt').focus(); }
      else if (j === 'sv-ok') { const txt = $('#sv-txt').value.trim(); lireFichier($('#sv-photo'), (photo) => { if (!txt && !photo) { toast('Une phrase ou une photo, au moins.'); return; } S.souvenirs.push({ id: uid(), expId: e.id, date: new Date().toISOString(), texte: txt || et.pistes[sess.sub], photo: photo }); sauver(); toast('Gardé dans vos souvenirs.'); $('#garde').hidden = true; $('#sv-txt').value = ''; }); }
      else if (j === 'play') { const a = sess.audio; a.joue = !a.joue; nettoyer(); if (a.joue) chaque(() => { a.pos++; majAudio(); if (a.pos >= a.duree) nettoyer(); }, 1000); majAudio(); }
      else if (j === 'avancer') { const a = sess.audio; a.pos = Math.min(a.duree, a.pos + 60); majAudio(); }
      else if (j === 'le-add') { const v = $('#le-txt').value.trim(); if (!v) return; S.envies.push({ id: uid(), texte: v, type: 'Destination', par: $('#le-par').value, session: sess.id }); sauver(); $('#le-txt').value = ''; $('#le-liste').innerHTML = listeEnviesSession(et); $('#le-txt').focus(); }
      else if (j === 'fin') { const k = b.dataset.k; const f = sess.fin; const t = $('#fin-txt'); if (t) f.texte = t.value; f[k] = !f[k]; const y = corps.scrollTop; montrer(); corps.scrollTop = y; }
      else if (j === 'fin-ok') { const f = sess.fin; const t = $('#fin-txt'); const txt = t ? t.value.trim() : '';
        const finir = (photo) => {
          if ((f.souvenir || f.phrase) && (txt || photo)) S.souvenirs.push({ id: uid(), expId: e.id, date: new Date().toISOString(), texte: txt, photo: photo || null });
          if (f.refaire && !S.aFaire.includes(e.id)) S.aFaire.push(e.id); if (!f.refaire) S.aFaire = S.aFaire.filter((x) => x !== e.id);
          if (f.favori && !S.favoris.includes(e.id)) S.favoris.push(e.id); if (!f.favori) S.favoris = S.favoris.filter((x) => x !== e.id);
          if (f.reponses) { const questions = {}; Object.keys(sess.rep.A).forEach((qid) => { questions[qid] = qTexte(qid); }); S.reponses[e.id] = { date: new Date().toISOString(), questions, rep: sess.rep }; }
          sauver();
          corps.innerHTML = `<div class="etape adieu"><div class="surtitre">À bientôt</div><h2>Et maintenant, retournez profiter de votre soirée.</h2><p>${f.souvenir || f.phrase || f.reponses ? 'C’est rangé dans votre espace.' : 'Rien n’a été gardé. C’est très bien aussi.'}</p><div class="actions" style="justify-content:center"><a class="btn" href="#/">Fermer</a></div></div>`;
          $('#prog').style.width = '100%';
        };
        if (f.souvenir) lireFichier(sess.finFichier || $('#fin-photo'), finir); else finir(null);
      }
    });

    montrer();
  }

  /* ------------------------------------------------------------ */
  /* Actions globales (délégation)                                   */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, id = b.dataset.id;
    if (a === 'fav') { ev.preventDefault(); if (S.favoris.includes(id)) { S.favoris = S.favoris.filter((x) => x !== id); toast('Retiré des favoris'); } else { S.favoris.push(id); toast('Ajouté aux favoris'); const ex = exp(id); if (ex) mesure('Favori ajouté', nomMesure(ex)); } sauver(); rerendre(route); }
    else if (a === 'afaire') { if (S.aFaire.includes(id)) { S.aFaire = S.aFaire.filter((x) => x !== id); toast('Retiré de votre liste'); } else { S.aFaire.push(id); toast('Ajouté à « À faire ensemble »'); } sauver(); rerendre(route); }
    else if (a === 'membre') { S.membre = !S.membre; sauver(); toast(S.membre ? 'Accès membre activé (prototype)' : 'Retour à l’accès Découverte'); rerendre(route); }
    else if (a === 'installer') { if (invitation) { invitation.prompt(); invitation.userChoice.finally(() => { invitation = null; vueProfil(); }); } }
    else if (a === 'inv-installer') { fermerInvitation(); if (invitation) { invitation.prompt(); invitation.userChoice.then((c) => mesure('Invitation installer', c.outcome === 'accepted' ? 'acceptée' : 'refusée')).finally(() => { invitation = null; }); } }
    else if (a === 'inv-fermer') { fermerInvitation(); }
    else if (a === 'inv-copier') { const lien = location.origin + location.pathname; const ok = () => { toast('Lien copié'); fermerInvitation(); }; const repli = () => { const t = document.createElement('textarea'); t.value = lien; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Copie impossible : ' + lien); } t.remove(); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lien).then(ok, repli); else repli(); }
    else if (a === 'emporter') { emporter(); }
    else if (a === 'importer') { importer(); }
    else if (a === 'cadeau-code') { const c = $('#cadeau-code'); appliquerCadeau(c ? c.value : '', false); }
    else if (a === 'cadeau-refaire') { S.inscrit = false; sauver(); rerendre(route); }
    else if (a === 'tel-creer') { b.disabled = true; creerEspace(b.dataset.qui).then(() => vueRelier()).catch(() => { b.disabled = false; toast('Le serveur ne répond pas. Réessayez dans un instant.'); }); }
    else if (a === 'tel-moi') { b.disabled = true; rejoindre(b.dataset.qui); }
    else if (a === 'tel-sync') { b.disabled = true; synchroniser().then((ok) => { toast(ok ? 'Synchronisé.' : 'Pas de connexion au serveur pour l’instant.'); rerendre(vueProfil); }); }
    else if (a === 'tel-quitter') { quitterEspace(); }
    else if (a === 'tel-copier' || a === 'tel-partager') {
      if (!S.lien) return;
      const url = lienRejoindre(S.lien);
      const copier = () => { const fin = () => toast('Lien copié'); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(fin, () => toast('Copie impossible : sélectionnez le lien à la main.')); else toast('Copie impossible sur cet appareil.'); };
      if (a === 'tel-partager' && navigator.share) navigator.share({ title: 'Besoin d’Alchimie', text: 'Pour relier nos deux téléphones :', url }).catch(() => {}); else copier();
    }
    else if (a === 'tel-rejoindre-lien') { const v = ($('#tel-lien') || {}).value || ''; const m = /[?&]e=([A-Za-z0-9_-]{22})[^#]*?[?&]k=([A-Za-z0-9_-]{43})/.exec(v); if (!m) { toast('Ce lien ne ressemble pas à un lien d’espace.'); return; } aller('/rejoindre?e=' + m[1] + '&k=' + m[2]); }
    else if (a === 'rester') { try { sessionStorage.setItem('ba-rester', '1'); } catch (e) { /* stockage indisponible */ } route(); }
    else if (a === 'filtres') { const f = $('#filtres'); f.hidden = !f.hidden; }
    else if (a === 'quitter') { demander('Quitter l’expérience ? Ce qui a été écrit ne sera pas gardé.', 'Quitter', () => aller('/experience/' + id)); }
    else if (a === 'surp') { surprise[b.dataset.k] = surprise[b.dataset.k] === b.dataset.v ? '' : b.dataset.v; vueSurprends({}); }
    else if (a === 'majeurs') { S.majeurs = true; sauver(); mesure('Âge confirmé'); aller(S.onboarded ? '/' : '/bienvenue'); }
    else if (a === 'sortie') { try { location.replace('https://www.google.com/search?q=m%C3%A9t%C3%A9o'); } catch (e) { aller('/'); } }
    else if (a === 'mesure-bascule') { if (!S.mesure) S.mesure = { actif: true, compteurs: {} }; S.mesure.actif = !S.mesure.actif; sauver(); rerendre(vueProfil); }
    else if (a === 'mesure-zero') { if (S.mesure) S.mesure.compteurs = {}; sauver(); toast('Compteurs remis à zéro'); rerendre(vueProfil); }
    else if (a === 'mesure-copier') {
      const c = (S.mesure && S.mesure.compteurs) || {};
      const texte = 'Besoin d\u2019Alchimie, mes chiffres du ' + dateFr(new Date().toISOString()) + '\n' + Object.entries(c).sort((x, y) => y[1] - x[1]).map(([k, v]) => v + '  ' + k).join('\n');
      const repli = () => { const t = document.createElement('textarea'); t.value = texte; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); toast('Chiffres copiés'); } catch (e) { toast('Copie impossible sur cet appareil'); } t.remove(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(() => toast('Chiffres copiés, à coller dans WhatsApp'), repli); else repli();
    }
    else if (a === 'surp-go') { mesure('Surprends-nous'); scenerieSurprise(); }
    else if (a === 'onb-1') { onb.a = $('#onb-a').value.trim(); onb.b = $('#onb-b').value.trim(); if (!onb.a || !onb.b) { toast('Les deux prénoms, s’il vous plaît.'); return; } aller('/bienvenue?etape=2'); }
    else if (a === 'onb-enf') { const d = $('#onb-d'); if (d) onb.depuis = d.value; onb.enfants = b.dataset.v === 'oui'; rerendre(() => vueOnboarding(2)); }
    else if (a === 'onb-2') { onb.depuis = $('#onb-d').value; aller('/bienvenue?etape=3'); }
    else if (a === 'onb-gout') { const g = b.dataset.v; onb.gouts = onb.gouts.includes(g) ? onb.gouts.filter((x) => x !== g) : onb.gouts.concat([g]); rerendre(() => vueOnboarding(3)); }
    else if (a === 'onb-3') { S.couple = { a: onb.a, b: onb.b, depuis: onb.depuis, enfants: onb.enfants, gouts: onb.gouts }; S.onboarded = true; if (!S.premiereVisite) S.premiereVisite = new Date().toISOString(); sauver(); mesure('Accueil terminé'); aller('/bienvenue?etape=4'); }
    else if (a === 'pf-enf') { S.couple.enfants = b.dataset.v === 'oui'; sauver(); rerendre(vueProfil); }
    else if (a === 'pf-gout') { const g = b.dataset.v; S.couple.gouts = S.couple.gouts.includes(g) ? S.couple.gouts.filter((x) => x !== g) : S.couple.gouts.concat([g]); sauver(); rerendre(vueProfil); }
    else if (a === 'pf-sauver') { S.couple.a = $('#pf-a').value.trim() || S.couple.a; S.couple.b = $('#pf-b').value.trim() || S.couple.b; sauver(); toast('Enregistré'); vueProfil(); }
    else if (a === 'reset') { demander('Tout effacer ? Prénoms, favoris, souvenirs, Canari. Il n’y a pas de retour.', 'Tout effacer', () => { try { localStorage.removeItem(CLE); } catch (e) { /* stockage indisponible */ } S = defaut(); onb = { a: '', b: '', depuis: '', enfants: null, gouts: [] }; aller('/bienvenue'); }); }
    else if (a === 'rep-suppr') { delete S.reponses[id]; sauver(); rerendre(() => vueCouple('reponses')); }
    else if (a === 'souv-suppr') { S.souvenirs = S.souvenirs.filter((s) => s.id !== id); sauver(); rerendre(() => vueCouple('souvenirs')); }
    else if (a === 'souv-ouvrir') { const s = S.souvenirs.find((x) => x.id === id); if (s) { delete s.scelle; sauver(); rerendre(() => vueCouple('souvenirs')); } }
    else if (a === 'envie-add') { const v = $('#envie-txt').value.trim(); if (!v) return; S.envies.push({ id: uid(), texte: v, type: $('#envie-type').value, par: $('#envie-par').value }); sauver(); vueCouple('envies'); }
    else if (a === 'envie-suppr') { S.envies = S.envies.filter((v) => v.id !== id); sauver(); rerendre(() => vueCouple('envies')); }
    else if (a === 'canari-add') { const v = $('#canari-txt').value.trim(); if (!v) return; S.canari.push({ id: uid(), texte: v, par: $('#canari-par').value, date: new Date().toISOString(), tire: false }); sauver(); toast('Glissé dans le Canari'); vueCouple('canari'); }
    else if (a === 'canari-exemples') { BA.canariExemples.forEach((t, i) => S.canari.push({ id: uid(), texte: t, par: i % 2 ? 'B' : 'A', date: new Date().toISOString(), tire: false })); sauver(); vueCouple('canari'); }
    else if (a === 'canari-tirer') { const dedans = S.canari.filter((c) => !c.tire); if (!dedans.length) return; const c = hasard(dedans); $('#canari').classList.add('canari--tire'); b.disabled = true; plusTard(() => { c.tire = true; c.tireLe = new Date().toISOString(); sauver(); $('#idee').innerHTML = `<div class="idee">${esc(c.texte)}<small>glissée par ${esc(nom(c.par))}, le ${dateFr(c.date)}</small></div>`; $('#canari').classList.remove('canari--tire'); $('#canari').innerHTML = svgCanari(dedans.length - 1); b.disabled = dedans.length - 1 === 0; }, 1300); }
    else if (a === 'canari-remettre') { const c = S.canari.find((x) => x.id === id); if (c) { c.tire = false; sauver(); rerendre(() => vueCouple('canari')); } }
  });

  /* Envoi de l'adresse à Brevo (formulaire hébergé, réponse JSON). L'adresse n'est pas
     gardée sur le téléphone. Sans mail de confirmation tant que Brevo n'a pas activé
     l'envoi transactionnel du compte (16/10/2026). */
  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest('[data-form="cadeau"], [data-form="attente"]'); if (!f) return;
    ev.preventDefault();
    const quoi = f.dataset.form;
    const champ = $('#' + quoi + '-mail');
    const mail = champ && champ.value ? champ.value.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { toast('Cette adresse semble incomplète.'); return; }
    if (!$('#' + quoi + '-accord').checked) { toast('Cochez la case pour recevoir le mail.'); return; }
    const bt = f.querySelector('button[type=submit]'); const texte = bt.textContent; bt.disabled = true; bt.textContent = 'Envoi…';
    const cible = quoi === 'attente' ? FORMULAIRE_ATTENTE : FORMULAIRE_BREVO;
    const d = new FormData();
    d.append('EMAIL', mail); d.append('OPT_IN', '1'); d.append('email_address_check', ''); d.append('locale', 'fr');
    const ok = () => { if (quoi === 'attente') S.attente = true; else S.inscrit = true; sauver(); mesure(quoi === 'attente' ? 'Liste d’attente membre' : 'Inscription mail', 'envoyée'); rerendre(route); };
    const echec = (msg) => { bt.disabled = false; bt.textContent = texte; toast(msg || 'L’inscription n’est pas passée. Réessayez dans un instant.'); };
    /* Brevo répond en JSON et autorise besoindalchimie.com : on lit la vraie réponse. */
    fetch(cible + (cible.indexOf('?') > -1 ? '&' : '?') + 'isAjax=1', { method: 'POST', body: d })
      .then((r) => r.json())
      .then((j) => { if (j && j.success) ok(); else echec(j && j.errors && j.errors.EMAIL ? 'Cette adresse est refusée. Vérifiez-la.' : null); })
      .catch(() => echec('Pas de réseau. Réessayez dans un instant.'));
  });

  /* ------------------------------------------------------------ */
  /* Lumière vivante                                                 */
  /* Une braise (ou plusieurs lumières : il suffit d'ajouter des <i> dans #lumiere).
     Chaque lumière suit un chemin fait de trois sinusoïdes par axe, aux fréquences et
     phases tirées au hasard : jamais deux fois le même trajet, jamais d'à-coup. Une
     inertie lisse encore le mouvement. Pause quand l'app est cachée ou pendant une
     expérience ; fixe si l'appareil demande moins d'animations. */
  (function lumiereVivante() {
    const boite = document.getElementById('lumiere'); if (!boite) return;
    const spheres = Array.from(boite.children);
    const onde = () => ({ f: 0.012 + Math.random() * 0.03, p: Math.random() * Math.PI * 2, a: 0.25 + Math.random() * 0.75 });
    const val = (o, t) => { let s = 0, n = 0; o.forEach((w) => { s += w.a * Math.sin(t * w.f * Math.PI * 2 + w.p); n += w.a; }); return s / n; };
    const L = spheres.map((el) => ({ el, x: [onde(), onde(), onde()], y: [onde(), onde(), onde()], px: innerWidth / 2, py: innerHeight / 2 }));
    const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let t = Math.random() * 1000, avant = performance.now(), premier = true;
    function image(now) {
      const dt = Math.min(0.05, (now - avant) / 1000); avant = now;
      const actif = !document.hidden && !document.querySelector('.jeu');
      boite.style.visibility = document.querySelector('.jeu') ? 'hidden' : 'visible';
      if (actif || premier) {
        if (!calme) t += dt;
        const W = innerWidth, H = innerHeight, base = Math.max(W, H) * (L.length > 1 ? 0.8 : 0.95);
        L.forEach((l, i) => {
          const vx = W / 2 + val(l.x, t) * W * 0.62, vy = H / 2 + val(l.y, t) * H * 0.55;
          if (premier) { l.px = vx; l.py = vy; } else { l.px += (vx - l.px) * 0.06; l.py += (vy - l.py) * 0.06; }
          const taille = base * (1 + 0.08 * Math.sin(t * 0.35 + i * 2.1));
          l.el.style.width = l.el.style.height = taille + 'px';
          l.el.style.transform = 'translate3d(' + (l.px - taille / 2) + 'px,' + (l.py - taille / 2) + 'px,0)';
        });
        premier = false;
      }
      if (!calme) requestAnimationFrame(image);
    }
    requestAnimationFrame(image);
  })();

  /* Ouverture « La formule » : le décor est dans index.html et le CSS joue
     l'animation ; ici, on la retire à la fin, ou plus tôt si on touche l'écran. */
  (function ouverture() {
    const o = document.getElementById('ouverture'); if (!o) return;
    if (document.documentElement.classList.contains('sans-ouverture')) { o.remove(); return; }
    try { sessionStorage.setItem('ba-ouverture', '1'); } catch (e) { /* stockage indisponible */ }
    const fin = () => { if (o.isConnected) o.remove(); };
    o.addEventListener('click', () => { o.classList.add('ouverture--passe'); setTimeout(fin, 260); });
    o.addEventListener('animationend', (ev) => { if (ev.target === o) fin(); });
    setTimeout(fin, 3400);
  })();

  window.addEventListener('hashchange', route);
  route();
  if (S.lien) planifierSync(800);
})();
