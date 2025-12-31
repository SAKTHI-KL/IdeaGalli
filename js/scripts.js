// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
navToggle && navToggle.addEventListener('click', ()=> mainNav.classList.toggle('show'));
// Close mobile nav when a link is clicked (improves UX)
if(mainNav){
  mainNav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> mainNav.classList.remove('show')));
}

// Modal booking
const bookBtn = document.getElementById('bookBtn');
const bookModal = document.getElementById('bookModal');
const modalClose = document.getElementById('modalClose');
bookBtn && bookBtn.addEventListener('click', ()=> bookModal.setAttribute('aria-hidden','false'));
modalClose && modalClose.addEventListener('click', ()=> bookModal.setAttribute('aria-hidden','true'));
bookModal && bookModal.addEventListener('click', (e)=>{ if(e.target===bookModal) bookModal.setAttribute('aria-hidden','true') })

// Simple rotating text
const rotator = document.getElementById('rotator');
const phrases = [
  'SEO Visibility on Google',
  'Strong Social Media Presence',
  'High-quality B2C Content',
  'Proven SEO & Ads Strategies'
];
let rIndex = 0; setInterval(()=>{ rIndex = (rIndex+1)%phrases.length; if(rotator) rotator.textContent = phrases[rIndex]; },3500);

// Testimonial carousel
// const track = document.getElementById('carouselTrack');
// const prev = document.querySelector('.carousel-prev');
// const next = document.querySelector('.carousel-next');
// let slideIndex = 0;
// function moveCarousel(){ if(!track) return; track.style.transform = `translateX(-${slideIndex*100}%)`; }
// prev && prev.addEventListener('click', ()=>{ slideIndex = Math.max(0, slideIndex-1); moveCarousel(); });
// next && next.addEventListener('click', ()=>{ slideIndex = Math.min(track.children.length-1, slideIndex+1); moveCarousel(); });
// setInterval(()=>{ slideIndex = (slideIndex+1) % (track ? track.children.length : 1); moveCarousel(); },5000);

// new Testimonial carousel
const track = document.getElementById('appTrack');
const slides = document.querySelectorAll('.app-slide');
const next = document.querySelector('.app-next');
const prev = document.querySelector('.app-prev');
let index = 0;
let autoPlay;
function updateCarousel() {
  track.style.transform = `translateX(-${index * 100}%)`;
}
next.onclick = () => {
  index = (index + 1) % slides.length;
  updateCarousel();
};
prev.onclick = () => {
  index = (index - 1 + slides.length) % slides.length;
  updateCarousel();
};
/* Auto play */
function startAutoPlay() {
  autoPlay = setInterval(() => {
    index = (index + 1) % slides.length;
    updateCarousel();
  }, 4000);
}
startAutoPlay();

/* Pause on hover */
track.addEventListener('mouseenter', () => clearInterval(autoPlay));
track.addEventListener('mouseleave', startAutoPlay);

/* Swipe support */
let startX = 0;
track.addEventListener('touchstart', e => startX = e.touches[0].clientX);
track.addEventListener('touchend', e => {
  const diff = startX - e.changedTouches[0].clientX;
  if (diff > 50) index++;
  if (diff < -50) index--;
  index = (index + slides.length) % slides.length;
  updateCarousel();
});

// Counters on scroll
const counters = document.querySelectorAll('.counter');
const runCounters = (el)=>{
  if(el.dataset.done) return; el.dataset.done=true;
  const target = +el.dataset.target;
  const start = 0; const duration = 1500; let startTime = null;
  function step(ts){ if(!startTime) startTime = ts; const progress = Math.min((ts-startTime)/duration,1); el.textContent = Math.floor(progress * target); if(progress<1) requestAnimationFrame(step); else el.textContent = target; }
  requestAnimationFrame(step);
};

// Reveal on scroll & trigger counters
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('revealed');
      const ct = entry.target.querySelectorAll('.counter'); ct.forEach(c => runCounters(c));
      // trigger any animate-on-view children (e.g., chart bars)
      const ao = entry.target.querySelectorAll('.animate-on-view'); ao.forEach(a=> a.classList.add('revealed'));
    }
  })
},{threshold:0.15});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

// Also observe standalone animate-on-view elements (in case they are not inside a .reveal)
const animateObserver = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting) e.target.classList.add('revealed');
  })
},{threshold:0.2});
document.querySelectorAll('.animate-on-view').forEach(el=>animateObserver.observe(el));

// Contact form - submit to serverless function
const contactForm = document.getElementById('contactForm');
async function sendEmail(payload){
  const endpoints = ['/api/send-email','/.netlify/functions/send-email'];
  for(const url of endpoints){
    try{
      const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(r.ok) return await r.json();
    }catch(e){ /* try next endpoint */ }
  }
  throw new Error('All endpoints failed');
}

async function sendLead(payload){
  const endpoints = ['/api/leads','/leads'];
  for(const url of endpoints){
    try{
      const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(r.ok) return await r.json();
    }catch(e){ /* try next endpoint */ }
  }
  throw new Error('All lead endpoints failed');
}

contactForm && contactForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(contactForm).entries());
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn && (submitBtn.disabled = true);
  try{
    await sendEmail(formData);
    try{ await sendLead({...formData, language: navigator.language || 'en'}); }catch(e){ console.warn('Lead endpoint not available', e); }
    window.dataLayer && window.dataLayer.push && window.dataLayer.push({event:'contact_form',label:'contact'});
    alert('Thanks! Your message was sent — we will get back to you shortly.');
    contactForm.reset();
  }catch(err){
    console.error(err);
    alert('Sorry — we could not send your message. Please try again or email info@example.com');
  }finally{ submitBtn && (submitBtn.disabled = false); }
});

// Booking form
const bookForm = document.getElementById('bookForm');
bookForm && bookForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(bookForm).entries());
  const submitBtn = bookForm.querySelector('button[type="submit"]');
  submitBtn && (submitBtn.disabled = true);
  try{
    await sendEmail({...formData, service: 'Booking request'});
    try{ await sendLead({...formData, service: 'Booking request', language: navigator.language || 'en'}); }catch(e){ console.warn('Lead endpoint not available', e); }
    window.dataLayer && window.dataLayer.push && window.dataLayer.push({event:'contact_form',label:'booking'});
    modalClose.click();
    alert('Thanks! We received your request.');
    bookForm.reset();
  }catch(err){
    console.error(err);
    alert('Sorry — could not send booking request. Try again later.');
  }finally{ submitBtn && (submitBtn.disabled = false); }
});

// Small accessibility: close modal on Esc
document.addEventListener('keydown', e=>{ if(e.key==='Escape') bookModal && bookModal.setAttribute('aria-hidden','true'); });

// Cookie consent: check on load
import('./consent.js').then(m=> m.checkConsent()).catch(()=>{/* ignore in non-module environments */});
