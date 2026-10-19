// Shared script for every page: mobile menu + rendering content/*.json.
// Content is edited through Pages CMS (see .pages.yml), never by hand-editing HTML.

function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu() { document.getElementById('mobileMenu').classList.remove('open'); }
document.addEventListener('click', function (e) {
  if (!document.querySelector('nav').contains(e.target)) closeMenu();
});

(function () {
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function load(name) {
    // no-cache = always revalidate, so CMS edits show up as soon as they're deployed
    return fetch('content/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + '.json: ' + r.status);
      return r.json();
    });
  }

  function $(id) { return document.getElementById(id); }

  // "2026-10-17" -> local Date (avoids the UTC off-by-one of new Date(str))
  function parseDate(s) {
    var p = String(s || '').split('-');
    return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null;
  }

  function today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // ── SITE SETTINGS ──────────────────────────────────────────────────────────
  function renderSite(s) {
    document.querySelectorAll('[data-site="price"]').forEach(function (el) {
      if (s.price !== '' && s.price != null) el.textContent = s.price;
    });

    var join = $('joinButton');
    if (join) {
      if (s.stripeLink) {
        join.href = s.stripeLink;
      } else {
        join.removeAttribute('href');
        join.classList.add('btn-join-disabled');
        join.textContent = 'Online joining opens soon';
        var note = $('joinUnavailable');
        if (note) note.hidden = false;
      }
    }

    var hero = $('home');
    if (hero && s.heroImage) {
      hero.style.backgroundImage =
        'linear-gradient(180deg, rgba(1,24,67,0.88) 0%, rgba(1,24,67,0.72) 100%), url("' + encodeURI(s.heroImage) + '")';
    }

    var feedback = $('feedbackLink');
    if (feedback && s.feedbackForm) {
      feedback.href = s.feedbackForm;
      feedback.hidden = false;
    }
  }

  // ── COMMITTEE ──────────────────────────────────────────────────────────────
  function committeeCards(members) {
    return (members || []).filter(function (m) { return m.role; }).map(function (m) {
      var photo = m.photo
        ? '<img src="' + esc(m.photo) + '" alt="' + esc(m.name || m.role) + '" loading="lazy" />'
        : '&#128100;';
      return '<div class="committee-card">' +
        '<div class="committee-photo">' + photo + '</div>' +
        '<div class="committee-info">' +
          '<p class="committee-role">' + esc(m.role) + '</p>' +
          '<p class="committee-name">' + (m.name ? esc(m.name) : '&mdash;') + '</p>' +
          (m.college ? '<p class="committee-college">' + esc(m.college) + '</p>' : '') +
          (m.bio ? '<p class="committee-bio">' + esc(m.bio) + '</p>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderCommittee(data) {
    var exec = $('executiveGrid');
    if (!exec) return;
    exec.innerHTML = committeeCards(data.executive);
    var general = committeeCards(data.general);
    if (general) {
      $('generalGrid').innerHTML = general;
      $('generalSection').hidden = false;
    }
  }

  // ── EVENTS / TERM CARDS ────────────────────────────────────────────────────
  function eventRows(events) {
    var now = today();
    var sorted = (events || []).slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    });
    if (!sorted.length) return '';
    return '<div class="events-list">' + sorted.map(function (ev) {
      var d = parseDate(ev.date);
      var past = d && d < now;
      var meta = [ev.time, ev.location].filter(Boolean).map(esc).join(' &middot; ');
      return '<div class="event-row' + (past ? ' event-past' : '') + '">' +
        '<div class="event-date">' +
          (d ? '<div class="event-date-day">' + d.getDate() + '</div><div class="event-date-month">' + MONTHS[d.getMonth()] + '</div>'
             : '<div class="event-date-month">TBC</div>') +
        '</div>' +
        '<div class="event-body">' +
          '<strong>' + esc(ev.title) + '</strong>' +
          (meta ? '<span>' + meta + '</span>' : '') +
          (ev.description ? '<p class="event-desc">' + esc(ev.description) + '</p>' : '') +
          (ev.link && !past ? '<a class="event-link" href="' + esc(ev.link) + '" target="_blank" rel="noopener">Sign up &rarr;</a>' : '') +
        '</div>' +
        (ev.type ? '<span class="event-tag">' + esc(ev.type) + '</span>' : '<span></span>') +
      '</div>';
    }).join('') + '</div>';
  }

  function termCardImage(t) {
    return '<a class="term-card" href="' + esc(t.termCard) + '" target="_blank" rel="noopener">' +
      '<img src="' + esc(t.termCard) + '" alt="' + esc(t.term) + ' term card" loading="lazy" /></a>';
  }

  function renderEvents(data) {
    var current = $('currentTerm');
    if (!current) return;
    var terms = (data.terms || []).filter(function (t) { return t.term; }).sort(function (a, b) {
      return String(b.startDate).localeCompare(String(a.startDate));
    });
    if (!terms.length) return;

    // Current term: the 4:5 term card, with the event list beside it if one was added
    var t = terms[0];
    var card = t.termCard ? termCardImage(t) : '';
    var rows = eventRows(t.events);
    current.innerHTML = '<span class="term-label">' + esc(t.term) + '</span>' +
      (card || rows
        ? '<div class="term-layout' + (card && rows ? '' : ' term-layout-single') + '">' + card + rows + '</div>'
        : '<div class="empty-state"><p>Events for this term will be announced soon.</p></div>');

    // Archive: a grid of past term cards
    var past = terms.slice(1);
    if (!past.length) return;
    $('pastTerms').innerHTML = past.map(function (t) {
      return t.termCard
        ? '<a class="term-tile" href="' + esc(t.termCard) + '" target="_blank" rel="noopener">' +
            '<img src="' + esc(t.termCard) + '" alt="' + esc(t.term) + ' term card" loading="lazy" />' +
            '<span class="term-tile-label">' + esc(t.term) + '</span></a>'
        : '<div class="term-tile"><div class="term-tile-blank">' + esc(t.term) + '</div>' +
            '<span class="term-tile-label">' + esc(t.term) + '</span></div>';
    }).join('');
    $('pastSection').hidden = false;
  }

  // ── DOCUMENTS ──────────────────────────────────────────────────────────────
  function renderDocuments(data) {
    var grid = $('docGrid');
    if (!grid) return;
    grid.innerHTML = (data.documents || []).map(function (doc) {
      var ext = (String(doc.file).split('.').pop() || 'file').slice(0, 4).toUpperCase();
      return '<a class="doc-card" href="' + esc(doc.file) + '" target="_blank" rel="noopener">' +
        '<div class="doc-icon">' + esc(ext) + '</div>' +
        '<div class="doc-info">' +
          '<strong>' + esc(doc.title) + '</strong>' +
          (doc.description ? '<span>' + esc(doc.description) + '</span>' : '') +
          '<div class="doc-download">&#8595; Download ' + esc(ext) + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  // ── HOME: PHOTOS + SPONSORS ────────────────────────────────────────────────
  function renderGallery(data) {
    var section = $('photos');
    var photos = (data.photos || []).filter(function (p) { return p.image; });
    if (!section || !photos.length) return;
    $('galleryGrid').innerHTML = photos.map(function (p) {
      return '<figure class="gallery-item">' +
        '<img src="' + esc(p.image) + '" alt="' + esc(p.caption || 'Oxford Motorsport Society event') + '" loading="lazy" />' +
        (p.caption ? '<figcaption>' + esc(p.caption) + '</figcaption>' : '') +
      '</figure>';
    }).join('');
    section.hidden = false;
  }

  // Home page logo strip + the Sponsors page
  function renderSponsors(data) {
    var sponsors = (data.sponsors || []).filter(function (s) { return s.name; });

    var strip = $('sponsorGrid');
    if (strip && sponsors.length) {
      strip.innerHTML = sponsors.map(function (s) {
        var inner = s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy" />' : '<span>' + esc(s.name) + '</span>';
        return s.url
          ? '<a class="sponsor" href="' + esc(s.url) + '" target="_blank" rel="noopener" title="' + esc(s.name) + '">' + inner + '</a>'
          : '<div class="sponsor" title="' + esc(s.name) + '">' + inner + '</div>';
      }).join('');
      strip.hidden = false;
    }

    var cards = $('sponsorCards');
    if (cards && sponsors.length) {
      cards.innerHTML = sponsors.map(function (s) {
        return '<div class="sponsor-card">' +
          '<div class="sponsor-card-logo">' +
            (s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy" />' : '<span>' + esc(s.name) + '</span>') +
          '</div>' +
          '<div class="sponsor-card-body">' +
            '<strong>' + esc(s.name) + '</strong>' +
            (s.description ? '<p>' + esc(s.description) + '</p>' : '') +
            (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">Visit website &rarr;</a>' : '') +
          '</div>' +
        '</div>';
      }).join('');
      $('currentSponsors').hidden = false;
    }

    var pitch = $('sponsorPitch');
    if (pitch && data.pitch) {
      pitch.innerHTML = String(data.pitch).split(/\n\s*\n/).map(function (para) {
        return '<p>' + esc(para.trim()) + '</p>';
      }).join('');
    }

    var pack = $('sponsorPack');
    if (pack && data.pack) {
      pack.href = data.pack;
      pack.hidden = false;
    }
  }

  // ── STORE ──────────────────────────────────────────────────────────────────
  // Loaded on every page: the Store nav link only appears once something is listed.
  function renderStore(data) {
    var products = (data.products || []).filter(function (p) { return p.name && p.status !== 'Hidden'; });
    if (!products.length) return;

    document.querySelectorAll('[data-nav="store"]').forEach(function (el) { el.hidden = false; });

    var grid = $('productGrid');
    if (!grid) return;
    grid.innerHTML = products.map(function (p) {
      var price = p.price === '' || p.price == null ? '' : '&pound;' + (p.price % 1 ? Number(p.price).toFixed(2) : p.price);
      var soldOut = p.status === 'Sold out' || !p.stripeLink;
      return '<div class="product-card">' +
        '<div class="product-image">' +
          (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" />' : '') +
        '</div>' +
        '<div class="product-info">' +
          (p.category ? '<p class="product-category">' + esc(p.category) + '</p>' : '') +
          '<p class="product-name">' + esc(p.name) + '</p>' +
          (price ? '<p class="product-price">' + price + '</p>' : '') +
          (p.description ? '<p class="product-desc">' + esc(p.description) + '</p>' : '') +
          (soldOut
            ? '<span class="btn-join btn-join-disabled">' + (p.status === 'Sold out' ? 'Sold out' : 'Coming soon') + '</span>'
            : '<a class="btn-join" href="' + esc(p.stripeLink) + '" target="_blank" rel="noopener">Buy now</a>') +
        '</div>' +
      '</div>';
    }).join('');
  }

  var renderers = {
    site: renderSite,
    committee: renderCommittee,
    events: renderEvents,
    documents: renderDocuments,
    gallery: renderGallery,
    sponsors: renderSponsors,
    store: renderStore
  };

  // Each page lists the content files it needs: <body data-content="site committee">.
  // "store" is always loaded so the nav can show or hide the Store link.
  var names = (document.body.getAttribute('data-content') || 'site').split(/\s+/);
  if (names.indexOf('store') < 0) names.push('store');
  names.forEach(function (name) {
    if (!renderers[name]) return;
    load(name).then(renderers[name]).catch(function (err) { console.error(err); });
  });
})();
