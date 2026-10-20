/* Tom Hennequin, site personnel. Aucune dépendance externe. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NBSP = '\u00a0';
  const MINUS = '\u2212';

  /* ------------------------------------------------------------------ */
  /* Langue et formats                                                   */
  /* ------------------------------------------------------------------ */

  let lang = 'fr';
  const EN = window.I18N_EN || {};
  const locale = () => (lang === 'en' ? 'en-GB' : 'fr-FR');

  // Valeurs multilingues des données : chaîne simple ou { fr, en }
  const L = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.fr) : v);

  function fmtNum(x, d = 0) {
    if (x == null || !isFinite(x)) return '–';
    return new Intl.NumberFormat(locale(), { minimumFractionDigits: d, maximumFractionDigits: d })
      .format(x).replace('-', MINUS);
  }

  // x en points de pourcentage : 7.23 -> « 7,23 % » (fr) ou « 7.23% » (en)
  function fmtPts(x, d = 0, signed = false) {
    if (x == null || !isFinite(x)) return '–';
    const body = fmtNum(Math.abs(x), d);
    const isZero = Number(body.replace(/\D/g, '')) === 0;
    const sign = x < 0 && !isZero ? MINUS : (signed && x > 0 && !isZero ? '+' : '');
    return sign + body + (lang === 'en' ? '%' : NBSP + '%');
  }
  const fmtPct = (x, d = 1, signed = false) => fmtPts(x * 100, d, signed);

  const MONTHS = {
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  const HEAT_MONTHS = {
    fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    en: MONTHS.en
  };
  const fmtMonth = (d) => `${MONTHS[lang][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const fmtDate = (d) => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);

  const TXT = {
    fr: {
      menu: 'Menu',
      close: 'Fermer',
      years: (n) => `${n}${NBSP}ans`,
      axisYears: (n) => `${n} ans`,
      simTitle: (mem, n) => `Autocall Phoenix ${mem ? 'à effet mémoire' : 'sans effet mémoire'}, ${n}${NBSP}ans`,
      barrier: { call: 'Rappel', coupon: 'Coupon', prot: 'Protection' },
      end: { called: 'Rappel', loss: 'Perte', mat: 'Échéance' },
      simAria: (n) => `Trajectoire simulée de l’indice sur ${n} an${n > 1 ? 's' : ''}, avec les barrières de rappel, de coupon et de protection.`,
      called: (k, lvl, cpn, memo, irr) =>
        `<strong>Rappel anticipé à la fin de ${k === 1 ? 'la première année' : 'l’année ' + k}.</strong> L’indice est à ${lvl} de son niveau initial${NBSP}: le produit rembourse le capital et ${cpn} de coupons au total${memo}. TRI${NBSP}: ${irr}.`,
      memo: (n) => `, dont ${n === 1 ? 'un coupon rattrapé' : n + ' coupons rattrapés'} grâce à l’effet mémoire`,
      matured: (lvl, cpn, irr) =>
        `<strong>Pas de rappel anticipé.</strong> À l’échéance, l’indice est à ${lvl}${NBSP}: le capital est remboursé intégralement${cpn ? `, et les coupons versés totalisent ${cpn}` : ', sans aucun coupon versé'}. TRI${NBSP}: ${irr}.`,
      lost: (lvl, prot, red, cpn, irr) =>
        `<strong>Perte en capital à l’échéance.</strong> L’indice termine à ${lvl}, sous la barrière de protection de ${prot}${NBSP}: le produit rembourse ${red} du capital${cpn ? `, après ${cpn} de coupons` : ''}. TRI${NBSP}: ${irr}.`,
      hyp: (s, f) => [
        `Rappel anticipé à la fin des années 1 à ${s.years - 1} si l’indice est au moins à ${fmtPts(s.call)} de son niveau initial${s.stepDown > 0 ? `, barrière abaissée de ${fmtPts(s.stepDown, 1)} par an` : ''}${NBSP}: le capital est remboursé avec le coupon de l’année.`,
        `Coupon conditionnel de ${f} par an, le coupon d’équilibre calculé par le pricer, versé si l’indice est au moins à ${fmtPts(s.coupon)}${s.memory ? '. Un coupon non versé est rattrapé au versement suivant (effet mémoire).' : ', sans effet mémoire.'}`,
        `À l’échéance, capital remboursé si l’indice est au moins à ${fmtPts(s.protection)}. En dessous, le remboursement est égal au niveau de l’indice.`,
        `Indice modélisé par un mouvement brownien géométrique${NBSP}: volatilité ${fmtPts(s.vol)}, dérive égale au taux sans risque (${fmtPts(s.r, 2)}) moins les dividendes (${fmtPts(s.q, 2)}), pas mensuel.`,
        `TRI${NBSP}: taux de rendement interne des flux reçus pour 100 investis.`,
        `Illustration pédagogique${NBSP}: ni un prix, ni une offre.`
      ],
      split: { red: 'Remboursement actualisé', cpn: 'Coupons actualisés', margin: 'Marge', title: 'Décomposition du prix d’émission, en % du nominal' },
      distAria: 'Probabilité de chaque issue du produit',
      distMat: 'Éch.',
      distLoss: 'Perte',
      distCaption: 'Rappel par année, échéance sans perte, perte',
      sensAria: 'Coupon d’équilibre en fonction de la volatilité',
      sensX: 'Volatilité',
      ts: (s, f, today) => [
        ['Émetteur', `Émetteur fictif, spread de crédit ${fmtPts(s.spread, 2)}`],
        ['Sous-jacent', `Indice actions fictif, volatilité ${fmtPts(s.vol)}, dividendes ${fmtPts(s.q, 2)}`],
        ['Devise', 'EUR'],
        ['Prix d’émission', fmtPts(100)],
        ['Maturité maximale', `${s.years}${NBSP}ans, observations annuelles`],
        ['Rappel anticipé', `Années 1 à ${s.years - 1}, si l’indice est au moins à ${fmtPts(s.call)} de son niveau initial${s.stepDown > 0 ? `, barrière abaissée de ${fmtPts(s.stepDown, 1)} par an` : ''}`],
        ['Coupon conditionnel', `${f} par an si l’indice est au moins à ${fmtPts(s.coupon)}${s.memory ? ', avec effet mémoire' : ''}`],
        ['Remboursement à l’échéance', `${fmtPts(100)} si l’indice est au moins à ${fmtPts(s.protection)}, sinon 100${NBSP}% × niveau final / niveau initial`],
        ['Marge de structuration', fmtPts(s.margin, 2)],
        ['Date de valorisation', today]
      ],
      printTitle: 'Termes indicatifs : autocall Phoenix',
      fs: {
        objective: 'Objectif', horizon: 'Horizon', benchmark: 'Indice de référence', history: 'Historique',
        since: (d) => `Depuis ${d}`,
        tabs: { perf: 'Base 100', dd: 'Perte depuis le plus haut', month: 'Rendements mensuels' },
        tabsLabel: 'Vues du portefeuille',
        pf: 'Portefeuille', bm: 'Indice de référence', bmShort: 'Indice',
        figures: (d) => `Indicateurs au ${d}`,
        indicator: 'Indicateur',
        rows: { cum: 'Performance depuis l’origine', ann: 'Performance annualisée', r12: 'Performance sur 12 mois', vol: 'Volatilité annualisée', mdd: 'Perte maximale', sharpe: 'Ratio de Sharpe' },
        risk: 'Classe de risque estimée', riskAria: (c) => `Classe ${c} sur 7`, lower: 'Risque plus faible', higher: 'Risque plus élevé',
        alloc: 'Allocation', method: 'Méthode', fake: 'Données fictives',
        year: 'Année', total: 'Total', heatCaption: 'Rendements mensuels du portefeuille, en %',
        perfAria: (a, b, p, bm, fake) => `Évolution base 100 de ${a} à ${b}. Portefeuille à ${p}${bm ? `, indice de référence à ${bm}` : ''}.${fake ? ' Données fictives.' : ''}`,
        ddAria: (p, bm) => `Perte depuis le plus haut. Perte maximale du portefeuille ${p}${bm ? `, de l’indice ${bm}` : ''}.`
      },
      method1: (rf) => `Rendements mensuels calculés par la méthode de Dietz modifiée puis chaînés, ce qui approche le rendement pondéré par le temps${NBSP}: les versements n’influencent pas la performance. Volatilité${NBSP}: écart-type des rendements mensuels, annualisé. Ratio de Sharpe calculé avec un taux sans risque de ${rf}. Classe de risque estimée sur l’échelle de 1 à 7 des documents d’informations clés, à partir de la seule volatilité.`,
      method2: (d) => `Données au ${d}. Les performances passées ne préjugent pas des performances futures. Ces informations ne constituent pas un conseil en investissement.`,
      noData: 'Les données des portefeuilles sont introuvables (data/portefeuilles.js).',
      copied: 'Adresse copiée.',
      copyFail: 'Copie impossible : sélectionnez l’adresse à la main.',
      vcardTitle: 'Étudiant-ingénieur en ingénierie financière et actuariat',
      vcardNote: 'Recherche un stage de 2 à 5 mois en structuration ou en actuariat, à partir du 31 mai 2027.'
    },
    en: {
      menu: 'Menu',
      close: 'Close',
      years: (n) => `${n}${NBSP}years`,
      axisYears: (n) => `${n} yrs`,
      simTitle: (mem, n) => `Phoenix autocallable ${mem ? 'with memory coupon' : 'without memory'}, ${n}${NBSP}years`,
      barrier: { call: 'Autocall', coupon: 'Coupon', prot: 'Protection' },
      end: { called: 'Called', loss: 'Loss', mat: 'Maturity' },
      simAria: (n) => `Simulated path of the index over ${n} year${n > 1 ? 's' : ''}, with the autocall, coupon and protection barriers.`,
      called: (k, lvl, cpn, memo, irr) =>
        `<strong>Called at the end of year ${k}.</strong> The index is at ${lvl} of its initial level: the note repays the capital plus ${cpn} in coupons${memo}. IRR: ${irr}.`,
      memo: (n) => `, including ${n === 1 ? 'one missed coupon' : n + ' missed coupons'} recovered through the memory feature`,
      matured: (lvl, cpn, irr) =>
        `<strong>No early redemption.</strong> At maturity the index is at ${lvl}: the capital is repaid in full${cpn ? `, and coupons paid add up to ${cpn}` : ', with no coupon paid'}. IRR: ${irr}.`,
      lost: (lvl, prot, red, cpn, irr) =>
        `<strong>Capital loss at maturity.</strong> The index ends at ${lvl}, below the ${prot} protection barrier: the note repays ${red} of the capital${cpn ? `, after ${cpn} in coupons` : ''}. IRR: ${irr}.`,
      hyp: (s, f) => [
        `Early redemption at the end of years 1 to ${s.years - 1} if the index is at or above ${fmtPts(s.call)} of its initial level${s.stepDown > 0 ? `, with the barrier stepping down by ${fmtPts(s.stepDown, 1)} a year` : ''}: the capital is repaid with that year’s coupon.`,
        `Conditional coupon of ${f} a year, the fair coupon from the pricer, paid if the index is at or above ${fmtPts(s.coupon)}${s.memory ? '. A missed coupon is paid later if the condition is met again (memory feature).' : ', without memory.'}`,
        `At maturity, the capital is repaid if the index is at or above ${fmtPts(s.protection)}. Below that, the redemption equals the index level.`,
        `Index modelled as a geometric Brownian motion: ${fmtPts(s.vol)} volatility, drift equal to the risk-free rate (${fmtPts(s.r, 2)}) minus dividends (${fmtPts(s.q, 2)}), monthly steps.`,
        'IRR: internal rate of return of the cash flows received for 100 invested.',
        'For illustration only, not a price or an offer.'
      ],
      split: { red: 'Discounted redemption', cpn: 'Discounted coupons', margin: 'Margin', title: 'Issue price breakdown, in % of notional' },
      distAria: 'Probability of each outcome of the note',
      distMat: 'Mat.',
      distLoss: 'Loss',
      distCaption: 'Called by year, maturity without loss, loss',
      sensAria: 'Fair coupon as a function of volatility',
      sensX: 'Volatility',
      ts: (s, f, today) => [
        ['Issuer', `Fictitious issuer, credit spread ${fmtPts(s.spread, 2)}`],
        ['Underlying', `Fictitious equity index, ${fmtPts(s.vol)} volatility, ${fmtPts(s.q, 2)} dividend yield`],
        ['Currency', 'EUR'],
        ['Issue price', fmtPts(100)],
        ['Maximum maturity', `${s.years}${NBSP}years, annual observations`],
        ['Autocall', `Years 1 to ${s.years - 1}, if the index is at or above ${fmtPts(s.call)} of its initial level${s.stepDown > 0 ? `, barrier stepping down by ${fmtPts(s.stepDown, 1)} a year` : ''}`],
        ['Conditional coupon', `${f} a year if the index is at or above ${fmtPts(s.coupon)}${s.memory ? ', with memory' : ''}`],
        ['Redemption at maturity', `${fmtPts(100)} if the index is at or above ${fmtPts(s.protection)}, otherwise 100% × final level / initial level`],
        ['Structuring margin', fmtPts(s.margin, 2)],
        ['Pricing date', today]
      ],
      printTitle: 'Indicative terms: Phoenix autocallable',
      fs: {
        objective: 'Objective', horizon: 'Horizon', benchmark: 'Benchmark', history: 'Track record',
        since: (d) => `Since ${d}`,
        tabs: { perf: 'Rebased to 100', dd: 'Drawdown', month: 'Monthly returns' },
        tabsLabel: 'Portfolio views',
        pf: 'Portfolio', bm: 'Benchmark', bmShort: 'Benchmark',
        figures: (d) => `Key figures as of ${d}`,
        indicator: 'Indicator',
        rows: { cum: 'Return since inception', ann: 'Annualised return', r12: '12-month return', vol: 'Annualised volatility', mdd: 'Maximum drawdown', sharpe: 'Sharpe ratio' },
        risk: 'Estimated risk class', riskAria: (c) => `Class ${c} out of 7`, lower: 'Lower risk', higher: 'Higher risk',
        alloc: 'Allocation', method: 'Approach', fake: 'Illustrative data',
        year: 'Year', total: 'Total', heatCaption: 'Monthly portfolio returns, in %',
        perfAria: (a, b, p, bm, fake) => `Rebased to 100 from ${a} to ${b}. Portfolio at ${p}${bm ? `, benchmark at ${bm}` : ''}.${fake ? ' Illustrative data.' : ''}`,
        ddAria: (p, bm) => `Drawdown from the previous high. Portfolio maximum drawdown ${p}${bm ? `, benchmark ${bm}` : ''}.`
      },
      method1: (rf) => `Monthly returns use the Modified Dietz method and are chain-linked, which approximates a time-weighted return: contributions do not affect performance. Volatility: standard deviation of monthly returns, annualised. Sharpe ratio computed with a risk-free rate of ${rf}. Risk class estimated on the 1-to-7 scale of PRIIPs key information documents, from volatility only.`,
      method2: (d) => `Data as of ${d}. Past performance is not a reliable indicator of future results. This is not investment advice.`,
      noData: 'Portfolio data not found (data/portefeuilles.js).',
      copied: 'Address copied.',
      copyFail: 'Could not copy, please select the address.',
      vcardTitle: 'Engineering student in financial engineering and actuarial science',
      vcardNote: 'Looking for a 2 to 5-month internship in structuring or actuarial work, from 31 May 2027.'
    }
  };
  const t = () => TXT[lang];

  const original = new Map();
  const originalAttrs = new Map();
  const FR_TITLE = document.title;
  const metaDesc = $('meta[name="description"]');
  const FR_DESC = metaDesc ? metaDesc.content : '';

  function translatePage() {
    $$('[data-i18n]').forEach((el) => {
      if (!original.has(el)) original.set(el, el.innerHTML);
      const en = EN[el.dataset.i18n];
      el.innerHTML = lang === 'en' && en != null ? en : original.get(el);
    });
    $$('[data-i18n-attr]').forEach((el) => {
      const pairs = el.dataset.i18nAttr.split(';').map((p) => p.split(':'));
      if (!originalAttrs.has(el)) {
        originalAttrs.set(el, Object.fromEntries(pairs.map(([a]) => [a, el.getAttribute(a)])));
      }
      pairs.forEach(([attr, key]) => {
        const v = lang === 'en' && EN[key] != null ? EN[key] : originalAttrs.get(el)[attr];
        if (v != null) el.setAttribute(attr, v);
      });
    });
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? EN['meta.title'] || FR_TITLE : FR_TITLE;
    if (metaDesc) metaDesc.content = lang === 'en' ? EN['meta.description'] || FR_DESC : FR_DESC;
  }

  const langListeners = [];
  const onLangChange = (fn) => langListeners.push(fn);

  function setLang(next, remember) {
    lang = next === 'en' ? 'en' : 'fr';
    translatePage();
    $$('.lang-switch [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    langListeners.forEach((fn) => fn());
    if (!remember) return;
    try { localStorage.setItem('lang', lang); } catch (e) { /* stockage indisponible */ }
    try {
      const url = new URL(window.location.href);
      if (lang === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
      history.replaceState(null, '', url);
    } catch (e) { /* file:// */ }
  }

  /* ------------------------------------------------------------------ */
  /* Outils SVG                                                          */
  /* ------------------------------------------------------------------ */

  const SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs, parent) {
    const n = document.createElementNS(SVGNS, name);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  }
  function svgText(parent, x, y, str, cls, anchor = 'start') {
    const n = svgEl('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
    n.textContent = str;
    return n;
  }
  function newSvg(box, W, H) {
    box.innerHTML = '';
    return svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, focusable: 'false', 'aria-hidden': 'true' }, box);
  }

  function watchWidth(el, fn) {
    let last = el.clientWidth;
    let timer;
    const run = () => {
      const w = el.clientWidth;
      if (w > 0 && w !== last) { last = w; fn(); }
    };
    if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(run, 80); }).observe(el);
    else window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(run, 120); });
  }

  function niceStep(range, target = 4) {
    const raw = range / target;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= raw) return m * pow;
    return 10 * pow;
  }

  /* ------------------------------------------------------------------ */
  /* En-tête                                                             */
  /* ------------------------------------------------------------------ */

  function setupHeader() {
    const head = $('.site-header');
    const onScroll = () => head.classList.toggle('is-scrolled', window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const links = $$('.nav a');
    const byId = Object.fromEntries(links.map((a) => [a.getAttribute('href').slice(1), a]));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((l) => l.removeAttribute('aria-current'));
          if (byId[e.target.id]) byId[e.target.id].setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      $$('main > section').forEach((s) => io.observe(s));
    }

    const toggle = $('.menu-toggle');
    const nav = $('#nav');
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? t().close : t().menu;
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    const desktop = window.matchMedia('(min-width: 981px)');
    const onDesktop = (mq) => { if (mq.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop);
    onLangChange(() => setOpen(toggle.getAttribute('aria-expanded') === 'true'));

    $$('.lang-switch [data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang, true)));
  }

  /* ------------------------------------------------------------------ */
  /* Moteur : autocall Phoenix par Monte Carlo                           */
  /* ------------------------------------------------------------------ */

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const MAX_YEARS = 10;
  const HALF_PATHS = 10000; // 20 000 trajectoires avec les antithétiques
  let draws = null;

  // Tirages gaussiens communs à tous les réglages (graine fixe)
  function getDraws() {
    if (draws) return draws;
    const n = HALF_PATHS * MAX_YEARS;
    const rand = mulberry32(20270531);
    draws = new Float64Array(n);
    for (let i = 0; i < n; i += 2) {
      let u = 0, v = 0;
      while (u === 0) u = rand();
      while (v === 0) v = rand();
      const rad = Math.sqrt(-2 * Math.log(u)), ang = 2 * Math.PI * v;
      draws[i] = rad * Math.cos(ang);
      if (i + 1 < n) draws[i + 1] = rad * Math.sin(ang);
    }
    return draws;
  }

  const callLevel = (s, k) => Math.max(0, s.call - s.stepDown * (k - 1));

  // Prix sous probabilité risque-neutre. Le prix est linéaire en coupon : P(c) = A + c·B,
  // d'où le coupon d'équilibre c* = (100 - marge - A) / B.
  function priceAutocall(s, volPct = s.vol) {
    const z = getDraws();
    const T = s.years;
    const vol = volPct / 100;
    const drift = (s.r - s.q) / 100 - 0.5 * vol * vol;
    const disc = new Float64Array(T + 1);
    const barrier = new Float64Array(T + 1);
    for (let k = 1; k <= T; k++) {
      disc[k] = Math.exp(-((s.r + s.spread) / 100) * k);
      barrier[k] = callLevel(s, k);
    }
    let A = 0, B = 0, nCall = 0, nLoss = 0, life = 0, lossSum = 0;
    const dist = new Float64Array(T + 2);

    for (let i = 0; i < HALF_PATHS; i++) {
      const base = i * MAX_YEARS;
      for (let sign = 1; sign >= -1; sign -= 2) {
        let lnS = 0, unpaid = 0, units = 0;
        for (let k = 1; k <= T; k++) {
          lnS += drift + vol * sign * z[base + k - 1];
          const S = 100 * Math.exp(lnS);
          unpaid++;
          if (S >= s.coupon) { units += (s.memory ? unpaid : 1) * disc[k]; unpaid = 0; }
          else if (!s.memory) unpaid = 0;
          if (k < T && S >= barrier[k]) { A += 100 * disc[k]; nCall++; life += k; dist[k]++; break; }
          if (k === T) {
            if (S >= s.protection) { A += 100 * disc[k]; dist[T]++; }
            else { A += S * disc[k]; nLoss++; lossSum += 100 - S; dist[T + 1]++; }
            life += T;
          }
        }
        B += units;
      }
    }
    const N = 2 * HALF_PATHS;
    A /= N;
    B /= N;
    return {
      fair: B > 1e-9 ? (100 - s.margin - A) / B : NaN,
      A, B,
      pCall: nCall / N,
      pLoss: nLoss / N,
      life: life / N,
      lossGivenLoss: nLoss ? lossSum / nLoss : 0,
      dist: Array.from(dist, (x) => x / N)
    };
  }

  function simulatePath(seed, s) {
    const rand = mulberry32(seed);
    const steps = s.years * 12;
    const vol = s.vol / 100;
    const mu = ((s.r - s.q) / 100 - 0.5 * vol * vol) / 12;
    const sd = vol / Math.sqrt(12);
    const path = [100];
    let x = 100;
    for (let i = 1; i <= steps; i++) { x *= Math.exp(mu + sd * gauss(rand)); path.push(x); }
    return path;
  }

  function evaluatePath(path, s, coupon) {
    let unpaid = 0, total = 0;
    const obs = [], flows = [];
    for (let k = 1; k <= s.years; k++) {
      const L = path[k * 12];
      unpaid++;
      let units = 0;
      if (L >= s.coupon) { units = s.memory ? unpaid : 1; unpaid = 0; }
      else if (!s.memory) unpaid = 0;
      const c = units * coupon;
      total += c;
      obs.push({ k, level: L, units });
      if (k < s.years && L >= callLevel(s, k)) {
        flows.push({ t: k, amount: c + 100 });
        return { end: k, called: true, loss: false, final: L, redemption: 100, total, obs, flows };
      }
      if (k === s.years) {
        const red = L >= s.protection ? 100 : L;
        flows.push({ t: k, amount: c + red });
        return { end: k, called: false, loss: L < s.protection, final: L, redemption: red, total, obs, flows };
      }
      if (c > 0) flows.push({ t: k, amount: c });
    }
    return null;
  }

  function irr(flows) {
    const npv = (r) => flows.reduce((acc, f) => acc + f.amount / Math.pow(1 + r, f.t), -100);
    let lo = -0.99, hi = 1;
    if (npv(lo) < 0 || npv(hi) > 0) return NaN;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (npv(mid) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ------------------------------------------------------------------ */
  /* État partagé : le simulateur d'en-tête et le pricer décrivent le même produit */
  /* ------------------------------------------------------------------ */

  const DEFAULTS = { years: 8, call: 100, stepDown: 0, coupon: 70, protection: 60, memory: true, vol: 20, q: 3, r: 2, spread: 0.8, margin: 1.5 };
  const state = { ...DEFAULTS };
  let pricing = null;
  let sensitivity = null;
  const productListeners = [];
  const onProductChange = (fn) => productListeners.push(fn);

  function reprice() {
    pricing = priceAutocall(state);
    productListeners.forEach((fn) => fn());
  }

  const fairText = () => (pricing && isFinite(pricing.fair) ? fmtPts(pricing.fair, 2) : '–');

  /* ------------------------------------------------------------------ */
  /* Simulateur d'en-tête                                                */
  /* ------------------------------------------------------------------ */

  function setupHeroSimulator() {
    const box = $('#sim-chart');
    const out = $('#sim-result');
    const title = $('#sim-titre');
    const legend = $('#sim-legend');
    const hyp = $('#sim-hyp');
    if (!box) return;

    // Première trajectoire : coupon manqué en année 2, rattrapé en année 3, rappel en année 4
    let seed = 421;
    let scenario = null;

    const compute = () => {
      const coupon = pricing && isFinite(pricing.fair) ? Math.max(0, pricing.fair) : 0;
      const path = simulatePath(seed, state);
      const res = evaluatePath(path, state, coupon);
      res.irr = irr(res.flows);
      scenario = { path, res, coupon };
    };

    const describe = () => {
      const { res, coupon } = scenario;
      const tx = t();
      const lvl = fmtPts(res.final);
      const cpn = res.total > 0 ? fmtPts(res.total, 1) : '';
      const irrTxt = fmtPct(res.irr, 1);
      if (res.called) {
        const caught = res.obs.reduce((n, o) => n + Math.max(0, o.units - 1), 0);
        return tx.called(res.end, lvl, cpn || fmtPts(0), caught > 0 && coupon > 0 ? tx.memo(caught) : '', irrTxt);
      }
      if (!res.loss) return tx.matured(lvl, cpn, irrTxt);
      return tx.lost(lvl, fmtPts(state.protection), fmtPts(res.redemption), cpn, irrTxt);
    };

    function draw(animate) {
      const W = Math.max(260, box.clientWidth);
      const H = box.clientHeight || 300;
      const wide = W >= 480;
      const m = { top: 14, right: wide ? 116 : 10, bottom: 28, left: 44 };
      const pw = W - m.left - m.right, ph = H - m.top - m.bottom;
      const { path, res } = scenario;
      const T = state.years;
      const visible = path.slice(0, res.end * 12 + 1);
      const levels = [state.call, state.coupon, state.protection, callLevel(state, T - 1)];
      const minV = Math.min(...visible, ...levels), maxV = Math.max(...visible, ...levels);
      const lo = Math.max(0, Math.min(40, Math.floor((minV - 6) / 20) * 20));
      const hi = Math.max(140, Math.ceil((maxV + 6) / 20) * 20);
      const step = hi - lo > 200 ? 40 : 20;
      const x = (yr) => m.left + (yr / T) * pw;
      const y = (v) => m.top + (1 - (v - lo) / (hi - lo)) * ph;
      const svg = newSvg(box, W, H);
      const tx = t();

      for (let v = lo; v <= hi + 0.001; v += step) {
        svgEl('line', { x1: m.left, x2: m.left + pw, y1: y(v), y2: y(v), class: 'c-grid' }, svg);
        svgText(svg, m.left - 8, y(v) + 4, fmtPts(v), 'c-tick', 'end');
      }
      svgEl('line', { x1: m.left, x2: m.left + pw, y1: m.top + ph, y2: m.top + ph, class: 'c-axis' }, svg);
      for (let k = 0; k <= T; k++) {
        svgEl('line', { x1: x(k), x2: x(k), y1: m.top + ph, y2: m.top + ph + 5, class: 'c-axis' }, svg);
        svgText(svg, x(k), H - 6, k === T ? tx.axisYears(k) : String(k), 'c-tick', 'middle');
      }

      // Barrière de rappel en escalier si elle est dégressive
      let d = `M${x(0)} ${y(callLevel(state, 1))}`;
      for (let k = 1; k < T; k++) d += `H${x(k)}V${y(callLevel(state, Math.min(k + 1, T - 1)))}`;
      d += `H${x(T)}`;
      svgEl('path', { d, class: 'c-call' }, svg);
      svgEl('line', { x1: m.left, x2: m.left + pw, y1: y(state.coupon), y2: y(state.coupon), class: 'c-coupon' }, svg);
      svgEl('line', { x1: m.left, x2: m.left + pw, y1: y(state.protection), y2: y(state.protection), class: 'c-prot' }, svg);

      let pd = '';
      const cum = [0];
      visible.forEach((v, i) => {
        const px = x(i / 12), py = y(v);
        pd += `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
        if (i > 0) {
          const qx = x((i - 1) / 12), qy = y(visible[i - 1]);
          cum.push(cum[i - 1] + Math.hypot(px - qx, py - qy));
        }
      });
      const pathEl = svgEl('path', { d: pd, class: 'c-path' }, svg);
      const total = cum[cum.length - 1] || 1;

      const marks = [];
      res.obs.forEach((o) => {
        const c = svgEl('circle', { cx: x(o.k), cy: y(o.level), r: 4.5, class: `c-obs ${o.units > 0 ? 'c-obs-paid' : 'c-obs-missed'} c-fade` }, svg);
        marks.push({ node: c, at: cum[o.k * 12] / total });
      });

      const ex = x(res.end), ey = y(res.final);
      const ring = svgEl('circle', { cx: ex, cy: ey, r: 9, class: 'c-end c-fade' }, svg);
      const recent = visible.slice(Math.max(0, visible.length - 7), visible.length - 1);
      const avg = recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length);
      let below = avg > res.final;
      if (below && ey + 26 > m.top + ph - 4) below = false;
      if (!below && ey - 16 < m.top + 8) below = true;
      const anchor = ex > m.left + pw - 40 ? 'end' : 'middle';
      const word = res.called ? tx.end.called : (res.loss ? tx.end.loss : tx.end.mat);
      const lab = svgText(svg, anchor === 'end' ? ex + 6 : ex, below ? ey + 26 : ey - 16, word, 'c-label c-end-label c-fade', anchor);
      marks.push({ node: ring, at: 1 }, { node: lab, at: 1 });

      const labels = [
        [`${tx.barrier.call} ${fmtPts(callLevel(state, T - 1))}`, callLevel(state, T - 1), 'c-label-call', 'c-call'],
        [`${tx.barrier.coupon} ${fmtPts(state.coupon)}`, state.coupon, 'c-label-coupon', 'c-coupon'],
        [`${tx.barrier.prot} ${fmtPts(state.protection)}`, state.protection, 'c-label-prot', 'c-prot']
      ];
      if (wide) {
        // Écarte les libellés trop proches les uns des autres
        const placed = labels.map(([txt, v, cls]) => ({ txt, yv: y(v) + 4, cls })).sort((a, b) => a.yv - b.yv);
        for (let i = 1; i < placed.length; i++) if (placed[i].yv - placed[i - 1].yv < 14) placed[i].yv = placed[i - 1].yv + 14;
        placed.forEach((p) => svgText(svg, m.left + pw + 14, p.yv, p.txt, `c-label ${p.cls}`));
      }
      legend.hidden = wide;
      legend.innerHTML = labels.map(([txt, , , line]) =>
        `<li><svg width="22" height="8" aria-hidden="true"><line x1="0" x2="22" y1="4" y2="4" class="${line}"/></svg>${txt}</li>`).join('');

      if (animate && !reduceMotion) {
        const duration = 500 + 1300 * (res.end / T);
        pathEl.style.strokeDasharray = `${total} ${total}`;
        pathEl.style.strokeDashoffset = total;
        pathEl.getBoundingClientRect();
        pathEl.style.transition = `stroke-dashoffset ${duration}ms linear`;
        pathEl.style.strokeDashoffset = '0';
        marks.forEach((mk) => setTimeout(() => mk.node.classList.add('is-in'), duration * mk.at));
      } else {
        marks.forEach((mk) => mk.node.classList.add('is-in'));
      }
    }

    function render(animate) {
      if (!pricing) return;
      compute();
      const tx = t();
      title.textContent = tx.simTitle(state.memory, state.years);
      out.innerHTML = describe();
      box.setAttribute('aria-label', tx.simAria(scenario.res.end));
      hyp.innerHTML = tx.hyp(state, fairText()).map((li) => `<li>${li}</li>`).join('');
      const set = (k, v) => { const n = $(`.sim [data-stat="${k}"]`); if (n) n.textContent = v; };
      set('call', fmtPct(pricing.pCall, 0));
      set('loss', fmtPct(pricing.pLoss, 0));
      set('life', tx.years(fmtNum(pricing.life, 1)));
      draw(animate);
    }

    $('#sim-run').addEventListener('click', () => {
      seed = (Math.random() * 4294967296) >>> 0;
      render(true);
    });
    watchWidth(box, () => scenario && draw(false));

    let first = true;
    onProductChange(() => { render(first); first = false; });
    onLangChange(() => scenario && render(false));
  }

  /* ------------------------------------------------------------------ */
  /* Pricer                                                              */
  /* ------------------------------------------------------------------ */

  function setupPricer() {
    const form = $('#pricer-form');
    if (!form) return;
    const inputs = $$('input', form);
    const outputs = Object.fromEntries(inputs.map((i) => [i.name, $(`#o-${i.name}`)]));
    const distBox = $('#pr-dist');
    const sensBox = $('#pr-sens');

    const formatControl = (name, v) => {
      switch (name) {
        case 'years': return t().years(v);
        case 'stepDown': return fmtPts(v, 1);
        case 'q': case 'r': case 'spread': case 'margin': return fmtPts(v, 2);
        default: return fmtPts(v);
      }
    };

    const syncControls = () => {
      inputs.forEach((i) => {
        if (i.type === 'checkbox') return;
        const pctFill = ((i.value - i.min) / (i.max - i.min)) * 100;
        i.style.setProperty('--fill', `${pctFill}%`);
        if (outputs[i.name]) outputs[i.name].textContent = formatControl(i.name, Number(i.value));
      });
    };

    const readForm = () => {
      inputs.forEach((i) => { state[i.name] = i.type === 'checkbox' ? i.checked : Number(i.value); });
    };

    let frame = 0;
    form.addEventListener('input', () => {
      readForm();
      syncControls();
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; reprice(); });
    });
    let sensTimer;
    const scheduleSensitivity = () => { clearTimeout(sensTimer); sensTimer = setTimeout(computeSensitivity, 120); };
    form.addEventListener('change', scheduleSensitivity);

    $('#p-reset').addEventListener('click', () => {
      inputs.forEach((i) => {
        if (i.type === 'checkbox') i.checked = DEFAULTS[i.name];
        else i.value = DEFAULTS[i.name];
      });
      readForm();
      syncControls();
      reprice();
      scheduleSensitivity();
    });

    function computeSensitivity() {
      const vols = [10, 15, 20, 25, 30, 35, 40];
      sensitivity = { key: JSON.stringify(state), points: vols.map((v) => [v, priceAutocall(state, v).fair]) };
      drawSensitivity();
    }

    function renderSplit() {
      const box = $('#pr-split');
      const tx = t().split;
      if (!pricing || !isFinite(pricing.fair)) { box.innerHTML = ''; return; }
      const red = pricing.A;
      const cpn = pricing.fair * pricing.B;
      const mg = state.margin;
      const parts = [['red', red, tx.red], ['cpn', cpn, tx.cpn], ['margin', mg, tx.margin]];
      box.innerHTML =
        `<p class="split-title">${tx.title}</p>` +
        `<div class="split-bar" aria-hidden="true">${parts.map(([k, v]) => `<span class="s-${k}" style="width:${Math.max(0, v)}%"></span>`).join('')}</div>` +
        `<ul class="split-legend">${parts.map(([k, v, label]) => `<li><i class="sw s-${k}"></i>${label} <b>${fmtNum(v, 1)}</b></li>`).join('')}</ul>`;
    }

    function drawDistribution() {
      if (!pricing) return;
      const tx = t();
      const T = state.years;
      const cats = [];
      for (let k = 1; k < T; k++) cats.push({ label: String(k), v: pricing.dist[k], cls: 'b-call' });
      cats.push({ label: tx.distMat, v: pricing.dist[T], cls: 'b-mat' });
      cats.push({ label: tx.distLoss, v: pricing.dist[T + 1], cls: 'b-loss' });

      const W = Math.max(240, distBox.clientWidth), H = distBox.clientHeight || 190;
      const m = { top: 18, right: 4, bottom: 24, left: 4 };
      const pw = W - m.left - m.right, ph = H - m.top - m.bottom;
      const max = Math.max(0.05, ...cats.map((c) => c.v));
      const bw = pw / cats.length;
      const svg = newSvg(distBox, W, H);
      svgEl('line', { x1: m.left, x2: m.left + pw, y1: m.top + ph, y2: m.top + ph, class: 'c-axis' }, svg);
      cats.forEach((c, i) => {
        const h = (c.v / max) * ph;
        const bx = m.left + i * bw + bw * 0.16;
        svgEl('rect', { x: bx, y: m.top + ph - h, width: bw * 0.68, height: Math.max(0, h), class: c.cls }, svg);
        if (c.v >= 0.005) svgText(svg, bx + bw * 0.34, m.top + ph - h - 5, fmtPts(c.v * 100, 0), 'c-tick c-bar-val', 'middle');
        svgText(svg, bx + bw * 0.34, H - 6, c.label, 'c-tick', 'middle');
      });
      distBox.setAttribute('aria-label', `${tx.distAria} : ` + cats.map((c) => `${c.label} ${fmtPct(c.v, 0)}`).join(', '));
    }

    function drawSensitivity() {
      if (!sensitivity) return;
      const tx = t();
      const pts = sensitivity.points.filter((p) => isFinite(p[1]));
      if (pts.length < 2) { sensBox.innerHTML = ''; return; }
      const W = Math.max(240, sensBox.clientWidth), H = sensBox.clientHeight || 190;
      const m = { top: 14, right: 12, bottom: 26, left: 40 };
      const pw = W - m.left - m.right, ph = H - m.top - m.bottom;
      const ys = pts.map((p) => p[1]);
      const st = niceStep(Math.max(1, Math.max(...ys) - Math.min(...ys)), 3);
      const lo = Math.floor(Math.min(...ys) / st) * st, hi = Math.ceil(Math.max(...ys) / st) * st;
      const x = (v) => m.left + ((v - 10) / 30) * pw;
      const y = (v) => m.top + (1 - (v - lo) / (hi - lo || 1)) * ph;
      const svg = newSvg(sensBox, W, H);
      const dec = st % 1 ? 1 : 0;
      for (let v = lo; v <= hi + 1e-9; v += st) {
        svgEl('line', { x1: m.left, x2: m.left + pw, y1: y(v), y2: y(v), class: 'c-grid' }, svg);
        svgText(svg, m.left - 8, y(v) + 4, fmtPts(v, dec), 'c-tick', 'end');
      }
      [10, 20, 30, 40].forEach((v) => svgText(svg, x(v), H - 6, fmtPts(v), 'c-tick', v === 10 ? 'start' : (v === 40 ? 'end' : 'middle')));
      svgEl('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(''), class: 'c-pf' }, svg);
      pts.forEach((p) => svgEl('circle', { cx: x(p[0]), cy: y(p[1]), r: 2.5, class: 'c-dot' }, svg));
      if (pricing && isFinite(pricing.fair) && state.vol >= 10 && state.vol <= 40) {
        const cx = x(state.vol), cy = y(pricing.fair);
        svgEl('circle', { cx, cy, r: 6, class: 'c-current' }, svg);
        svgText(svg, cx + (state.vol > 32 ? -10 : 10), cy - 10, fmtPts(pricing.fair, 2), 'c-label c-label-prot', state.vol > 32 ? 'end' : 'start');
      }
      sensBox.setAttribute('aria-label', `${tx.sensAria} : ` + pts.map((p) => `${fmtPts(p[0])} → ${fmtPts(p[1], 2)}`).join(', '));
    }

    function renderTermsheet() {
      const today = fmtDate(new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())));
      $('#ts-body').innerHTML = t().ts(state, fairText(), today)
        .map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('');
    }

    function renderResults() {
      if (!pricing) return;
      $('[data-out="fair"]').textContent = fairText();
      $('[data-out="fair-mini"]').textContent = fairText();
      $('[data-out="call"]').textContent = fmtPct(pricing.pCall, 0);
      $('[data-out="loss"]').textContent = fmtPct(pricing.pLoss, 0);
      $('[data-out="lgl"]').textContent = pricing.pLoss > 0 ? fmtPts(pricing.lossGivenLoss, 0) : '–';
      $('[data-out="life"]').textContent = t().years(fmtNum(pricing.life, 1));
      renderSplit();
      drawDistribution();
      if (sensitivity && sensitivity.key !== JSON.stringify(state)) scheduleSensitivity();
      drawSensitivity();
      renderTermsheet();
    }

    $('#ts-print').addEventListener('click', () => {
      const area = document.createElement('div');
      area.id = 'print-area';
      area.innerHTML = `<p class="print-name">Tom Hennequin</p><h1>${t().printTitle}</h1>${$('.ts-table').outerHTML}<p>${$('.ts-foot').innerHTML}</p>`;
      document.body.appendChild(area);
      document.documentElement.classList.add('printing-terms');
      const cleanup = () => {
        document.documentElement.classList.remove('printing-terms');
        area.remove();
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      window.print();
      setTimeout(cleanup, 1000);
    });

    syncControls();
    onProductChange(renderResults);
    onLangChange(() => { syncControls(); renderResults(); });
    watchWidth(distBox, drawDistribution);
    watchWidth(sensBox, drawSensitivity);

    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    idle(computeSensitivity);
  }

  /* ------------------------------------------------------------------ */
  /* Fiches des portefeuilles                                            */
  /* ------------------------------------------------------------------ */

  const parseDate = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d || 1)); };
  const monthKey = (d) => d.getUTCFullYear() * 12 + d.getUTCMonth();
  const monthEnd = (y, m) => new Date(Date.UTC(y, m + 1, 0));
  const chain = (rets) => rets.reduce((idx, r) => { idx.push(idx[idx.length - 1] * (1 + r)); return idx; }, [100]);

  function fakeSeries(f, end) {
    const rand = mulberry32(f.graine || 1);
    const start = parseDate(f.debut);
    const n = monthKey(end) - monthKey(start);
    const dates = [start], rets = [], bm = [];
    const mu = f.rendement / 1200, sd = f.volatilite / 100 / Math.sqrt(12);
    const muB = f.rendementIndice / 1200, sdB = f.volatiliteIndice / 100 / Math.sqrt(12);
    const rho = f.correlation;
    for (let i = 1; i <= n; i++) {
      const z1 = gauss(rand), z2 = gauss(rand);
      rets.push(mu + sd * z1);
      bm.push(muB + sdB * (rho * z1 + Math.sqrt(1 - rho * rho) * z2));
      const mo = start.getUTCMonth() + i;
      dates.push(monthEnd(start.getUTCFullYear() + Math.floor(mo / 12), mo % 12));
    }
    return { dates, idx: chain(rets), rets, bmIdx: chain(bm), bmRets: bm, fake: true };
  }

  function buildSeries(acct, end) {
    let dates, rets;
    if (acct.rendements && acct.rendements.length) {
      const first = parseDate(acct.rendements[0][0]);
      dates = [monthEnd(first.getUTCFullYear(), first.getUTCMonth() - 1)];
      rets = [];
      acct.rendements.forEach(([d, r]) => { dates.push(parseDate(d)); rets.push(Number(r) / 100); });
    } else if (acct.releves && acct.releves.length >= 2) {
      dates = acct.releves.map(([d]) => parseDate(d));
      rets = acct.releves.slice(1).map(([, v1, flow], i) => {
        const v0 = Number(acct.releves[i][1]);
        const f = Number(flow || 0);
        const base = v0 + f / 2;
        return base > 0 ? (Number(v1) - v0 - f) / base : 0;
      });
    } else if (acct.fictif) {
      return fakeSeries(acct.fictif, end);
    } else {
      return null;
    }

    let bmIdx = null;
    if (acct.indice && acct.indice.length) {
      const levels = Object.fromEntries(acct.indice.map(([d, v]) => [monthKey(parseDate(d)), Number(v)]));
      const raw = dates.map((d) => levels[monthKey(d)]);
      if (raw.every((v) => isFinite(v) && v > 0)) bmIdx = raw.map((v) => (v / raw[0]) * 100);
    }
    const bmRets = bmIdx ? bmIdx.slice(1).map((v, i) => v / bmIdx[i] - 1) : null;
    return { dates, idx: chain(rets), rets, bmIdx, bmRets, fake: false };
  }

  function metrics(idx, rets, rf) {
    if (!idx || !rets || !rets.length) return null;
    const n = rets.length;
    const cum = idx[n] / idx[0] - 1;
    const ann = n >= 12 ? Math.pow(idx[n] / idx[0], 12 / n) - 1 : NaN;
    const r12 = n >= 12 ? idx[n] / idx[n - 12] - 1 : NaN;
    let vol = NaN;
    if (n >= 6) {
      const mean = rets.reduce((a, b) => a + b, 0) / n;
      vol = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) * Math.sqrt(12);
    }
    let peak = idx[0], mdd = 0;
    idx.forEach((v) => { peak = Math.max(peak, v); mdd = Math.min(mdd, v / peak - 1); });
    return { cum, ann, r12, vol, mdd, sharpe: isFinite(ann) && vol > 0 ? (ann - rf) / vol : NaN };
  }

  // Seuils de volatilité de l'échelle de risque PRIIPs (classes 1 à 7)
  function riskClass(vol) {
    if (!isFinite(vol)) return null;
    const v = vol * 100;
    return v < 0.5 ? 1 : v < 5 ? 2 : v < 12 ? 3 : v < 20 ? 4 : v < 30 ? 5 : v < 80 ? 6 : 7;
  }

  const drawdowns = (idx) => { let peak = idx[0]; return idx.map((v) => { peak = Math.max(peak, v); return v / peak - 1; }); };

  function lineChart(box, s, kind, fake) {
    const tx = t().fs;
    const W = Math.max(260, box.clientWidth), H = box.clientHeight || 210;
    const m = { top: 12, right: 10, bottom: 26, left: 44 };
    const pw = W - m.left - m.right, ph = H - m.top - m.bottom;
    const n = s.idx.length - 1;
    const series = kind === 'dd'
      ? [drawdowns(s.idx).map((v) => v * 100), s.bmIdx ? drawdowns(s.bmIdx).map((v) => v * 100) : null]
      : [s.idx, s.bmIdx];
    const all = series[0].concat(series[1] || []);
    let lo, hi, st;
    if (kind === 'dd') {
      st = niceStep(Math.max(2, -Math.min(...all)), 3);
      lo = Math.floor(Math.min(...all) / st) * st;
      hi = 0;
    } else {
      st = niceStep(Math.max(4, Math.max(...all) - Math.min(...all)));
      lo = Math.floor((Math.min(...all) - st * 0.2) / st) * st;
      hi = Math.ceil((Math.max(...all) + st * 0.2) / st) * st;
    }
    const x = (i) => m.left + (i / n) * pw;
    const y = (v) => m.top + (1 - (v - lo) / (hi - lo || 1)) * ph;
    const svg = newSvg(box, W, H);
    const dec = st % 1 ? 1 : 0;
    for (let v = lo; v <= hi + 1e-9; v += st) {
      const ref = kind === 'dd' ? Math.abs(v) < 1e-9 : Math.abs(v - 100) < 1e-9;
      svgEl('line', { x1: m.left, x2: m.left + pw, y1: y(v), y2: y(v), class: ref ? 'c-axis' : 'c-grid' }, svg);
      svgText(svg, m.left - 8, y(v) + 4, kind === 'dd' ? fmtPts(v, dec) : fmtNum(v, dec), 'c-tick', 'end');
    }
    const ticks = (pw < 380 ? [0, Math.round(n / 2), n] : [0, Math.round(n / 3), Math.round((2 * n) / 3), n])
      .filter((v, i, a) => a.indexOf(v) === i);
    ticks.forEach((i, j) => svgText(svg, x(i), H - 6, fmtMonth(s.dates[i]), 'c-tick', j === 0 ? 'start' : (j === ticks.length - 1 ? 'end' : 'middle')));

    const toPath = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join('');
    if (kind === 'dd') {
      svgEl('path', { d: `${toPath(series[0])}L${x(n)} ${y(0)}L${x(0)} ${y(0)}Z`, class: 'c-dd-area' }, svg);
      if (series[1]) svgEl('path', { d: toPath(series[1]), class: 'c-bm' }, svg);
      svgEl('path', { d: toPath(series[0]), class: 'c-dd' }, svg);
    } else {
      if (series[1]) svgEl('path', { d: toPath(series[1]), class: 'c-bm' }, svg);
      svgEl('path', { d: toPath(series[0]), class: 'c-pf' }, svg);
    }

    // Survol
    const guide = svgEl('line', { y1: m.top, y2: m.top + ph, class: 'c-hover-line', visibility: 'hidden' }, svg);
    const dotA = svgEl('circle', { r: 3.5, class: kind === 'dd' ? 'c-hover-dot-dd' : 'c-hover-dot-pf', visibility: 'hidden' }, svg);
    const dotB = svgEl('circle', { r: 3, class: 'c-hover-dot-bm', visibility: 'hidden' }, svg);
    const tip = document.createElement('div');
    tip.className = 'fs-tip';
    tip.hidden = true;
    box.appendChild(tip);
    const hide = () => { [guide, dotA, dotB].forEach((e) => e.setAttribute('visibility', 'hidden')); tip.hidden = true; };
    const show = (clientX) => {
      const r = svg.getBoundingClientRect();
      const i = Math.round((((clientX - r.left) * (W / r.width) - m.left) / pw) * n);
      if (i < 0 || i > n) { hide(); return; }
      const gx = x(i);
      guide.setAttribute('x1', gx); guide.setAttribute('x2', gx); guide.setAttribute('visibility', 'visible');
      dotA.setAttribute('cx', gx); dotA.setAttribute('cy', y(series[0][i])); dotA.setAttribute('visibility', 'visible');
      if (series[1]) { dotB.setAttribute('cx', gx); dotB.setAttribute('cy', y(series[1][i])); dotB.setAttribute('visibility', 'visible'); }
      const f = (v) => (kind === 'dd' ? fmtPts(v, 1) : fmtNum(v, 1));
      tip.innerHTML = `<strong>${fmtMonth(s.dates[i])}</strong><br>${tx.pf} ${f(series[0][i])}${series[1] ? `<br>${tx.bmShort} ${f(series[1][i])}` : ''}`;
      tip.hidden = false;
      const left = gx * (r.width / W), half = tip.offsetWidth / 2;
      tip.style.left = `${Math.min(Math.max(left, half), r.width - half)}px`;
      tip.style.top = `${-tip.offsetHeight - 6}px`;
    };
    svg.addEventListener('pointermove', (e) => show(e.clientX));
    svg.addEventListener('pointerdown', (e) => show(e.clientX));
    svg.addEventListener('pointerleave', hide);
  }

  function heatTable(s) {
    const tx = t().fs;
    const byYear = new Map();
    s.rets.forEach((r, i) => {
      const d = s.dates[i + 1];
      const yr = d.getUTCFullYear();
      if (!byYear.has(yr)) byYear.set(yr, new Array(12).fill(null));
      byYear.get(yr)[d.getUTCMonth()] = r;
    });
    const cell = (r) => {
      if (r == null) return '<td class="h-empty"></td>';
      const a = Math.min(Math.abs(r) / 0.06, 1);
      const bg = r >= 0 ? `rgba(29,107,74,${(0.08 + 0.62 * a).toFixed(3)})` : `rgba(142,31,50,${(0.08 + 0.62 * a).toFixed(3)})`;
      const strong = 0.08 + 0.62 * a > 0.45 ? ' h-strong' : '';
      return `<td class="h-cell${strong}" style="background:${bg}">${fmtNum(r * 100, 1)}</td>`;
    };
    const head = `<tr><th scope="col">${tx.year}</th>${HEAT_MONTHS[lang].map((mo) => `<th scope="col">${mo}</th>`).join('')}<th scope="col" class="h-total">${tx.total}</th></tr>`;
    const rows = Array.from(byYear.entries()).map(([yr, months]) => {
      const total = months.reduce((acc, r) => (r == null ? acc : acc * (1 + r)), 1) - 1;
      return `<tr><th scope="row">${yr}</th>${months.map(cell).join('')}${cell(total).replace('h-cell', 'h-cell h-total')}</tr>`;
    }).join('');
    return `<div class="heat-wrap"><table class="heat"><caption class="visually-hidden">${tx.heatCaption}</caption><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
  }

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function setupFactsheets() {
    const host = $('#factsheets');
    if (!host) return;
    const data = window.PORTEFEUILLES;
    if (!data || !data.comptes) { host.innerHTML = `<p>${t().noData}</p>`; return; }

    const end = data.dateDonnees ? parseDate(data.dateDonnees) : new Date();
    const rf = (Number(data.tauxSansRisque) || 0) / 100;
    const accounts = data.comptes
      .map((acct) => ({ acct, s: buildSeries(acct, end) }))
      .filter((a) => a.s && a.s.idx.length > 1);
    let view = 'perf';
    const fakeAny = accounts.some((a) => a.s.fake) || !!data.donneesFictives;
    $('#demo-note').hidden = !fakeAny;

    function card({ acct, s }) {
      const tx = t().fs;
      const fake = s.fake || !!data.donneesFictives;
      const mP = metrics(s.idx, s.rets, rf);
      const mB = s.bmIdx ? metrics(s.bmIdx, s.bmRets, rf) : null;
      const rc = mP ? riskClass(mP.vol) : null;
      const id = `fs-${acct.id}`;
      const first = s.dates[0], last = s.dates[s.dates.length - 1];
      const row = (key, kind) => {
        const f = (mm) => {
          if (!mm) return '–';
          if (kind === 'ratio') return isFinite(mm[key]) ? fmtNum(mm[key], 2) : '–';
          return fmtPct(mm[key], 1, kind === 'signed');
        };
        return `<tr><th scope="row">${tx.rows[key]}</th><td class="pf">${f(mP)}</td><td class="bm">${f(mB)}</td></tr>`;
      };
      const alloc = (acct.allocation || []).map(([label, w]) => [L(label), Number(w)]).sort((a, b) => b[1] - a[1]);
      const tabs = ['perf', 'dd', 'month'];
      const el = document.createElement('article');
      el.className = 'fs';
      el.setAttribute('aria-labelledby', `${id}-t`);
      el.innerHTML = `
        <div class="fs-head">
          <div><h3 class="fs-title" id="${id}-t">${esc(L(acct.titre))}</h3><p class="fs-subtitle">${esc(L(acct.sousTitre) || '')}</p></div>
          <p class="fs-role">${esc(L(acct.role) || '')}</p>
        </div>
        <dl class="fs-meta">
          <dt>${tx.objective}</dt><dd>${esc(L(acct.objectif) || '–')}</dd>
          <dt>${tx.horizon}</dt><dd>${esc(L(acct.horizon) || '–')}</dd>
          <dt>${tx.benchmark}</dt><dd>${esc(L(acct.indiceNom) || '–')}</dd>
          <dt>${tx.history}</dt><dd>${tx.since(fmtMonth(first))}</dd>
        </dl>
        <div class="fs-block">
          <div class="fs-tabs" role="tablist" aria-label="${tx.tabsLabel}">
            ${tabs.map((k) => `<button type="button" role="tab" id="${id}-tab-${k}" aria-controls="${id}-panel" aria-selected="${k === view}" tabindex="${k === view ? 0 : -1}" data-view="${k}">${tx.tabs[k]}</button>`).join('')}
          </div>
          <div class="fs-panel" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-tab-${view}"></div>
        </div>
        <div class="fs-block">
          <h4>${tx.figures(fmtDate(last))}</h4>
          <table class="fs-table">
            <thead><tr><th scope="col"><span class="visually-hidden">${tx.indicator}</span></th><th scope="col">${tx.pf}</th><th scope="col">${tx.bmShort}</th></tr></thead>
            <tbody>${row('cum', 'signed')}${row('ann', 'signed')}${row('r12', 'signed')}${row('vol')}${row('mdd')}${row('sharpe', 'ratio')}</tbody>
          </table>
        </div>
        <div class="fs-split">
          <div class="fs-block">
            <h4>${tx.risk}</h4>
            <ol class="risk-scale" aria-label="${rc ? tx.riskAria(rc) : ''}">${[1, 2, 3, 4, 5, 6, 7].map((i) => `<li${i === rc ? ' class="is-on"' : ''}>${i}</li>`).join('')}</ol>
            <div class="risk-legend"><span>${tx.lower}</span><span>${tx.higher}</span></div>
          </div>
          <div class="fs-block">
            <h4>${tx.alloc}</h4>
            <ul class="alloc">${alloc.map(([label, w]) => `<li><span>${esc(label)}</span><span class="w">${fmtPts(w)}</span><span class="bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, w))}%"></span></span></li>`).join('')}</ul>
          </div>
        </div>
        <div class="fs-block">
          <h4>${tx.method}</h4>
          <ul class="ticks">${(L(acct.methode) || []).map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
        </div>`;

      const panel = $('.fs-panel', el);
      const renderPanel = () => {
        panel.setAttribute('aria-labelledby', `${id}-tab-${view}`);
        if (view === 'month') { panel.innerHTML = heatTable(s); return; }
        const legend = `<ul class="fs-legend"><li><svg width="22" height="8" aria-hidden="true"><line x1="0" x2="22" y1="4" y2="4" class="${view === 'dd' ? 'c-dd' : 'c-pf'}"/></svg>${tx.pf}</li>${s.bmIdx ? `<li><svg width="22" height="8" aria-hidden="true"><line x1="0" x2="22" y1="4" y2="4" class="c-bm"/></svg>${tx.bm}</li>` : ''}${fake ? `<li class="fs-fake">${tx.fake}</li>` : ''}</ul>`;
        panel.innerHTML = `${legend}<div class="fs-chart" role="img"></div>`;
        const box = $('.fs-chart', panel);
        const label = view === 'dd'
          ? tx.ddAria(fmtPct(mP.mdd, 1), mB ? fmtPct(mB.mdd, 1) : '')
          : tx.perfAria(fmtMonth(first), fmtMonth(last), fmtNum(s.idx[s.idx.length - 1], 1), s.bmIdx ? fmtNum(s.bmIdx[s.bmIdx.length - 1], 1) : '', fake);
        box.setAttribute('aria-label', label);
        lineChart(box, s, view, fake);
      };
      el.renderPanel = renderPanel;
      return el;
    }

    let cards = [];
    function renderAll() {
      host.innerHTML = '';
      cards = accounts.map((a) => { const el = card(a); host.appendChild(el); return el; });
      cards.forEach((c) => c.renderPanel());
      const tx = t();
      $('#method-1').textContent = tx.method1(fmtPct(rf, (rf * 100) % 1 ? 2 : 0));
      $('#method-2').textContent = tx.method2(fmtDate(end));
    }

    // Les deux fiches affichent toujours la même vue, pour pouvoir les comparer
    function selectView(next, focusCard) {
      view = next;
      cards.forEach((c) => {
        $$('[role="tab"]', c).forEach((b) => {
          const on = b.dataset.view === view;
          b.setAttribute('aria-selected', String(on));
          b.tabIndex = on ? 0 : -1;
        });
        c.renderPanel();
      });
      if (focusCard) $(`[data-view="${view}"]`, focusCard).focus();
    }

    host.addEventListener('click', (e) => {
      const b = e.target.closest('.fs-tabs [role="tab"]');
      if (b) selectView(b.dataset.view);
    });
    host.addEventListener('keydown', (e) => {
      const b = e.target.closest('.fs-tabs [role="tab"]');
      if (!b) return;
      const order = ['perf', 'dd', 'month'];
      let i = order.indexOf(b.dataset.view);
      if (e.key === 'ArrowRight') i = (i + 1) % 3;
      else if (e.key === 'ArrowLeft') i = (i + 2) % 3;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = 2;
      else return;
      e.preventDefault();
      selectView(order[i], b.closest('.fs'));
    });

    // Rendu après le premier affichage (les fiches sont sous la ligne de flottaison),
    // assez tôt pour ne pas décaler la page pendant une navigation par le menu
    let rendered = false;
    const firstRender = () => {
      if (rendered) return;
      rendered = true;
      renderAll();
      watchWidth(host, () => cards.forEach((c) => c.renderPanel()));
    };
    onLangChange(() => { if (rendered) renderAll(); });
    window.addEventListener('beforeprint', firstRender);
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
    idle(firstRender, { timeout: 1200 });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); firstRender(); }
      }, { rootMargin: '900px 0px' });
      io.observe(host);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Quinterminal : visionneuse et plein écran                           */
  /* ------------------------------------------------------------------ */

  function setupViewer() {
    const tabs = $$('.viewer-tabs [role="tab"]');
    const img = $('#qt-image');
    const zoom = $('#qt-zoom');
    const fallback = $('#qt-fallback');
    const panel = $('#qt-viewer');
    const dialog = $('#lightbox');
    if (!tabs.length || !img) return;
    let current = 0;

    const altFor = (tab) => (lang === 'en' && EN[tab.dataset.altKey]) || tab.dataset.alt || '';
    const showFallback = () => {
      zoom.hidden = true;
      fallback.hidden = false;
      $('#qt-missing').textContent = img.getAttribute('src');
    };
    img.addEventListener('error', showFallback);
    img.addEventListener('load', () => { zoom.hidden = false; fallback.hidden = true; });
    if (img.complete && img.naturalWidth === 0) showFallback();

    function select(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((tab, j) => {
        tab.setAttribute('aria-selected', String(j === current));
        tab.tabIndex = j === current ? 0 : -1;
      });
      const tab = tabs[current];
      panel.setAttribute('aria-labelledby', tab.id);
      img.alt = altFor(tab);
      if (img.getAttribute('src') !== tab.dataset.src) img.src = tab.dataset.src;
      if (focus) tab.focus();
      if (dialog && dialog.open) fillDialog();
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (e.key in map) { e.preventDefault(); select(map[e.key], true); }
      });
    });
    onLangChange(() => { img.alt = altFor(tabs[current]); });

    function fillDialog() {
      const lbImg = $('#lb-image');
      lbImg.src = tabs[current].dataset.src;
      lbImg.alt = altFor(tabs[current]);
      $('#lb-caption').textContent = `Quinterminal, ${tabs[current].textContent}`;
    }
    if (dialog && typeof dialog.showModal === 'function') {
      zoom.addEventListener('click', () => { if (img.naturalWidth > 0) { fillDialog(); dialog.showModal(); } });
      $('#lb-close').addEventListener('click', () => dialog.close());
      $('#lb-prev').addEventListener('click', () => select(current - 1));
      $('#lb-next').addEventListener('click', () => select(current + 1));
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
      dialog.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') select(current + 1);
        if (e.key === 'ArrowLeft') select(current - 1);
      });
    } else {
      zoom.addEventListener('click', () => { if (img.naturalWidth > 0) window.open(img.src, '_blank', 'noopener'); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Contact                                                             */
  /* ------------------------------------------------------------------ */

  const EMAIL = 'tomhennequin27@gmail.com';
  // CV anglais : renseigner le chemin quand le fichier existe (ex. 'pdf/CV_Hennequin_Tom_EN.pdf')
  const CV_EN = '';

  function setupCv() {
    const links = $$('[data-cv]');
    const fr = links.length ? links[0].getAttribute('href') : '';
    const apply = () => {
      const en = lang === 'en' && CV_EN;
      links.forEach((a) => {
        a.setAttribute('href', en ? CV_EN : fr);
        a.setAttribute('download', en ? 'CV_Tom_Hennequin_EN.pdf' : 'CV_Tom_Hennequin.pdf');
      });
      if (en) $$('[data-i18n="cta.cvMeta"]').forEach((s) => { s.textContent = 'PDF'; });
    };
    onLangChange(apply);
  }

  function setupContact() {
    const status = $('#copy-status');
    let statusTimer;
    const say = (msg) => {
      status.textContent = msg;
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => { status.textContent = ''; }, 3000);
    };

    $('#copy-email').addEventListener('click', async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(EMAIL);
        else {
          const ta = document.createElement('textarea');
          ta.value = EMAIL;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          ta.remove();
          if (!ok) throw new Error('copy');
        }
        say(t().copied);
      } catch (e) {
        say(t().copyFail);
      }
    });

    $('#vcard').addEventListener('click', () => {
      const v = (s) => String(s).replace(/([,;\\])/g, '\\$1');
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Hennequin;Tom;;;',
        'FN:Tom Hennequin',
        `TITLE:${v(t().vcardTitle)}`,
        'ORG:ESILV',
        `EMAIL;TYPE=INTERNET:${EMAIL}`,
        'TEL;TYPE=CELL:+33768454881',
        'URL:https://www.linkedin.com/in/tom-hennequin',
        `NOTE:${v(t().vcardNote)}`,
        'END:VCARD'
      ];
      const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/vcard;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Tom-Hennequin.vcf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    const form = $('#composer');
    const err = $('#f-error');
    const msg = $('#f-msg');
    msg.addEventListener('input', () => { if (msg.value.trim()) { err.hidden = true; msg.removeAttribute('aria-invalid'); } });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#f-nom').value.trim();
      const org = $('#f-org').value.trim();
      const subject = $('#f-objet').value + (org ? ` – ${org}` : '');
      const text = msg.value.trim();
      if (!text) {
        err.hidden = false;
        msg.setAttribute('aria-invalid', 'true');
        msg.focus();
        return;
      }
      const signature = [name, org].filter(Boolean).join('\n');
      const body = text + (signature ? `\n\n${signature}` : '');
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */

  function start() {
    let initial = 'fr';
    try {
      initial = new URLSearchParams(window.location.search).get('lang') || localStorage.getItem('lang') || 'fr';
    } catch (e) { /* rien */ }

    setupHeader();
    setupHeroSimulator();
    setupPricer();
    setupFactsheets();
    setupViewer();
    setupContact();
    setupCv();

    if (initial === 'en') setLang('en', false);
    document.documentElement.classList.remove('i18n-wait');
    // Le calcul Monte Carlo attend le premier affichage de la page
    requestAnimationFrame(() => setTimeout(reprice, 0));

    const year = $('#annee');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
