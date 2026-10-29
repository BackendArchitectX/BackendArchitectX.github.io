/* Articulated procedural action rig for the existing textured Pawny asset. */
function createCompanionActionRig(T,model){
  const {mesh,body,head,root,detail}=model,g=mesh.geometry,p=g.attributes.position;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const bones=[body,head],joints={};
  function bone(name,parent,x,y,z){const b=new T.Bone();b.name=name;parent.add(b);b.position.set(x,y,z);bones.push(b);joints[name]=b;return b;}
  const torso=bone('Torso',body,0,-.245,0);
  torso.attach(head);
  const left=bone('Arm.L',torso,.158,.191,.015),leftElbow=bone('Elbow.L',left,.020,-.142,.008),leftWrist=bone('Wrist.L',leftElbow,.004,-.121,.002);
  const right=bone('Arm.R',torso,-.155,.191,.015),rightElbow=bone('Elbow.R',right,-.020,-.137,.020),rightWrist=bone('Wrist.R',rightElbow,.164,.080,.141);
  const legL=bone('Leg.L',body,.072,-.271,0),kneeL=bone('Knee.L',legL,.023,-.117,.005);
  const legR=bone('Leg.R',body,-.072,-.271,0),kneeR=bone('Knee.R',legR,-.023,-.117,.005);
  root.updateMatrixWorld(true);
  // Attach replacement hands without changing their rest-space coordinates.
  leftWrist.attach(detail.leftHand);rightWrist.attach(detail.hand);
  const oldWeight=g.attributes.skinWeight,weights=[],indices=[],index=b=>bones.indexOf(b);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),headWeight=oldWeight.getY(i);
    let list=[];
    if(headWeight>.98)list=[[head,1]];
    else if(y<-.275&&!(x>.14&&y>-.390)){const upper=x>0?legL:legR,lower=x>0?kneeL:kneeR,k=smooth((-.350-y)/.060),hip=smooth((-.268-y)/.045);list=[[body,1-hip],[upper,hip*(1-k)],[lower,hip*k]];}
    else{
      // Broad shoulder falloffs keep the chest and armour joined while bending.
      const l=smooth((x-.119)/.045)*smooth((-.025-y)/.05);
      const r=smooth((-x-.116)/.043)*smooth((-.025-y)/.05);
      const forearm=smooth((z-.090)/.060)*smooth((-.055-y)/.035)*smooth((y+.220)/.055);
      if(l>.01){const k=smooth((-.171-y)/.055);const w=smooth((-.292-y)/.045);list=[[torso,1-l],[left,l*(1-k)],[leftElbow,l*k*(1-w)],[leftWrist,l*k*w]];}
      else if(r>.01||forearm>.01){const a=Math.max(r,forearm),k=Math.max(forearm,smooth((-.148-y)/.060));list=[[torso,1-a],[right,a*(1-k)],[rightElbow,a*k]];}
      else list=[[torso,1-headWeight],[head,headWeight]];
      if(headWeight>.01&&(l>.01||r>.01||forearm>.01))list=list.map(([b,w])=>[b,w*(1-headWeight)]).concat([[head,headWeight]]);
    }
    list=list.filter(v=>v[1]>.0001).sort((a,b)=>b[1]-a[1]).slice(0,4);const total=list.reduce((s,v)=>s+v[1],0);
    for(let k=0;k<4;k++){indices.push(list[k]?index(list[k][0]):0);weights.push(list[k]?list[k][1]/total:0);}
  }
  // Retire residual fused hand/leg bridge faces behind the replacement hand.
  // The source scan joins a few fingertips to the adjacent greave; they cannot bend with the wrist.
  const sourceIndex=g.index?g.index.array:[],kept=[],groups=[];
  for(const group of g.groups){const start=kept.length;for(let k=group.start;k<group.start+group.count;k+=3){const ids=[sourceIndex[k],sourceIndex[k+1],sourceIndex[k+2]],x=ids.reduce((s,i)=>s+p.getX(i),0)/3,y=ids.reduce((s,i)=>s+p.getY(i),0)/3,z=ids.reduce((s,i)=>s+p.getZ(i),0)/3;if(x>.130&&x<.225&&y<-.295&&y>-.435&&z>-.035)continue;kept.push(...ids);}if(kept.length>start)groups.push({start,count:kept.length-start,materialIndex:group.materialIndex});}
  if(g.groups.length){g.setIndex(kept);g.clearGroups();for(const group of groups)g.addGroup(group.start,group.count,group.materialIndex);}
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  mesh.bind(new T.Skeleton(bones));mesh.userData.articulated=true;
  const weapon=new T.Group();weapon.name='PawnyWeapon';leftWrist.add(weapon);weapon.position.set(0,-.012,.018);
  const bronze=new T.MeshStandardMaterial({color:0xb97348,metalness:.8,roughness:.3});
  const dark=new T.MeshStandardMaterial({color:0x222b31,metalness:.7,roughness:.4});
  const steel=new T.MeshStandardMaterial({color:0xc7e5f2,metalness:.9,roughness:.19,emissive:0x104458,emissiveIntensity:.3});
  function part(parent,geometry,material,pos){const m=new T.Mesh(geometry,material);m.position.set(...pos);m.castShadow=true;parent.add(m);return m;}
  const sword=new T.Group();weapon.add(sword);
  part(sword,new T.CylinderGeometry(.010,.012,.085,12),dark,[0,0,0]);
  part(sword,new T.BoxGeometry(.105,.018,.027),bronze,[0,.048,0]);
  const shape=new T.Shape();shape.moveTo(-.021,.054);shape.lineTo(-.016,.34);shape.lineTo(0,.410);shape.lineTo(.016,.34);shape.lineTo(.021,.054);shape.closePath();
  const blade=part(sword,new T.ExtrudeGeometry(shape,{depth:.009,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:1}),steel,[0,0,-.0045]);blade.name='SwordBlade';
  const blaster=new T.Group();weapon.add(blaster);
  part(blaster,new T.BoxGeometry(.046,.065,.037),dark,[0,-.009,0]);
  part(blaster,new T.BoxGeometry(.055,.042,.13),bronze,[0,.028,.038]);
  const barrel=part(blaster,new T.CylinderGeometry(.018,.020,.11,16),dark,[0,.028,.125]);barrel.rotation.x=Math.PI/2;
  const muzzle=new T.Object3D();muzzle.position.set(0,.028,.19);blaster.add(muzzle);
  const flash=part(blaster,new T.SphereGeometry(.034,12,8),new T.MeshBasicMaterial({color:0x9df4ff}),[0,.028,.195]);
  const bolt=part(root,new T.SphereGeometry(.013,10,6),new T.MeshBasicMaterial({color:0x7ee9ff}),[0,0,0]);bolt.scale.set(1,1,4);
  const rest=bones.map(b=>b.position.clone()),origin=new T.Vector3(),destination=new T.Vector3();
  let selectedMode='sword',mode='sword',phase='idle',phaseAt=0,near=false,armed=true,showAt=12,auto=true,forced=false,lastNow=0;
  const duration={warning:1.25,draw:.8,strike:.85,recover:1.15,cooldown:1.8};
  function enter(next,now){phase=next;phaseAt=now;}
  function trigger(now,manual=false){if(!['idle','cooldown'].includes(phase))return;mode=selectedMode;forced=manual;enter('warning',now);armed=false;}
  function setNear(value,now){near=value;if(!near)armed=true;else if(armed&&phase==='idle')trigger(now);}
  function setMode(value){selectedMode=value==='blaster'?'blaster':'sword';if(phase==='idle')mode=selectedMode;}
  function update(now,{idle=true,target,dt=1/60}={}){
    if(!lastNow){showAt=now+7;phaseAt=now;}lastNow=now;
    if(phase==='idle'&&idle&&auto&&now>=showAt)trigger(now,true);
    let t=now-phaseAt;
    if(phase!=='idle'&&t>duration[phase]){
      if(phase==='warning'&&!near&&!forced){enter('recover',now);}
      else enter(({warning:'draw',draw:'strike',strike:'recover',recover:'cooldown',cooldown:'idle'})[phase],now);
      t=0;if(phase==='idle'){showAt=now+12;if(near&&armed)trigger(now);}
    }
    // Reset joint transforms each frame; animation is deterministic and never accumulates.
    bones.forEach((b,i)=>{if(b!==head){b.rotation.set(0,0,0);b.position.copy(rest[i]);}});
    const breath=idle?Math.sin(now*2.1):0,sway=idle?Math.sin(now*1.15):0;
    torso.rotation.z=.013*sway;torso.rotation.x=.012*breath;torso.position.y+=.0018*breath;
    left.rotation.x=.025*breath;right.rotation.z=.018*sway;legL.rotation.z=-.013*sway;legR.rotation.z=-.013*sway;
    const warn=phase==='warning'?smooth(t/.25):0;
    let ready=phase==='draw'?smooth(t/duration.draw):phase==='strike'?1:phase==='recover'?1-smooth(t/duration.recover):0;
    const attack=phase==='strike'?Math.sin(Math.PI*smooth(t/duration.strike)):0;
    const direction=target?clamp(target.x,-1,1):.25;
    torso.rotation.y+=direction*(warn*.10+ready*.18);torso.rotation.x+=ready*.045+attack*.08;
    body.position.y-=.008*ready+.012*attack;
    legL.rotation.z-=.09*ready;legR.rotation.z+=.09*ready;kneeL.rotation.x-=.08*ready;kneeR.rotation.x-=.04*ready;
    // The bent right arm raises a warning/guard; the hanging left arm draws the weapon.
    right.rotation.z-=.16*warn+.09*ready;rightElbow.rotation.y-=.16*warn;
    left.rotation.x=-(mode==='blaster'?1.25:1.65)*ready;
    left.rotation.z=-.16*ready+(mode==='sword'?.55*attack:0);
    leftElbow.rotation.x=-.18*ready-(mode==='sword'?.32*attack:0);
    leftWrist.rotation.x=mode==='sword'?1.3*ready:0;
    leftWrist.rotation.z=mode==='sword'?(-.25*ready+1.3*attack):0;
    torso.rotation.y+=mode==='sword'?-.26*attack:0;
    weapon.rotation.set(mode==='sword'?.25:0,0,mode==='sword'?-.15:0);
    weapon.visible=ready>.02;sword.visible=mode==='sword';blaster.visible=mode==='blaster';flash.visible=false;bolt.visible=false;
    root.updateMatrixWorld(true);mesh.skeleton.update();
    if(mode==='blaster'&&phase==='strike'){
      // Aim from the articulated wrist toward the cursor on the front plane.
      muzzle.getWorldPosition(origin);destination.copy(target||new T.Vector3(.6,.2,2));
      weapon.lookAt(destination);root.updateMatrixWorld(true);
      const pulse=Math.floor(t/.24),elapsed=t-pulse*.24;
      flash.visible=elapsed<.065;
      if(elapsed<.12){muzzle.getWorldPosition(origin);root.worldToLocal(origin);destination.copy(target||new T.Vector3(.6,.2,2));root.worldToLocal(destination);bolt.position.lerpVectors(origin,destination,clamp(elapsed/.12));bolt.lookAt(target||new T.Vector3(.6,.2,2));bolt.visible=true;}
      left.rotation.x+=.065*Math.exp(-elapsed*28);root.updateMatrixWorld(true);mesh.skeleton.update();
    }
    return {phase,mode,ready,warning:warn,attack,joints:bones.length+2,label:phase==='warning'?'Easy there. Give me a little room.':phase==='draw'?(mode==='sword'?'Drawing sword…':'Blaster ready.'):phase==='strike'?(mode==='sword'?'A little sword practice.':'Pew! Pew!'):phase==='recover'?'All clear.':phase==='cooldown'?'Back on watch.':'Keeping watch.'};
  }
  return {update,setNear,setMode,trigger,get phase(){return phase;},setAuto(v){auto=v;},bones};
}
