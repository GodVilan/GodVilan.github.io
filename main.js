/* main.js — extracted from design-reference.html: project slider, intro overlay, project modal, scroll-reveal, Medium feed */
(function(){
  var rail=document.getElementById('projectRail');
  if(!rail)return;
  var wrap=rail.closest('.rail-wrap');
  var prev=wrap.querySelector('.rail-arrow.prev');
  var next=wrap.querySelector('.rail-arrow.next');
  var dotsWrap=document.getElementById('railDots');
  var cards=[].slice.call(rail.querySelectorAll('.card'));
  var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var beh=RM?'auto':'smooth';
  function step(){return cards[0].offsetWidth+18;}
  cards.forEach(function(c,i){
    var b=document.createElement('button');
    b.setAttribute('aria-label','Go to project '+(i+1));
    b.addEventListener('click',function(){rail.scrollTo({left:Math.round(i*step()),behavior:beh});});
    dotsWrap.appendChild(b);
  });
  var dots=[].slice.call(dotsWrap.children);
  function update(){
    var x=rail.scrollLeft,max=rail.scrollWidth-rail.clientWidth;
    wrap.classList.toggle('at-start',x<=4);
    wrap.classList.toggle('at-end',x>=max-4);
    if(prev)prev.disabled=x<=4;
    if(next)next.disabled=x>=max-4;
    var idx=Math.min(dots.length-1,Math.round(x/step()));
    dots.forEach(function(d,i){d.classList.toggle('on',i===idx);});
  }
  if(prev)prev.addEventListener('click',function(){rail.scrollBy({left:-step(),behavior:beh});});
  if(next)next.addEventListener('click',function(){rail.scrollBy({left:step(),behavior:beh});});
  rail.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update);
  update();
  // drag-to-scroll (desktop)
  var down=false,sx=0,sl=0,moved=false;
  rail.addEventListener('pointerdown',function(e){down=true;moved=false;sx=e.clientX;sl=rail.scrollLeft;rail.classList.add('dragging');});
  window.addEventListener('pointermove',function(e){if(!down)return;var d=e.clientX-sx;if(Math.abs(d)>5)moved=true;rail.scrollLeft=sl-d;});
  window.addEventListener('pointerup',function(){if(down){down=false;rail.classList.remove('dragging');}});
  rail.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();}},true);
  // keyboard
  rail.setAttribute('tabindex','0');rail.setAttribute('role','group');rail.setAttribute('aria-label','Projects — use arrow keys to scroll');
  rail.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){e.preventDefault();rail.scrollBy({left:step(),behavior:beh});}
    if(e.key==='ArrowLeft'){e.preventDefault();rail.scrollBy({left:-step(),behavior:beh});}
  });
})();

(function(){
  var intro=document.getElementById('intro');
  if(!intro)return;
  var RM=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  // Plays on every load/refresh. Reduced-motion users skip it entirely.
  if(RM){intro.parentNode&&intro.remove();return;}
  document.documentElement.classList.add('intro-lock');
  document.body.classList.add('intro-lock');
  var done=false;
  function finish(){
    if(done)return;done=true;
    intro.classList.add('done');
    document.documentElement.classList.remove('intro-lock');
    document.body.classList.remove('intro-lock');
    var brand=document.querySelector('.brand');
    if(brand)brand.classList.add('arrive');   // nav logo "receives" the name
    setTimeout(function(){intro&&intro.parentNode&&intro.remove();},640);
  }
  var timer=setTimeout(finish,2200);
  function skip(){clearTimeout(timer);finish();}
  var b=document.getElementById('introSkip');
  if(b)b.addEventListener('click',function(e){e.stopPropagation();skip();});
  intro.addEventListener('click',skip);
  window.addEventListener('keydown',function h(){window.removeEventListener('keydown',h);skip();});
  window.addEventListener('wheel',function h(){window.removeEventListener('wheel',h);skip();},{passive:true});
  window.addEventListener('touchmove',function h(){window.removeEventListener('touchmove',h);skip();},{passive:true});
})();

(function(){
  var overlay=document.getElementById('projModal'),body=document.getElementById('modalBody'),x=document.getElementById('modalX'),last=null;
  function open(art){last=art;body.innerHTML=art.querySelector('.detail').innerHTML;overlay.hidden=false;
    document.documentElement.classList.add('intro-lock');document.body.classList.add('intro-lock');x.focus();overlay.scrollTop=0;}
  function close(){overlay.hidden=true;document.documentElement.classList.remove('intro-lock');document.body.classList.remove('intro-lock');if(last)last.focus();}
  [].forEach.call(document.querySelectorAll('#projectRail .card'),function(art){
    art.addEventListener('click',function(){open(art);});
    art.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(art);}});
  });
  x.addEventListener('click',close);
  overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
  window.addEventListener('keydown',function(e){if(e.key==='Escape'&&!overlay.hidden)close();});
})();

(function(){
  var els=[].slice.call(document.querySelectorAll('.io'));
  if(!('IntersectionObserver' in window)||!els.length){els.forEach(function(e){e.classList.add('in');});return;}
  var ob=new IntersectionObserver(function(ents){
    ents.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');ob.unobserve(en.target);}});
  },{rootMargin:'0px 0px -8% 0px',threshold:0.12});
  els.forEach(function(e){ob.observe(e);});
})();

/* Writing section: pulls latest Medium posts live and hides the whole section if none.
   Set FEED to your exact Medium feed. Custom domain: https://srikanth2314.medium.com/feed
   Handle form: https://medium.com/feed/@your-handle
   Note: Medium RSS has no CORS headers, so this routes through a JSON proxy.
   For production reliability, swap the proxy for your own /api/medium serverless endpoint. */
(function(){
  var FEED='https://medium.com/feed/@srikanth2314';
  var sec=document.getElementById('writing'),grid=document.getElementById('mediumPosts'),allBtn=document.getElementById('mediumAll');
  if(!sec||!grid)return;
  function strip(h){var d=document.createElement('div');d.innerHTML=h||'';return (d.textContent||'').replace(/\s+/g,' ').trim();}
  function fmt(d){try{return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}catch(e){return '';}}
  fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(FEED))
    .then(function(r){return r.json();})
    .then(function(d){
      if(!d||d.status!=='ok'||!d.items||!d.items.length)return;
      grid.innerHTML=d.items.slice(0,6).map(function(p){
        var ex=strip(p.description).slice(0,120);
        var mins=Math.max(1,Math.round(strip(p.content||p.description).split(' ').length/200));
        return '<a class="post" href="'+p.link+'" target="_blank" rel="noopener">'
          +'<div class="post-meta">'+fmt(p.pubDate)+' &middot; '+mins+' min read</div>'
          +'<div class="post-title">'+p.title+'</div>'
          +'<div class="post-ex">'+ex+'&hellip;</div>'
          +'<div class="post-cta">Read on Medium &rarr;</div></a>';
      }).join('');
      sec.hidden=false;
      if(allBtn)allBtn.style.display='inline-flex';
      [].forEach.call(sec.querySelectorAll('.io'),function(e){e.classList.add('in');});
    })
    .catch(function(){/* leave section hidden */});
})();
