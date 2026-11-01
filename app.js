const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#mobile-nav');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); navigation.hidden = true; }
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  navigation.hidden = !open;
});
navigation.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
window.matchMedia('(min-width:761px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

// An original vector-drawn network globe with themed vector brand assets.
const canvas = document.querySelector('#globe');
const ctx = canvas.getContext('2d');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const continents = [
  [[-168,67],[-150,71],[-133,68],[-127,57],[-123,49],[-125,42],[-119,34],[-108,30],[-100,22],[-90,18],[-85,10],[-78,9],[-80,22],[-82,27],[-80,33],[-72,43],[-60,49],[-55,56],[-68,60],[-80,63],[-96,70],[-116,73],[-140,70],[-168,67]],
  [[-80,10],[-70,11],[-62,8],[-50,0],[-35,-7],[-40,-20],[-50,-29],[-54,-39],[-68,-55],[-74,-49],[-72,-35],[-77,-18],[-81,-5],[-80,10]],
  [[-51,60],[-42,62],[-21,76],[-30,83],[-48,82],[-63,74],[-51,60]],
  [[-17,36],[-4,36],[9,37],[22,32],[33,31],[35,24],[43,12],[51,11],[43,-3],[40,-14],[32,-25],[19,-35],[11,-27],[9,-7],[-1,5],[-13,5],[-17,16],[-17,36]],
  [[-10,36],[-8,43],[-1,44],[-5,49],[7,54],[12,57],[6,62],[16,71],[29,70],[30,60],[44,65],[60,69],[80,73],[105,77],[130,70],[155,71],[177,65],[163,58],[147,54],[139,45],[130,42],[128,35],[120,31],[113,21],[108,10],[102,1],[98,9],[92,22],[80,27],[76,8],[70,21],[57,25],[50,14],[44,13],[35,29],[25,36],[16,40],[15,46],[9,44],[2,42],[-10,36]],
  [[112,-22],[115,-34],[130,-34],[139,-39],[151,-33],[153,-26],[145,-15],[136,-12],[130,-13],[121,-18],[112,-22]],
  [[47,-13],[50,-17],[48,-25],[44,-25],[44,-18],[47,-13]],
  [[-7,50],[-4,57],[-6,59],[1,58],[1,51],[-7,50]],
  [[130,32],[136,35],[141,41],[145,44],[143,37],[137,33],[130,32]]
];
let width = 0, height = 0, phase = 0, flightTime = 0, raf = 0, visible = true;
const rad = Math.PI / 180;
function project(lon, lat, radius, cx, cy) {
  const l = (lon - 26 + phase) * rad, p = lat * rad, tilt = 15 * rad;
  const x = Math.cos(p) * Math.sin(l), y = Math.sin(p), z = Math.cos(p) * Math.cos(l);
  return [cx + radius * x, cy - radius * (y * Math.cos(tilt) - z * Math.sin(tilt)), y * Math.sin(tilt) + z * Math.cos(tilt)];
}
function curve(points, radius, cx, cy, color, lineWidth = .55) {
  ctx.beginPath(); let started = false;
  for (const point of points) {
    const [x,y,z] = project(point[0], point[1], radius, cx, cy);
    if (z < 0) { started = false; continue; }
    if (!started) { ctx.moveTo(x,y); started = true; } else ctx.lineTo(x,y);
  }
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
}
function orbitSegment(radius, cx, cy, start, end, marker = false) {
  ctx.save();
  ctx.translate(cx, cy - radius * .38);
  ctx.rotate(-.13);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.31, radius * .235, 0, start, end);
  ctx.strokeStyle = '#aa71eeaa';
  ctx.lineWidth = 1.25;
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#9962e277';
  ctx.stroke();
  ctx.shadowBlur = 0;
  if (marker) {
    const angle = .8;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * radius * 1.31, Math.sin(angle) * radius * .235, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#e2caff';
    ctx.fill();
  }
  ctx.restore();
}
// Elevated great-circle routes: the packets stay attached to the rotating globe.
const networkNodes = [
  [2,49],[31,30],[37,55],[72,19],[103,31],[-74,41],[18,-33],[139,36],[13,52],
  [-122,38],[-118,34],[-87,42],[-99,19],[-46,-23],[-3,40],[-.1,51.5],
  [12.5,42],[29,41],[55,25],[77,29],[100,14],[116,40],[127,37],[151,-34],
  [174,-37],[21,52],[10,60],[25,60],[18,59],[44,42]
];
const flightRoutes = [
  {from:[-74,41],to:[2,49],delay:0,duration:3.2,lift:.55},
  {from:[2,49],to:[37,55],delay:2.3,duration:2.5,lift:.46},
  {from:[37,55],to:[103,31],delay:4.8,duration:3.5,lift:.65},
  {from:[72,19],to:[139,36],delay:1.2,duration:3.1,lift:.6},
  {from:[13,52],to:[72,19],delay:5.9,duration:3.2,lift:.62},
  {from:[31,30],to:[103,31],delay:3.6,duration:3.6,lift:.58},
  {from:[-122,38],to:[-87,42],delay:1.7,duration:2.8,lift:.5},
  {from:[-87,42],to:[-74,41],delay:4.2,duration:2.2,lift:.42},
  {from:[-74,41],to:[-.1,51.5],delay:5.2,duration:3.1,lift:.55},
  {from:[-3,40],to:[12.5,42],delay:.6,duration:2.3,lift:.42},
  {from:[10,60],to:[37,55],delay:3,duration:2.5,lift:.38},
  {from:[21,52],to:[116,40],delay:1.9,duration:3.4,lift:.55},
  {from:[29,41],to:[55,25],delay:5.7,duration:2.6,lift:.48},
  {from:[55,25],to:[77,29],delay:4.4,duration:2.5,lift:.48},
  {from:[100,14],to:[127,37],delay:.4,duration:2.8,lift:.5},
  {from:[127,37],to:[139,36],delay:3.8,duration:2.2,lift:.42}

];
function flightPoint(from, to, t, lift, radius, cx, cy) {
  const dot = Math.max(-1,Math.min(1,from.reduce((sum,n,i)=>sum+n*to[i],0)));
  const angle = Math.acos(dot), sine = Math.sin(angle);
  const a = sine > .001 ? Math.sin((1-t)*angle)/sine : 1-t;
  const b = sine > .001 ? Math.sin(t*angle)/sine : t;
  const scale = radius*(1+Math.sin(Math.PI*t)*lift);
  return [cx+(from[0]*a+to[0]*b)*scale,cy-(from[1]*a+to[1]*b)*scale];
}
function landingRing(point, progress) {
  if (progress<0 || progress>1) return;
  ctx.beginPath();ctx.arc(point[0],point[1],2+progress*13,0,Math.PI*2);
  ctx.strokeStyle=`rgba(211,174,255,${(1-progress)*.7})`;ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.arc(point[0],point[1],2.4,0,Math.PI*2);
  ctx.fillStyle=`rgba(240,222,255,${1-progress})`;ctx.fill();
}
function drawFlights(radius, cx, cy) {
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for (const route of flightRoutes) {
    const elapsed = motion.matches ? route.duration*.55 : (flightTime+route.delay)%6.6;
    if (elapsed>route.duration+.7) continue;
    const a=project(...route.from,radius,cx,cy),b=project(...route.to,radius,cx,cy);
    // Rear destinations never show through the surface.
    if(a[2]<.12 || b[2]<.12) continue;
    const from=[(a[0]-cx)/radius,(cy-a[1])/radius,a[2]];
    const to=[(b[0]-cx)/radius,(cy-b[1])/radius,b[2]];
    const progress=Math.min(1,elapsed/route.duration);
    const fade=Math.min(1,elapsed/.3)*Math.max(0,1-(elapsed-route.duration)/.7);
    ctx.beginPath();
    for(let i=0;i<=48;i++){
      const p=flightPoint(from,to,progress*i/48,route.lift,radius,cx,cy);
      if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);
    }
    ctx.strokeStyle=`rgba(188,137,246,${.3*fade})`;ctx.lineWidth=1;ctx.stroke();
    if(elapsed<route.duration){
      const tail=Math.max(0,progress-.16);
      for(let i=0;i<18;i++){
        const t=tail+(progress-tail)*i/18,next=tail+(progress-tail)*(i+1)/18;
        ctx.beginPath();ctx.moveTo(...flightPoint(from,to,t,route.lift,radius,cx,cy));
        ctx.lineTo(...flightPoint(from,to,next,route.lift,radius,cx,cy));
        ctx.strokeStyle=`rgba(205,161,255,${(i+1)/18*.9})`;ctx.lineWidth=1.7;ctx.stroke();
      }
      const head=flightPoint(from,to,progress,route.lift,radius,cx,cy);
      ctx.shadowColor='#c183ff';ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(...head,2.5,0,Math.PI*2);ctx.fillStyle='#f5e9ff';ctx.fill();ctx.shadowBlur=0;
      if(elapsed<.5)landingRing(a,elapsed/.5);
    }else landingRing(b,(elapsed-route.duration)/.7);
  }
  ctx.restore();
}
function draw() {
  ctx.clearRect(0,0,width,height);
  const r = width * .338, cx = width / 2, cy = height * .99;
  const glow = ctx.createRadialGradient(cx,cy,r*.1,cx,cy,r*1.25);
  glow.addColorStop(0,'#59348b55');glow.addColorStop(.68,'#58358132');glow.addColorStop(1,'#38214e00');
  ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  const sphere = ctx.createRadialGradient(cx-r*.18,cy-r*.62,r*.06,cx,cy,r);
  sphere.addColorStop(0,'#30203e');sphere.addColorStop(.55,'#21172f');sphere.addColorStop(1,'#0e0d16');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=sphere;ctx.fill();
  ctx.strokeStyle='#b28ace28';ctx.lineWidth=.8;ctx.stroke();
  for (let lat=-75;lat<=75;lat+=15) { const points=[];for(let lon=-180;lon<=180;lon+=2) points.push([lon,lat]);curve(points,r,cx,cy,'#b58de01b'); }
  for (let lon=-180;lon<180;lon+=15) { const points=[];for(let lat=-90;lat<=90;lat+=2) points.push([lon,lat]);curve(points,r,cx,cy,'#b58de01b'); }
  for (const polygon of continents) {
    const points=[];for(let i=0;i<polygon.length-1;i++){const a=polygon[i],b=polygon[i+1];const n=Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/2);for(let j=0;j<n;j++)points.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}points.push(polygon.at(-1));
    ctx.shadowBlur=5;ctx.shadowColor='#af70ee65';curve(points,r,cx,cy,'#bf8effb5',.85);ctx.shadowBlur=0;
  }
  for (const [lon,lat] of networkNodes) {
    const [x,y,z]=project(lon,lat,r,cx,cy);if(z>.12){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fillStyle='#e0c5ff';ctx.shadowBlur=12;ctx.shadowColor='#b87cff';ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.strokeStyle='#cfa0ff44';ctx.lineWidth=.6;ctx.stroke();}
  }
  drawFlights(r,cx,cy);
  orbitSegment(r,cx,cy,0,Math.PI,true);
}
function resize(){const bounds=canvas.getBoundingClientRect();width=bounds.width;height=bounds.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
let last=0;
function animate(now){if(now-last>45){phase+=.2;flightTime=now*.001;draw();last=now;}if(visible&&!motion.matches)raf=requestAnimationFrame(animate);}
function updateAnimation(){cancelAnimationFrame(raf);if(visible&&!motion.matches)raf=requestAnimationFrame(animate);else draw();}
new ResizeObserver(resize).observe(canvas);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;updateAnimation();}).observe(canvas);
motion.addEventListener('change',updateAnimation);
document.addEventListener('visibilitychange',()=>{visible=!document.hidden&&canvas.getBoundingClientRect().bottom>0;updateAnimation();});
