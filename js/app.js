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
    setTimeout(() => el.remove(), 2400);
  }

  /* ------------------------------------------------------------ */
  /* État                                                            */
  const CLE = 'besoin-alchimie.proto.v1';
  const defaut = () => ({
    onboarded: false,
    couple: { a: '', b: '', depuis: '', enfants: null, gouts: [] },
    membre: false,
    favoris: [], aFaire: [], vecues: [], souvenirs: [], reponses: {}, canari: [], envies: []
  });
  let S = charger();
  function charger() {
    try { const j = localStorage.getItem(CLE); if (j) return Object.assign(defaut(), JSON.parse(j)); } catch (e) { /* stockage indisponible */ }
    return defaut();
  }
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(S)); }
    catch (e) { toast('Impossible d’enregistrer sur cet appareil.'); }
  }
  const noms = () => ({ A: S.couple.a || 'Toi', B: S.couple.b || 'L’autre' });
  const nom = (qui) => noms()[qui] || qui;

  /* ------------------------------------------------------------ */
  /* Accès aux données                                               */
  const EXP = BA.experiences;
  const exp = (id) => EXP.find((e) => e.id === id);
  const terr = (id) => BA.territoires.find((t) => t.id === id);
  const libelle = (liste, id) => { const x = liste.find((o) => o.id === id); return x ? x.nom : id; };
  const tempsCourt = (id) => { const x = BA.temps.find((o) => o.id === id); return x ? x.court : id; };
  const estMembre = () => S.membre;
  const accessible = (e) => e.decouverte || estMembre();

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
    if (e.decouverte && !estMembre()) tags.push('<span class="tag tag--decouverte">Découverte</span>');
    const fav = S.favoris.includes(e.id);
    return `<article class="carte t-${e.territoire}">
      <a class="carte__lien" href="#/experience/${e.id}" aria-label="${esc(e.titre)}"></a>
      <div class="carte__tags">${tags.join('')}</div>
      <div class="carte__terr">${esc(terr(e.territoire).nom)}</div>
      <h3 class="carte__titre">${esc(e.titre)}</h3>
      <p class="carte__accroche">${esc(e.accroche)}</p>
      <div class="carte__meta">${m.slice(0, 3).map(esc).join('<span class="pt"> · </span>')}</div>
      <button class="fav ${fav ? 'actif' : ''}" data-act="fav" data-id="${e.id}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${svgFav}</button>
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

    if (!S.onboarded && seg[0] !== 'bienvenue') { aller('/bienvenue'); return; }

    const r = seg[0] || '';
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
    aller('/');
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
          <select id="onb-d"><option value="">Je préfère ne pas dire</option><option value="moins-2">Moins de deux ans</option><option value="2-7">Entre deux et sept ans</option><option value="7-15">Entre sept et quinze ans</option><option value="15-plus">Plus de quinze ans</option></select></div>
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
    const colls = melange(BA.collections).slice(0, 3);
    rendre(`
      <section class="hero">
        <div class="surtitre">${salut()}${S.couple.a ? ', ' + esc(S.couple.a) + ' et ' + esc(S.couple.b) : ''}</div>
        <h1>De quoi avez-vous envie tous les deux ?</h1>
        <p>Choisissez, on vous propose quelque chose à vivre. Rien à préparer, rien à réussir.</p>
      </section>
      <section class="section">
        <div class="envies">${BA.envies.map((v) => `<a class="envie${v.id === 'desires' ? ' envie--fort' : ''}" href="#/envie/${v.id}">${esc(v.texte)}</a>`).join('')}</div>
      </section>
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
  }

  function carteCollection(c) {
    const n = expsCollection(c).length;
    return `<a class="collection" href="#/collection/${c.id}"><small>Collection</small><h3>${esc(c.nom)}</h3><p>${esc(c.phrase)}</p><span class="compte">${n} expérience${n > 1 ? 's' : ''}</span></a>`;
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
      <section class="section"><div class="section__tete"><h2>Collections</h2></div><div class="collections">${BA.collections.map(carteCollection).join('')}</div></section>
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
    const c = BA.collections.find((x) => x.id === id); if (!c) return aller('/explorer');
    rendre(`<a class="retour" href="#/explorer">← Explorer</a>
      <section class="hero"><div class="surtitre">Collection</div><h1>${esc(c.nom)}</h1><p>${esc(c.phrase)}</p></section>
      <section class="section">${grille(expsCollection(c))}</section>`);
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
    const colls = BA.collections.filter((c) => expsCollection(c).some((x) => x.id === e.id)).slice(0, 3);
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
          ${!ok ? `<div class="membre-encart"><div class="surtitre">Bibliothèque complète</div><h2>Cette expérience fait partie de la bibliothèque complète.</h2><p>L’accès Découverte comprend ${EXP.filter((x) => x.decouverte).length} expériences. La bibliothèque complète ouvre les ${EXP.length}, les audios, les collections saisonnières et tout l’espace Notre couple.</p><ul><li>Nouvelles expériences chaque mois</li><li>Les expériences audio</li><li>Favoris, souvenirs, envies, Canari</li><li>Surprends-nous sans limite</li></ul><button class="btn" data-act="membre">Activer l’accès membre (prototype)</button></div>` : ''}
        </div>
        <aside class="exp-cote">
          ${ok ? `<a class="btn" href="#/jouer/${e.id}">Commencer l’expérience</a>` : '<button class="btn" disabled>Commencer l’expérience</button>'}
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
  window.addEventListener('appinstalled', () => { invitation = null; toast('Besoin d\u2019Alchimie est sur votre écran d\u2019accueil.'); });
  const installee = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const iOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const encadree = () => { try { return window.self !== window.top; } catch (e) { return true; } };
  function blocInstaller() {
    if (encadree()) return '';   // affiché dans un cadre (Artifact) : l'installation y est impossible
    if (installee()) return '<div class="profil-bloc"><h3>Application</h3><p class="muted small">Vous utilisez l\u2019application installée.</p></div>';
    let corps;
    if (invitation) corps = '<p class="muted small">Ajoutez Besoin d\u2019Alchimie à votre écran d\u2019accueil : il s\u2019ouvre en plein écran, comme une application, même sans connexion.</p><div class="actions"><button class="btn" data-act="installer">Installer l\u2019application</button></div>';
    else if (iOS()) corps = '<p class="muted small">Sur iPhone, ouvrez cette page dans Safari, touchez le bouton Partager (le carré avec une flèche vers le haut), puis « Sur l\u2019écran d\u2019accueil ».</p><p class="note">L\u2019application installée garde ses propres données : ce que vous avez enregistré dans Safari n\u2019y sera pas.</p>';
    else corps = '<p class="muted small">Dans le menu de votre navigateur, choisissez « Installer l\u2019application » ou « Ajouter à l\u2019écran d\u2019accueil ».</p>';
    return '<div class="profil-bloc"><h3>Sur votre écran d\u2019accueil</h3>' + corps + '</div>';
  }

  /* ------------------------------------------------------------ */
  /* Profil                                                          */
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
        <div class="bascule"><div><strong>${estMembre() ? 'Membre Besoin d’Alchimie' : 'Découverte'}</strong><div class="muted small">${estMembre() ? 'Toute la bibliothèque, les audios, les collections, l’espace Notre couple.' : EXP.filter((x) => x.decouverte).length + ' expériences ouvertes. Le reste s’ouvre avec l’accès membre.'}</div></div><button class="${estMembre() ? 'actif' : ''}" data-act="membre" aria-label="Basculer l’accès membre"></button></div>
        <p class="note">Dans ce prototype, l’accès se bascule d’un geste. Dans le produit, ce sera un abonnement.</p>
      </div>
      ${blocInstaller()}
      <div class="profil-bloc">
        <h3>Vos données</h3>
        <p class="muted small">Tout ce que vous écrivez ici reste sur cet appareil. Rien n’est envoyé nulle part. Dans le produit final, un couple pourra lier deux téléphones ; ce prototype en simule un seul, qu’on se passe.</p>
        <div class="actions"><button class="btn btn--discret" data-act="reset">Effacer le prototype et recommencer</button></div>
      </div>
    `);
  }

  /* ------------------------------------------------------------ */
  /* Le moteur d'expériences                                         */
  function jouer(id) {
    const e = exp(id); if (!e) return aller('/explorer');
    if (!accessible(e)) return aller('/experience/' + id);
    const etapes = e.etapes.concat([{ t: 'fin' }]);
    const sess = { i: 0, sub: 0, passe: -1, rep: { A: {}, B: {} }, dev: { A: {}, B: {} }, choix: {}, secret: {}, opn: { A: {}, B: {} }, playlist: [], surprises: {}, questions: {}, vecue: false, tirages: {} };
    const N = noms();

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
            <div class="rep cache" data-j="devoiler"><small>${esc(N.A)}</small><div class="txt">${esc(a)}</div>${!et.sansDevine && dB ? `<div class="devine">${esc(N.B)} pensait : <b>${esc(dB)}</b></div>` : ''}</div>
            <div class="rep cache" data-j="devoiler"><small>${esc(N.B)}</small><div class="txt">${esc(b)}</div>${!et.sansDevine && dA ? `<div class="devine">${esc(N.A)} pensait : <b>${esc(dA)}</b></div>` : ''}</div>
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
        html: () => { if (!sess.vecue) { sess.vecue = true; S.vecues.push({ id: e.id, date: new Date().toISOString() }); sauver(); } sess.fin = sess.fin || { souvenir: false, phrase: false, refaire: S.aFaire.includes(e.id), favori: S.favoris.includes(e.id), reponses: false }; const f = sess.fin; const aRep = Object.keys(sess.rep.A).length > 0; return `<div class="surtitre">C’est fini</div><h2>Vous voulez garder quelque chose de ce moment ?</h2>
          <div class="fin-options">
            <button class="choix ${f.souvenir ? 'actif' : ''}" data-j="fin" data-k="souvenir"><b>Ajouter un souvenir</b><small>Une photo, une note, dans votre coffre.</small></button>
            <button class="choix ${f.phrase ? 'actif' : ''}" data-j="fin" data-k="phrase"><b>Écrire une phrase</b><small>Juste une, celle qui reste.</small></button>
            <button class="choix ${f.refaire ? 'actif' : ''}" data-j="fin" data-k="refaire"><b>Refaire plus tard</b><small>Dans « À faire ensemble ».</small></button>
            <button class="choix ${f.favori ? 'actif' : ''}" data-j="fin" data-k="favori"><b>Ajouter aux favoris</b><small>Sous le coude.</small></button>
            ${aRep ? `<button class="choix ${f.reponses ? 'actif' : ''}" data-j="fin" data-k="reponses"><b>Garder nos réponses</b><small>Sinon, elles s’effacent en sortant.</small></button>` : ''}
          </div>
          <div id="fin-form" ${f.souvenir || f.phrase ? '' : 'hidden'} style="margin-top:14px"><div class="champ"><textarea id="fin-txt" placeholder="${f.phrase && !f.souvenir ? 'La phrase.' : 'Ce que vous voulez vous rappeler de ce moment.'}">${esc(f.texte || '')}</textarea></div>${f.souvenir ? '<div class="champ"><label for="fin-photo">Une photo (facultatif)</label><input type="file" id="fin-photo" accept="image/*" /></div>' : ''}</div>
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

    function lireFichier(input, cb) {
      const f = input && input.files && input.files[0]; if (!f) return cb(null);
      const img = new Image(); const url = URL.createObjectURL(f);
      img.onload = () => { const max = 900; const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', 0.78)); };
      img.onerror = () => cb(null); img.src = url;
    }

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
      else if (j === 'devoiler') { b.classList.remove('cache'); }
      else if (j === 'surprise') { sess.surprises[b.dataset.q] = !sess.surprises[b.dataset.q]; montrer(); }
      else if (j === 'choix') { sess.choix[b.dataset.cle] = b.dataset.v; suivant(); }
      else if (j === 'secret') { const v = $('#sec').value.trim(); if (!v) { toast('Écris au moins quelques mots.'); return; } sess.secret[b.dataset.qui] = v; suivant(); }
      else if (j === 'sceller') { const ouvrir = new Date(); ouvrir.setFullYear(ouvrir.getFullYear() + 1); ['A', 'B'].forEach((q) => { if (sess.secret[q]) S.souvenirs.push({ id: uid(), expId: e.id, date: new Date().toISOString(), texte: sess.secret[q], par: q, scelle: { ouvrir: ouvrir.toISOString() } }); }); sauver(); toast('Deux lettres scellées, à ouvrir le ' + dateFr(ouvrir.toISOString())); suivant(); }
      else if (j === 'opn') { sess.opn[et.qui][b.dataset.i] = b.dataset.v; montrer(); }
      else if (j === 'pl') { sess.playlist[sess.sub] = { titre: $('#pl-t').value.trim(), artiste: $('#pl-a').value.trim() }; sess.sub++; montrer(); }
      else if (j === 'sv-garder') { $('#garde').hidden = false; $('#sv-txt').focus(); }
      else if (j === 'sv-ok') { const txt = $('#sv-txt').value.trim(); lireFichier($('#sv-photo'), (photo) => { if (!txt && !photo) { toast('Une phrase ou une photo, au moins.'); return; } S.souvenirs.push({ id: uid(), expId: e.id, date: new Date().toISOString(), texte: txt || et.pistes[sess.sub], photo: photo }); sauver(); toast('Gardé dans vos souvenirs.'); $('#garde').hidden = true; $('#sv-txt').value = ''; }); }
      else if (j === 'play') { const a = sess.audio; a.joue = !a.joue; nettoyer(); if (a.joue) chaque(() => { a.pos++; majAudio(); if (a.pos >= a.duree) nettoyer(); }, 1000); majAudio(); }
      else if (j === 'avancer') { const a = sess.audio; a.pos = Math.min(a.duree, a.pos + 60); majAudio(); }
      else if (j === 'le-add') { const v = $('#le-txt').value.trim(); if (!v) return; S.envies.push({ id: uid(), texte: v, type: 'Destination', par: $('#le-par').value, session: sess.id }); sauver(); $('#le-txt').value = ''; $('#le-liste').innerHTML = listeEnviesSession(et); $('#le-txt').focus(); }
      else if (j === 'fin') { const k = b.dataset.k; const f = sess.fin; const t = $('#fin-txt'); if (t) f.texte = t.value; f[k] = !f[k]; montrer(); }
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
        if (f.souvenir) lireFichier($('#fin-photo'), finir); else finir(null);
      }
    });

    montrer();
  }

  /* ------------------------------------------------------------ */
  /* Actions globales (délégation)                                   */
  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, id = b.dataset.id;
    if (a === 'fav') { ev.preventDefault(); if (S.favoris.includes(id)) { S.favoris = S.favoris.filter((x) => x !== id); toast('Retiré des favoris'); } else { S.favoris.push(id); toast('Ajouté aux favoris'); } sauver(); route(); }
    else if (a === 'afaire') { if (S.aFaire.includes(id)) { S.aFaire = S.aFaire.filter((x) => x !== id); toast('Retiré de votre liste'); } else { S.aFaire.push(id); toast('Ajouté à « À faire ensemble »'); } sauver(); route(); }
    else if (a === 'membre') { S.membre = !S.membre; sauver(); toast(S.membre ? 'Accès membre activé (prototype)' : 'Retour à l’accès Découverte'); route(); }
    else if (a === 'installer') { if (invitation) { invitation.prompt(); invitation.userChoice.finally(() => { invitation = null; vueProfil(); }); } }
    else if (a === 'filtres') { const f = $('#filtres'); f.hidden = !f.hidden; }
    else if (a === 'quitter') { demander('Quitter l’expérience ? Ce qui a été écrit ne sera pas gardé.', 'Quitter', () => aller('/experience/' + id)); }
    else if (a === 'surp') { surprise[b.dataset.k] = surprise[b.dataset.k] === b.dataset.v ? '' : b.dataset.v; vueSurprends({}); }
    else if (a === 'surp-go') { scenerieSurprise(); }
    else if (a === 'onb-1') { onb.a = $('#onb-a').value.trim(); onb.b = $('#onb-b').value.trim(); if (!onb.a || !onb.b) { toast('Les deux prénoms, s’il vous plaît.'); return; } aller('/bienvenue?etape=2'); }
    else if (a === 'onb-enf') { onb.enfants = b.dataset.v === 'oui'; vueOnboarding(2); const s = $('#onb-d'); if (s) s.value = onb.depuis; }
    else if (a === 'onb-2') { onb.depuis = $('#onb-d').value; aller('/bienvenue?etape=3'); }
    else if (a === 'onb-gout') { const g = b.dataset.v; onb.gouts = onb.gouts.includes(g) ? onb.gouts.filter((x) => x !== g) : onb.gouts.concat([g]); vueOnboarding(3); }
    else if (a === 'onb-3') { S.couple = { a: onb.a, b: onb.b, depuis: onb.depuis, enfants: onb.enfants, gouts: onb.gouts }; S.onboarded = true; sauver(); aller('/bienvenue?etape=4'); }
    else if (a === 'pf-enf') { S.couple.enfants = b.dataset.v === 'oui'; sauver(); vueProfil(); }
    else if (a === 'pf-gout') { const g = b.dataset.v; S.couple.gouts = S.couple.gouts.includes(g) ? S.couple.gouts.filter((x) => x !== g) : S.couple.gouts.concat([g]); sauver(); vueProfil(); }
    else if (a === 'pf-sauver') { S.couple.a = $('#pf-a').value.trim() || S.couple.a; S.couple.b = $('#pf-b').value.trim() || S.couple.b; sauver(); toast('Enregistré'); vueProfil(); }
    else if (a === 'reset') { demander('Tout effacer ? Prénoms, favoris, souvenirs, Canari. Il n’y a pas de retour.', 'Tout effacer', () => { try { localStorage.removeItem(CLE); } catch (e) { /* stockage indisponible */ } S = defaut(); onb = { a: '', b: '', depuis: '', enfants: null, gouts: [] }; aller('/bienvenue'); }); }
    else if (a === 'rep-suppr') { delete S.reponses[id]; sauver(); vueCouple('reponses'); }
    else if (a === 'souv-suppr') { S.souvenirs = S.souvenirs.filter((s) => s.id !== id); sauver(); vueCouple('souvenirs'); }
    else if (a === 'souv-ouvrir') { const s = S.souvenirs.find((x) => x.id === id); if (s) { delete s.scelle; sauver(); vueCouple('souvenirs'); } }
    else if (a === 'envie-add') { const v = $('#envie-txt').value.trim(); if (!v) return; S.envies.push({ id: uid(), texte: v, type: $('#envie-type').value, par: $('#envie-par').value }); sauver(); vueCouple('envies'); }
    else if (a === 'envie-suppr') { S.envies = S.envies.filter((v) => v.id !== id); sauver(); vueCouple('envies'); }
    else if (a === 'canari-add') { const v = $('#canari-txt').value.trim(); if (!v) return; S.canari.push({ id: uid(), texte: v, par: $('#canari-par').value, date: new Date().toISOString(), tire: false }); sauver(); toast('Glissé dans le Canari'); vueCouple('canari'); }
    else if (a === 'canari-exemples') { BA.canariExemples.forEach((t, i) => S.canari.push({ id: uid(), texte: t, par: i % 2 ? 'B' : 'A', date: new Date().toISOString(), tire: false })); sauver(); vueCouple('canari'); }
    else if (a === 'canari-tirer') { const dedans = S.canari.filter((c) => !c.tire); if (!dedans.length) return; const c = hasard(dedans); $('#canari').classList.add('canari--tire'); b.disabled = true; plusTard(() => { c.tire = true; c.tireLe = new Date().toISOString(); sauver(); $('#idee').innerHTML = `<div class="idee">${esc(c.texte)}<small>glissée par ${esc(nom(c.par))}, le ${dateFr(c.date)}</small></div>`; $('#canari').classList.remove('canari--tire'); $('#canari').innerHTML = svgCanari(dedans.length - 1); b.disabled = dedans.length - 1 === 0; }, 1300); }
    else if (a === 'canari-remettre') { const c = S.canari.find((x) => x.id === id); if (c) { c.tire = false; sauver(); vueCouple('canari'); } }
  });

  window.addEventListener('hashchange', route);
  route();
})();
