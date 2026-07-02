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
   Posts come from our own serverless proxy (api/medium.js), so the site no longer
   depends on a third-party public proxy. The endpoint returns the same shape rss2json
   used: { status:"ok", items:[{title,link,pubDate,description,content}] }. */
(function(){
  var ENDPOINT='/api/medium';
  var sec=document.getElementById('writing'),grid=document.getElementById('mediumPosts'),allBtn=document.getElementById('mediumAll');
  if(!sec||!grid)return;
  function strip(h){var d=document.createElement('div');d.innerHTML=h||'';return (d.textContent||'').replace(/\s+/g,' ').trim();}
  function fmt(d){try{return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}catch(e){return '';}}
  fetch(ENDPOINT)
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

/* Sri — grounded RAG assistant panel.
   Real fetch() calls to /api/ask (Claude Haiku over /knowledge-base), renders the returned
   source filenames as a citation under each answer, with typing indicator and quick-ask chips.
   Auto-opens once per visitor (localStorage), then collapses to a bubble + "Ask me" nudge. */
(function(){
  var panel=document.getElementById('sriPanel'),dock=document.getElementById('sriDock'),
      body=document.getElementById('sriBody'),field=document.getElementById('sriField');
  if(!panel||!dock||!body||!field)return;
  var busy=false;

  function scroll(){body.scrollTop=body.scrollHeight;}
  function openPanel(){panel.classList.remove('hidden');dock.classList.add('hidden');
    setTimeout(function(){try{field.focus();}catch(e){}},260);}
  function closePanel(){panel.classList.add('hidden');dock.classList.remove('hidden');}

  function userMsg(txt){
    var d=document.createElement('div');d.className='sri-msg user';d.textContent=txt;
    body.appendChild(d);scroll();
  }
  function botMsg(text,sources){
    var d=document.createElement('div');d.className='sri-msg bot';
    d.textContent=text;                      // model output rendered as text — no HTML injection
    if(sources&&sources.length){
      var c=document.createElement('div');c.className='sri-cite';
      var tick=document.createElement('span');tick.className='tick';tick.textContent='✓';
      c.appendChild(tick);
      c.appendChild(document.createTextNode(' source: '+sources.join(', ')));
      d.appendChild(c);
    }
    body.appendChild(d);scroll();
  }
  function typing(){
    var d=document.createElement('div');d.className='sri-typing';
    d.innerHTML='<span></span><span></span><span></span>';
    body.appendChild(d);scroll();return d;
  }

  function ask(q){
    if(busy||!q)return;busy=true;
    userMsg(q);var t=typing();
    fetch('/api/ask',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question:q})
    })
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,status:r.status,data:j};},
        function(){return {ok:false,status:r.status,data:null};});})
      .then(function(res){
        t.remove();
        if(res.ok&&res.data&&typeof res.data.answer==='string'){
          botMsg(res.data.answer,res.data.sources||[]);
        }else if(res.status===429){
          botMsg('I’m getting a lot of questions right now — give me a moment, then try again.',[]);
        }else{
          botMsg('Sorry, I couldn’t reach my knowledge base just now. Please try again, or contact Srikanth directly.',[]);
        }
      })
      .catch(function(){t.remove();botMsg('Sorry, something went wrong on my end. Please try again shortly.',[]);})
      .then(function(){busy=false;try{field.focus();}catch(e){}});
  }
  function send(){var v=field.value.trim();if(!v)return;field.value='';ask(v);}

  document.getElementById('sriBubble').addEventListener('click',openPanel);
  document.getElementById('sriClose').addEventListener('click',closePanel);
  document.getElementById('sriSend').addEventListener('click',send);
  field.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();send();}});
  [].forEach.call(panel.querySelectorAll('.sri-chip'),function(ch){
    ch.addEventListener('click',function(){ask(ch.getAttribute('data-q'));});
  });

  // Auto-open once per visitor; afterwards start collapsed as a bubble + nudge.
  var seen=false;
  try{seen=!!localStorage.getItem('sri_seen');}catch(e){}
  if(!seen){
    try{localStorage.setItem('sri_seen','1');}catch(e){}
    setTimeout(openPanel,1400);   // after the intro overlay clears
  }else{
    dock.classList.remove('hidden');
  }
})();
