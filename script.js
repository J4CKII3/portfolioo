// Menu toggle
const menuBtn = document.getElementById('menuBtn');
const menuPanel = document.getElementById('menuPanel');

if (menuBtn && menuPanel) {
  menuBtn.addEventListener('click', () => {
    const isOpen = menuPanel.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  menuPanel.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuPanel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// Scroll-reveal: fade/slide elements with class="reveal" into view once
const revealEls = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (revealEls.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // small stagger for elements revealing together
        setTimeout(() => entry.target.classList.add('in-view'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  revealEls.forEach(el => observer.observe(el));
} else {
  // No IO support, or reduced motion requested: just show everything
  revealEls.forEach(el => el.classList.add('in-view'));
}

// Work details modal
const detailItems = document.querySelectorAll('.work-card, .blog-entry, .blog-post');

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const renderMarkdown = source => {
  const lines = source.trim().split(/\r?\n/);
  const output = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      output.push('</ul>');
      listOpen = false;
    }
  };

  const inlineMarkdown = value => escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
    } else if (/^### /.test(trimmed)) {
      closeList();
      output.push(`<h4>${inlineMarkdown(trimmed.slice(4))}</h4>`);
    } else if (/^## /.test(trimmed)) {
      closeList();
      output.push(`<h3>${inlineMarkdown(trimmed.slice(3))}</h3>`);
    } else if (/^# /.test(trimmed)) {
      closeList();
      output.push(`<h3>${inlineMarkdown(trimmed.slice(2))}</h3>`);
    } else if (/^- /.test(trimmed)) {
      if (!listOpen) {
        output.push('<ul>');
        listOpen = true;
      }
      output.push(`<li>${inlineMarkdown(trimmed.slice(2))}</li>`);
    } else {
      closeList();
      output.push(`<p>${inlineMarkdown(trimmed)}</p>`);
    }
  });
  closeList();
  return output.join('');
};

if (detailItems.length) {
  const detailModal = document.createElement('div');
  detailModal.className = 'detail-modal';
  detailModal.setAttribute('aria-hidden', 'true');
  detailModal.innerHTML = `
    <div class="detail-modal-backdrop" data-detail-close></div>
    <section class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
      <button class="detail-close" type="button" aria-label="Close details" data-detail-close>&times;</button>
      <div class="detail-content">
        <span class="detail-label"></span>
        <h2 id="detailTitle"></h2>
        <div class="detail-description"></div>
        <div class="detail-footer"></div>
      </div>
    </section>`;
  document.body.appendChild(detailModal);

  const detailLabel = detailModal.querySelector('.detail-label');
  const detailTitle = detailModal.querySelector('#detailTitle');
  const detailDescription = detailModal.querySelector('.detail-description');
  const detailFooter = detailModal.querySelector('.detail-footer');
  let lastFocusedItem;

  const closeDetails = () => {
    detailModal.classList.remove('open');
    detailModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedItem) lastFocusedItem.focus();
  };

  const openDetails = (item) => {
    const label = item.querySelector('.tag, .blog-meta');
    const title = item.querySelector('h3, h2');
    const description = item.querySelector('p');
    const markdownDetails = item.querySelector('.work-details');
    const footer = item.querySelector('.archive-link, .archive-status');
    if (!title || !description) return;

    detailLabel.textContent = label ? label.textContent.trim() : '';
    detailTitle.textContent = title.textContent.trim();
    detailDescription.innerHTML = markdownDetails
      ? renderMarkdown(markdownDetails.textContent)
      : `<p>${description.innerHTML}</p>`;
    detailFooter.innerHTML = footer ? footer.outerHTML : '';
    detailModal.classList.add('open');
    detailModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    lastFocusedItem = item;
    detailModal.querySelector('.detail-close').focus();
  };

  detailItems.forEach(item => {
    const isBlogPost = item.classList.contains('blog-post');
    const isDisclosure = !!item.querySelector('.tag-disclosure');
    if (isDisclosure) {
      item.classList.add('disclosure-card');
      item.setAttribute('aria-label', 'Disclosure details hidden');
      return;
    }
    if (isBlogPost) {
      item.setAttribute('role', 'group');
    } else {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
    }
    item.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      openDetails(item);
    });
    item.addEventListener('keydown', event => {
      if (isBlogPost) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetails(item);
      }
    });
  });

  detailModal.addEventListener('click', event => {
    if (event.target.closest('[data-detail-close]')) closeDetails();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && detailModal.classList.contains('open')) closeDetails();
  });
}

// Keep the homepage metrics in sync with its content
const statValues = {
  years: document.querySelector('[data-stat="years"]'),
  work: document.querySelector('[data-stat="work"]'),
  tools: document.querySelector('[data-stat="tools"]'),
  education: document.querySelector('[data-stat="education"]')
};

if (statValues.work) {
  const startYear = Number(document.body.dataset.researchStartYear);
  const currentYear = new Date().getFullYear();
  statValues.years.textContent = `${Math.max(0, currentYear - startYear)}+`;
  statValues.work.textContent = document.querySelectorAll('#work .work-card').length;
  statValues.tools.textContent = document.querySelectorAll('#work .tag-tool').length;
  statValues.education.textContent = document.querySelectorAll('#background [data-certification]').length;
}

// Give the hero photo a restrained pointer-follow effect
const hero = document.querySelector('.hero');
const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (hero && supportsHover && !prefersReducedMotion) {
  const heroEnergy = hero.querySelector('.hero-energy');
  let pointerFrame;
  let pointerX = 0;
  let pointerY = 0;
  let lastEnergyTime = 0;

  const updateHeroPhoto = () => {
    hero.style.setProperty('--hero-pointer-x', `${pointerX}px`);
    hero.style.setProperty('--hero-pointer-y', `${pointerY}px`);
    pointerFrame = null;
  };

  const createEnergyTrail = event => {
    if (!heroEnergy) return;
    const now = performance.now();
    if (now - lastEnergyTime < 45) return;
    lastEnergyTime = now;
    const bounds = hero.getBoundingClientRect();
    const sparkCount = 2 + Math.floor(Math.random() * 3);
    for (let sparkIndex = 0; sparkIndex < sparkCount; sparkIndex += 1) {
      const spark = document.createElement('span');
      spark.className = 'energy-spark';
      spark.style.left = `${event.clientX - bounds.left + (Math.random() - 0.5) * 24}px`;
      spark.style.top = `${event.clientY - bounds.top + (Math.random() - 0.5) * 24}px`;
      spark.style.setProperty('--energy-dx', `${(Math.random() - 0.5) * 70}px`);
      spark.style.setProperty('--energy-dy', `${(Math.random() - 0.5) * 70}px`);
      spark.addEventListener('animationend', () => spark.remove(), { once: true });
      heroEnergy.appendChild(spark);
    }
    while (heroEnergy.children.length > 60) heroEnergy.firstElementChild.remove();
  };

  hero.addEventListener('pointermove', event => {
    const bounds = hero.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14;
    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
    createEnergyTrail(event);
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updateHeroPhoto);
  });

  hero.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updateHeroPhoto);
  });
}