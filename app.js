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
// Geometry is prepared once; only a small overlay is repainted at 30 fps.
const canvas = document.querySelector('#globe');
const ctx = canvas.getContext('2d');
const hero = document.querySelector('.hero');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width:760px)');
const base = document.createElement('canvas');
const surface = document.createElement('canvas');
const orbit = document.createElement('canvas');
const baseCtx = base.getContext('2d');
const surfaceCtx = surface.getContext('2d');
const orbitCtx = orbit.getContext('2d');
const rad = Math.PI / 180, tiltSin = Math.sin(15*rad), tiltCos = Math.cos(15*rad);
let width=0,height=0,radius=0,cx=0,cy=0,phase=0,spinSin=0,spinCos=1;
let compact=mobile.matches,inViewport=false,heroInViewport=false,scrolling=false,raf=0,lastTick=0,surfaceElapsed=0,flightTime=0,scrollTimer=0;
function unit([lon,lat]) {
  const l=(lon-26)*rad,p=lat*rad,c=Math.cos(p);
  return [c*Math.sin(l),Math.sin(p),c*Math.cos(l)];
}
function project(point) {
  const x=point[0]*spinCos+point[2]*spinSin,z=point[2]*spinCos-point[0]*spinSin;
  return [cx+radius*x,cy-radius*(point[1]*tiltCos-z*tiltSin),point[1]*tiltSin+z*tiltCos];
}
function buildGrid(spacing,step) {
  const curves=[];
  for(let lat=-90+spacing;lat<90;lat+=spacing){const points=[];for(let lon=-180;lon<=180;lon+=step)points.push(unit([lon,lat]));curves.push(points);}
  for(let lon=-180;lon<180;lon+=spacing){const points=[];for(let lat=-90;lat<=90;lat+=step)points.push(unit([lon,lat]));curves.push(points);}
  return curves;
}
const grids={small:buildGrid(30,5),large:buildGrid(15,3)};
const outlines=continents.map(polygon=>{
  const points=[];
  for(let i=0;i<polygon.length-1;i++){
    const a=polygon[i],b=polygon[i+1],n=Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/2);
    for(let j=0;j<n;j++)points.push(unit([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]));
  }
  points.push(unit(polygon.at(-1)));return points;
});
const nodes=networkNodes.map(unit);
for(const route of flightRoutes){
  route.start=unit(route.from);route.end=unit(route.to);
  const angle=Math.acos(Math.max(-1,Math.min(1,route.start.reduce((s,n,i)=>s+n*route.end[i],0)))),sine=Math.sin(angle);
  route.points=Array.from({length:65},(_,i)=>{
    const t=i/64,a=sine>.001?Math.sin((1-t)*angle)/sine:1-t,b=sine>.001?Math.sin(t*angle)/sine:t;
    const scale=1+Math.sin(Math.PI*t)*route.lift;
    return route.start.map((n,j)=>(n*a+route.end[j]*b)*scale);
  });
}
function flightPoint(route,t){
  const f=Math.max(0,Math.min(64,t*64)),i=Math.min(63,Math.floor(f)),mix=f-i;
  return project(route.points[i].map((n,j)=>n+(route.points[i+1][j]-n)*mix));
}
function strokeCurve(context,points,color,lineWidth){
  context.beginPath();let started=false;
  for(const point of points){
    const x=point[0]*spinCos+point[2]*spinSin,z=point[2]*spinCos-point[0]*spinSin;
    if(point[1]*tiltSin+z*tiltCos<0){started=false;continue;}
    const sx=cx+radius*x,sy=cy-radius*(point[1]*tiltCos-z*tiltSin);
    if(!started){context.moveTo(sx,sy);started=true;}else context.lineTo(sx,sy);
  }
  context.strokeStyle=color;context.lineWidth=lineWidth;context.stroke();
}
function buildLayers(){
  baseCtx.clearRect(0,0,width,height);
  const glow=baseCtx.createRadialGradient(cx,cy,radius*.1,cx,cy,radius*1.25);
  glow.addColorStop(0,'#59348b55');glow.addColorStop(.68,'#58358132');glow.addColorStop(1,'#38214e00');
  baseCtx.fillStyle=glow;baseCtx.fillRect(0,0,width,height);
  const sphere=baseCtx.createRadialGradient(cx-radius*.18,cy-radius*.62,radius*.06,cx,cy,radius);
  sphere.addColorStop(0,'#30203e');sphere.addColorStop(.55,'#21172f');sphere.addColorStop(1,'#0e0d16');
  baseCtx.beginPath();baseCtx.arc(cx,cy,radius,0,Math.PI*2);baseCtx.fillStyle=sphere;baseCtx.fill();
  baseCtx.strokeStyle='#b28ace28';baseCtx.lineWidth=.8;baseCtx.stroke();
  orbitCtx.clearRect(0,0,width,height);orbitCtx.save();
  orbitCtx.translate(cx,cy-radius*.38);orbitCtx.rotate(-.13);
  orbitCtx.beginPath();orbitCtx.ellipse(0,0,radius*1.31,radius*.235,0,0,Math.PI);
  orbitCtx.strokeStyle='#aa71eeaa';orbitCtx.lineWidth=1.25;orbitCtx.stroke();
  orbitCtx.beginPath();orbitCtx.arc(Math.cos(.8)*radius*1.31,Math.sin(.8)*radius*.235,2.5,0,Math.PI*2);
  orbitCtx.fillStyle='#e2caff';orbitCtx.fill();orbitCtx.restore();
}
function drawSurface(){
  surfaceCtx.clearRect(0,0,width,height);
  surfaceCtx.drawImage(base,0,0,width,height);
  for(const points of compact?grids.small:grids.large)strokeCurve(surfaceCtx,points,'#b58de020',.55);
  surfaceCtx.shadowBlur=compact?0:3;surfaceCtx.shadowColor='#af70ee55';
  for(const points of outlines)strokeCurve(surfaceCtx,points,'#bf8effb5',.85);
  surfaceCtx.shadowBlur=0;
  for(const point of nodes){
    const [x,y,z]=project(point);if(z<=.12)continue;
    surfaceCtx.beginPath();surfaceCtx.arc(x,y,5,0,Math.PI*2);surfaceCtx.fillStyle='#b87cff19';surfaceCtx.fill();
    surfaceCtx.beginPath();surfaceCtx.arc(x,y,1.8,0,Math.PI*2);surfaceCtx.fillStyle='#e0c5ff';surfaceCtx.fill();
    surfaceCtx.beginPath();surfaceCtx.arc(x,y,5,0,Math.PI*2);surfaceCtx.strokeStyle='#cfa0ff44';surfaceCtx.lineWidth=.6;surfaceCtx.stroke();
  }
}
function landingRing(point,progress){
  if(progress<0||progress>1)return;
  ctx.beginPath();ctx.arc(point[0],point[1],2+progress*(compact?9:13),0,Math.PI*2);
  ctx.strokeStyle=`rgba(211,174,255,${(1-progress)*.7})`;ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.arc(point[0],point[1],2.2,0,Math.PI*2);ctx.fillStyle=`rgba(240,222,255,${1-progress})`;ctx.fill();
}
function drawFlights(){
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const route of flightRoutes){
    const elapsed=motion.matches?route.duration*.55:(flightTime+route.delay)%6.6;
    if(elapsed>route.duration+.7)continue;
    const from=project(route.start),to=project(route.end);
    if(from[2]<.12||to[2]<.12)continue;
    const progress=Math.min(1,elapsed/route.duration),head=flightPoint(route,progress);
    const fade=Math.min(1,elapsed/.3)*Math.max(0,1-(elapsed-route.duration)/.7);
    ctx.beginPath();ctx.moveTo(from[0],from[1]);
    for(let i=compact?2:1;i<progress*64;i+=compact?2:1){const p=project(route.points[i]);ctx.lineTo(p[0],p[1]);}
    ctx.lineTo(head[0],head[1]);ctx.strokeStyle=`rgba(188,137,246,${.3*fade})`;ctx.lineWidth=1;ctx.stroke();
    if(elapsed<route.duration){
      const tail=Math.max(0,progress-.16),start=flightPoint(route,tail);
      // One gradient stroke replaces many individually blurred tail segments.
      if(progress>0){
        const gradient=ctx.createLinearGradient(start[0],start[1],head[0],head[1]);
        gradient.addColorStop(0,'#cda1ff00');gradient.addColorStop(1,'#e3c2ff');
        ctx.beginPath();ctx.moveTo(start[0],start[1]);
        const steps=compact?6:10;
        for(let i=1;i<=steps;i++){const p=flightPoint(route,tail+(progress-tail)*i/steps);ctx.lineTo(p[0],p[1]);}
        ctx.strokeStyle=gradient;ctx.lineWidth=1.8;ctx.stroke();
      }
      ctx.beginPath();ctx.arc(head[0],head[1],5,0,Math.PI*2);ctx.fillStyle='#c183ff30';ctx.fill();
      ctx.beginPath();ctx.arc(head[0],head[1],2.3,0,Math.PI*2);ctx.fillStyle='#f5e9ff';ctx.fill();
      if(elapsed<.5)landingRing(from,elapsed/.5);
    }else landingRing(to,(elapsed-route.duration)/.7);
  }
}
function draw(){
  if(!width||!height)return;
  ctx.clearRect(0,0,width,height);ctx.drawImage(surface,0,0,width,height);drawFlights();ctx.drawImage(orbit,0,0,width,height);
}
function resize(){
  const bounds=canvas.getBoundingClientRect();compact=mobile.matches;
  const nextWidth=bounds.width,nextHeight=bounds.height,dpr=Math.min(window.devicePixelRatio||1,compact?1.25:1.75);
  if(width===nextWidth&&height===nextHeight&&canvas.width===Math.round(nextWidth*dpr))return;
  width=nextWidth;height=nextHeight;radius=width*.338;cx=width/2;cy=height*(compact?.93:.99);
  for(const [layer,context] of [[canvas,ctx],[base,baseCtx],[surface,surfaceCtx],[orbit,orbitCtx]]){
    layer.width=Math.round(width*dpr);layer.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);
  }
  buildLayers();drawSurface();draw();
}
function active(){return inViewport&&!document.hidden&&!scrolling;}
function animate(now){
  if(!active()||motion.matches){raf=0;return;}
  if(!lastTick)lastTick=now-1000/30;
  const elapsed=now-lastTick;
  if(elapsed>=1000/30-1){
    const delta=Math.min(elapsed,100);lastTick=now;flightTime+=delta*.001;surfaceElapsed+=delta;
    if(surfaceElapsed>=(compact?100:80)){
      phase=(phase+surfaceElapsed*.0044)%360;spinSin=Math.sin(phase*rad);spinCos=Math.cos(phase*rad);
      drawSurface();surfaceElapsed=0;
    }
    draw();
  }
  raf=requestAnimationFrame(animate);
}
function updateAnimation(){
  cancelAnimationFrame(raf);raf=0;lastTick=0;
  hero.classList.toggle('is-idle',!heroInViewport||document.hidden||scrolling||motion.matches);
  if(active()){if(motion.matches)draw();else raf=requestAnimationFrame(animate);}
}
new ResizeObserver(resize).observe(canvas);
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){if(entry.target===canvas)inViewport=entry.isIntersecting;else heroInViewport=entry.isIntersecting;}
  updateAnimation();
});
observer.observe(hero);observer.observe(canvas);
motion.addEventListener('change',updateAnimation);
mobile.addEventListener('change',()=>{resize();updateAnimation();});
document.addEventListener('visibilitychange',updateAnimation);
// Let touch scrolling have the frame budget; resume automatically after it settles.
window.addEventListener('scroll',()=>{
  if(!compact||!heroInViewport)return;
  if(!scrolling){scrolling=true;updateAnimation();}
  clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{scrolling=false;updateAnimation();},160);
},{passive:true});
