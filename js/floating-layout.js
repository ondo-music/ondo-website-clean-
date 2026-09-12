(function () {
  var layer = document.querySelector('body.is-home .home-floating-windows');
  if (!layer) return;
  var desktop = window.matchMedia('(min-width: 981px)');
  var windows = Array.from(layer.querySelectorAll('.home-floating-window'));
  // Candidate anchors are deliberate compositions, not random coordinates.
  var anchors = [
    ['upper-center', .40, .035], ['lower-left', .055, .63],
    ['lower-center', .43, .80], ['upper-right', .72, .035],
    ['left-middle', .055, .48], ['lower-offset', .23, .77],
    ['upper-offset', .53, .13], ['bottom-left', .055, .82],
    ['bottom-center', .57, .84], ['upper-left', .27, .035],
    ['left-offset', .18, .56], ['lower-right', .75, .83]
  ];
  function overlaps(a, b, gap) {
    return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
  }
  function bounds(el) {
    var r = el.getBoundingClientRect();
    return {x:r.left, y:r.top, w:r.width, h:r.height};
  }
  function obstacles() {
    var rects = [];
    document.querySelectorAll('.home-wordmark__title, .home-wordmark__subtitle, .home-wordmark .music-links-footer__nav a').forEach(function (el) {
      var range = document.createRange(); range.selectNodeContents(el);
      Array.from(range.getClientRects()).forEach(function (r) {
        if (r.width && r.height) rects.push({x:r.left, y:r.top, w:r.width, h:r.height});
      });
    });
    document.querySelectorAll('body > .music-links-footer .language-switcher, .ui-dock .social-dock, .home-index-menu .menu-item').forEach(function (el) {
      var r = bounds(el);
      if (!r.w || !r.h) return;
      // Reserve room for the desktop menu's expansion and neighbor movement.
      if (el.classList.contains('menu-item')) { r.x -= 32; r.y -= 24; r.w += 64; r.h += 48; }
      rects.push(r);
    });
    var visual = document.getElementById('artist-button');
    var r = bounds(visual);
    var radius = Math.max(visual.offsetWidth, visual.offsetHeight) / 2 + 28;
    return {rects:rects, circle:{x:r.x+r.w/2, y:r.y+r.h/2, radius:radius}};
  }
  function safe(r, blocked) {
    if (r.x < 16 || r.y < 16 || r.x+r.w > innerWidth-16 || r.y+r.h > innerHeight-16) return false;
    if (blocked.rects.some(function (b) { return overlaps(r,b,14); })) return false;
    var c=blocked.circle;
    var nearestX=Math.max(r.x,Math.min(c.x,r.x+r.w));
    var nearestY=Math.max(r.y,Math.min(c.y,r.y+r.h));
    return Math.hypot(nearestX-c.x,nearestY-c.y) > c.radius;
  }
  layer.acceptPosition = function (el,x,y) {
    return safe({x:x,y:y,w:el.offsetWidth,h:el.offsetHeight},obstacles());
  };
  function layout() {
    if (!desktop.matches) return;
    var blocked = obstacles();
    var placed = [];
    windows.forEach(function (el,index) {
      var w=el.offsetWidth, h=el.offsetHeight;
      var candidates=anchors.map(function (a,i) {
        return {name:a[0],x:Math.max(16,Math.min(innerWidth-w-16,innerWidth*a[1])),y:Math.max(16,Math.min(innerHeight-h-16,innerHeight*a[2])),w:w,h:h,rank:(i-index*3+anchors.length*10)%anchors.length};
      }).filter(function(r){return safe(r,blocked);});
      candidates.forEach(function(r){
        var intersection=placed.reduce(function(sum,b){
          return sum+Math.max(0,Math.min(r.x+r.w,b.x+b.w)-Math.max(r.x,b.x))*Math.max(0,Math.min(r.y+r.h,b.y+b.h)-Math.max(r.y,b.y));
        },0);
        r.score=intersection/(w*h)*100+r.rank+(r.name===el.dataset.position ? -20 : 0);
      });
      candidates.sort(function(a,b){return a.score-b.score;});
      var choice=candidates[0];
      // Never cover a primary control if an unusually small viewport has no safe slot.
      el.toggleAttribute('data-unplaced', !choice);
      el.inert = !choice;
      if (!choice) return;
      el.style.left=choice.x+'px'; el.style.top=choice.y+'px';
      el.dataset.placement=choice.name; placed.push(choice);
    });
  }
  var frame=0;
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(layout);}
  layout();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  document.fonts.ready.then(schedule);
  // Re-measure content boxes only when their dimensions change, not on animation frames.
  var observer=new ResizeObserver(schedule);
  document.querySelectorAll('.home-wordmark, .home-index-menu, .home-floating-window').forEach(function(el){observer.observe(el);});
})();
