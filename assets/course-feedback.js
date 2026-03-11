(function(){
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(ch) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch] || ch;
    });
  }

  function getCourseReviewsStore() {
    var raw = localStorage.getItem('course_reviews_db');
    if (!raw) return {};
    try { return JSON.parse(raw) || {}; } catch(e) { return {}; }
  }

  function setCourseReviewsStore(store) {
    localStorage.setItem('course_reviews_db', JSON.stringify(store || {}));
  }

  function setCourseRating(resourceId, rating) {
    var stars = document.querySelectorAll('[data-rating-course="' + resourceId + '"] .star-btn');
    stars.forEach(function(star){
      var val = parseInt(star.getAttribute('data-star-value') || '0', 10);
      star.classList.toggle('active', val <= rating);
    });
    var hint = document.getElementById('rating-hint-' + resourceId);
    if (hint) hint.textContent = rating + '/5 · Merci pour ta note ✨';
    var wrap = document.querySelector('[data-rating-course="' + resourceId + '"]');
    if (wrap) wrap.setAttribute('data-rating-value', String(rating));
  }

  function saveCourseReview(resourceId, resourceTitle) {
    var wrap = document.querySelector('[data-rating-course="' + resourceId + '"]');
    var commentEl = document.querySelector('[data-review-field="comment"][data-resource-id="' + resourceId + '"]');
    if (!wrap || !commentEl) return;
    var rating = parseInt(wrap.getAttribute('data-rating-value') || '0', 10);
    if (!rating) { window.finToast("Choisis une note de 1 à 5 étoiles avant d'envoyer ✨", 'rgba(252,186,51,0.9)'); return; }
    var userId = window.currentUserId || 'user-sophie-a';
    var store = getCourseReviewsStore();
    var key = userId + '::' + resourceId;
    store[key] = {
      userId: userId,
      resourceId: resourceId,
      resourceTitle: resourceTitle,
      rating: rating,
      comment: commentEl.value.trim(),
      updatedAt: new Date().toISOString()
    };
    setCourseReviewsStore(store);
    var status = document.getElementById('review-status-' + resourceId);
    if (status && typeof window.formatNoteDate === 'function') status.textContent = 'Avis envoyé le ' + window.formatNoteDate(store[key].updatedAt);
    renderAdminFormationFeedback();
    if (typeof window.finToast === 'function') window.finToast('✓ Merci, ton avis a été envoyé', '#6ecf9e');
  }

  function preloadCourseReviews() {
    var userId = window.currentUserId || 'user-sophie-a';
    var store = getCourseReviewsStore();
    Object.keys(store).forEach(function(key) {
      var item = store[key];
      if (!item || item.userId !== userId) return;
      setCourseRating(item.resourceId, parseInt(item.rating || 0, 10));
      var commentEl = document.querySelector('[data-review-field="comment"][data-resource-id="' + item.resourceId + '"]');
      if (commentEl) commentEl.value = item.comment || '';
      var status = document.getElementById('review-status-' + item.resourceId);
      if (status && typeof window.formatNoteDate === 'function') status.textContent = 'Avis envoyé le ' + window.formatNoteDate(item.updatedAt);
    });
    renderAdminFormationFeedback();
  }

  function renderAdminFormationFeedback() {
    var grid = document.getElementById('admin-formations-feedback-grid');
    if (!grid) return;
    var byFormation = {};
    Object.values(getCourseReviewsStore()).forEach(function(item) {
      if (!item || !item.resourceId) return;
      if (!byFormation[item.resourceId]) byFormation[item.resourceId] = { title:item.resourceTitle || item.resourceId, entries:[] };
      byFormation[item.resourceId].entries.push(item);
    });

    var groups = Object.keys(byFormation);
    if (!groups.length) {
      grid.innerHTML = '<div class="admin-feedback-card" style="grid-column:1 / -1;"><div class="admin-feedback-title">Pas encore d\'avis membre</div><div class="admin-feedback-comment">Les notes et commentaires des formations terminées apparaîtront ici automatiquement.</div></div>';
      return;
    }

    grid.innerHTML = groups.map(function(resourceId) {
      var block = byFormation[resourceId];
      var entries = (block.entries || []).sort(function(a,b){ return new Date(b.updatedAt||0) - new Date(a.updatedAt||0); });
      var avg = entries.reduce(function(acc,e){ return acc + (parseInt(e.rating || 0, 10) || 0); }, 0) / entries.length;
      var avgTxt = isNaN(avg) ? '0.0' : avg.toFixed(1);
      var rows = entries.slice(0,3).map(function(e) {
        var stars = '★'.repeat(parseInt(e.rating || 0, 10)) + '☆'.repeat(5 - parseInt(e.rating || 0, 10));
        var com = e.comment ? escapeHtml(e.comment) : '<em style="color:rgba(255,255,255,0.35);">(Pas de commentaire)</em>';
        var dateLabel = (typeof window.formatNoteDate === 'function') ? window.formatNoteDate(e.updatedAt) : (e.updatedAt || '-');
        return '<div class="admin-feedback-item">'
          + '<div class="admin-feedback-meta">' + stars + ' · ' + dateLabel + '</div>'
          + '<div class="admin-feedback-comment">' + com + '</div>'
        + '</div>';
      }).join('');

      return '<div class="admin-feedback-card">'
        + '<div class="admin-feedback-header"><div class="admin-feedback-title">' + escapeHtml(block.title) + '</div><div class="admin-feedback-avg">⭐ ' + avgTxt + '/5 · ' + entries.length + ' avis</div></div>'
        + rows
      + '</div>';
    }).join('');
  }

  window.getCourseReviewsStore = getCourseReviewsStore;
  window.setCourseReviewsStore = setCourseReviewsStore;
  window.setCourseRating = setCourseRating;
  window.saveCourseReview = saveCourseReview;
  window.preloadCourseReviews = preloadCourseReviews;
  window.renderAdminFormationFeedback = renderAdminFormationFeedback;
})();
