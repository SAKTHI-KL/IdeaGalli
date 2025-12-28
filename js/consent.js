// cookie consent and deferred analytics loader
const CONSENT_KEY = 'ig_cookie_consent';
function showConsent(){
  if(document.getElementById('cookieConsent')) return;
  const el = document.createElement('div'); el.id='cookieConsent'; el.className='cookie-consent';
  el.innerHTML = `<div class="cookie-inner"><p>We use cookies for analytics. By accepting, you allow Google Analytics to track anonymous usage. <button id="acceptCookies" class="btn small primary">Accept</button> <button id="rejectCookies" class="btn small">Reject</button></p></div>`;
  document.body.appendChild(el);
  document.getElementById('acceptCookies').addEventListener('click', ()=>{ localStorage.setItem(CONSENT_KEY,'accepted'); loadAnalytics(); el.remove(); });
  document.getElementById('rejectCookies').addEventListener('click', ()=>{ localStorage.setItem(CONSENT_KEY,'rejected'); el.remove(); });
}

function checkConsent(){
  const v = localStorage.getItem(CONSENT_KEY);
  if(!v) showConsent();
  else if(v === 'accepted') loadAnalytics();
}

// load analytics script dynamically
function loadAnalytics(){
  if(window._analyticsLoaded) return; window._analyticsLoaded = true;
  const id = 'G-XXXXXXXX'; // Replace measurement ID
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
}

export { checkConsent, loadAnalytics };
