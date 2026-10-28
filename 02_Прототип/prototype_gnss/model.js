(function(root){
const scenarios={normal:'GNSS доступен',outage:'Потеря GNSS',blind:'GNSS и ориентиры недоступны',spoof:'Ложная координата GNSS',link:'Потеря связи с ИТС'};
function run(mode='outage'){
 let x=0,y=0,dx=0,dy=0,dh=0,head=0,p=.25,lastITS=null,rejected=0;const rows=[];
 for(let i=0;i<=600;i++){
 const t=i*.2,th=.55*Math.sin(t/19),vx=8*Math.cos(th),vy=8*Math.sin(th),tx=8*integral(t,0),ty=8*integral(t,1);
 const outage=t>=20&&t<=100,gnss=!(outage&&['outage','blind','link'].includes(mode)),camera=!(mode==='blind'&&outage),linked=!(mode==='link'&&t>=40&&t<=80);
 if(i){const turn=(th-(.55*Math.sin((t-.2)/19)))+.00045;head+=turn;x+=8.08*Math.cos(head)*.2;y+=8.08*Math.sin(head)*.2;dh+=turn;dx+=8.08*Math.cos(dh)*.2;dy+=8.08*Math.sin(dh)*.2;p+=.065;}
 let source='IMU + одометрия',reject=false;
 if(gnss){let gx=tx+.4*Math.sin(t*1.7),gy=ty+.4*Math.cos(t*1.3);if(mode==='spoof'&&outage){gx+=80;gy-=60;} const d=Math.hypot(gx-x,gy-y);if(d<Math.max(5,4*Math.sqrt(p+.25))){const k=p/(p+.25);x+=k*(gx-x);y+=k*(gy-y);p*=1-k;source='GNSS';}else{reject=true;rejected++;}}
 if(camera&&i%50===0){const mx=tx+.2*Math.sin(t),my=ty+.2*Math.cos(t);const k=p/(p+.04);x+=k*(mx-x);y+=k*(my-y);p*=1-k;head=th;source='Ориентир';}
 if(t<20||t>100){dx=x;dy=y;dh=head;}
 const sigma=Math.sqrt(p),valid=2*sigma<=5;
 if(linked)lastITS={t,x,y};
 rows.push({t:+t.toFixed(1),tx,ty,x,y,dx,dy,error:Math.hypot(x-tx,y-ty),deadError:Math.hypot(dx-tx,dy-ty),sigma,valid,source,reject,linked,age:t-lastITS.t,itsX:lastITS.x,itsY:lastITS.y});
 }
 const selected=rows.filter(r=>r.t>=20&&r.t<=100),rms=a=>Math.sqrt(a.reduce((s,r)=>s+r*r,0)/a.length);
 return {mode,rows,metrics:{rmse:rms(selected.map(r=>r.error)),max:Math.max(...selected.map(r=>r.error)),deadRmse:rms(selected.map(r=>r.deadError)),rejected,invalid:rows.filter(r=>!r.valid).length,maxAge:Math.max(...rows.map(r=>r.age))}};
}
// Numerical reference integration independent of the estimator, 20 ms steps.
function integral(t,axis){let s=0;const n=Math.round(t/.02);for(let j=0;j<n;j++){const a=.55*Math.sin((j+.5)*.02/19);s+=(axis?Math.sin(a):Math.cos(a))*.02;}return s;}
const api={run,scenarios};if(typeof module!=='undefined')module.exports=api;root.GNSS=api;
})(typeof window!=='undefined'?window:globalThis);
