/* A procedural articulated model. All visible character parts are 3D meshes. */
function createCompanionModel(T, options = {}) {
  const detail = options.detail || 1;
  const root = new T.Group();
  root.name = 'CopperCapCompanion';
  const refs = { root, eyes: [], lids: [], brows: [], strands: [], arms: [], legs: [] };
  const sphere = new T.SphereGeometry(1, detail > 1 ? 48 : 24, detail > 1 ? 32 : 16);
  const smallSphere = new T.SphereGeometry(1, 12, 8);
  const materials = {
    face: new T.MeshStandardMaterial({ color: '#939b6b', roughness: .68, metalness: .17 }),
    faceLight: new T.MeshStandardMaterial({ color: '#b2b78a', roughness: .66, metalness: .12 }),
    joint: new T.MeshStandardMaterial({ color: '#323c33', roughness: .56, metalness: .65 }),
    bronze: new T.MeshStandardMaterial({ color: '#9d7748', roughness: .39, metalness: .72 }),
    edge: new T.MeshStandardMaterial({ color: '#825e42', roughness: .5, metalness: .55 }),
    mouth: new T.MeshStandardMaterial({ color: '#3e4930', roughness: .72, metalness: .1 }),
    eye: new T.MeshPhysicalMaterial({ color: '#090e0b', roughness: .075, metalness: .06, clearcoat: 1, clearcoatRoughness: .03 }),
    iris: new T.MeshStandardMaterial({ color: '#c08a28', roughness: .28, metalness: .6 }),
    irisLight: new T.MeshStandardMaterial({ color: '#ebbc50', roughness: .32, metalness: .45 }),
    pupil: new T.MeshPhysicalMaterial({ color: '#030706', roughness: .06, clearcoat: 1, clearcoatRoughness: .02 }),
    glint: new T.MeshBasicMaterial({ color: '#fff5d7' }),
    led: new T.MeshStandardMaterial({ color: '#a7d8eb', emissive: '#5da9d9', emissiveIntensity: .7, roughness: .3 }),
    red: ['#a74c3c','#b65a43','#a14738','#bc6149'].map(color => new T.MeshStandardMaterial({ color, roughness: .51, metalness: .39 }))
  };
  refs.materials = materials;
  if (options.createCanvas) {
    const canvas=options.createCanvas(128,128), ctx=canvas.getContext('2d');
    ctx.fillStyle='#f1f1f1';ctx.fillRect(0,0,128,128);
    let seed=1639;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<1700;i++) {const v=170+Math.floor(random()*80);ctx.fillStyle='rgba('+v+','+v+','+v+','+(.05+random()*.15)+')';ctx.fillRect(random()*128,random()*128,1+random()*1.5,1+random()*1.5);}
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
    materials.red.forEach(m=>{m.map=texture;});
    materials.face.bumpMap=texture;materials.face.bumpScale=.008;
  }
  function mesh(parent, geometry, material, position, scale) {
    const m=new T.Mesh(geometry,material);if(position)m.position.set(...position);if(scale)m.scale.set(...scale);
    m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function ball(parent,material,pos,scale,tiny=false){return mesh(parent,tiny?smallSphere:sphere,material,pos,scale);}
  function capsule(parent,material,a,b,radius){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),length=start.distanceTo(end);
    const g=new T.CapsuleGeometry(radius,Math.max(.001,length-radius*2),4,detail>1?16:8);
    const m=mesh(parent,g,material,start.clone().add(end).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return m;
  }
  function tube(parent,material,points,radius=.015){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,radius,6,false),material);}
  function shield(width,height,depth=.035){
    const s=new T.Shape();
    s.moveTo(-width*.42,height*.48);s.quadraticCurveTo(-width*.5,height*.48,-width*.5,height*.37);
    s.lineTo(-width*.47,-height*.29);s.quadraticCurveTo(-width*.2,-height*.49,0,-height*.52);
    s.quadraticCurveTo(width*.2,-height*.49,width*.47,-height*.29);s.lineTo(width*.5,height*.37);
    s.quadraticCurveTo(width*.5,height*.48,width*.42,height*.48);s.closePath();
    return new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.013,bevelThickness:.012,curveSegments:5});
  }
  const torso=new T.Group();root.add(torso);refs.torso=torso;
  ball(torso,materials.joint,[0,-.03,0],[.40,.48,.27]);
  for(const side of [-1,1]){
    const plate=mesh(torso,shield(.34,.68),[materials.red[side<0?0:1],materials.edge],[side*.19,.025,.23]);
    plate.rotation.z=side*-.055;plate.rotation.y=side*.1;
    const back=mesh(torso,shield(.34,.68),[materials.red[2],materials.edge],[side*.19,.025,-.24]);back.rotation.y=Math.PI;
    ball(torso,materials.led,[side*.21,.13,.291],[.032,.032,.017],true);
    ball(torso,materials.bronze,[side*.30,.29,.267],[.018,.018,.012],true);
  }
  ball(torso,materials.red[0],[0,-.39,.005],[.31,.22,.25]);
  mesh(torso,shield(.42,.29),[materials.red[3],materials.edge],[0,-.42,.21]);
  capsule(torso,materials.joint,[0,.31,0],[0,.49,0],.12);
  for(const y of [.365,.408])mesh(torso,new T.TorusGeometry(.126,.014,6,24),materials.bronze,[0,y,0]).rotation.x=Math.PI/2;

  const head=new T.Group();head.position.y=.40;root.add(head);refs.head=head;
  ball(head,materials.face,[0,.63,0],[.88,.79,.67]);
  for(const side of [-1,1]){
    ball(head,materials.face,[side*.45,.35,.42],[.28,.23,.20]);
    const socket=new T.Group();socket.position.set(side*.40,.72,.55);head.add(socket);
    mesh(socket,new T.TorusGeometry(.327,.035,detail>1?12:8,detail>1?48:24),materials.bronze,[0,0,.105]);
    const gaze=new T.Group();socket.add(gaze);
    ball(gaze,materials.eye,[0,0,0],[.322,.322,.322]);
    mesh(gaze,new T.TorusGeometry(.205,.038,12,detail>1?48:24),materials.iris,[0,0,.266]);
    for(let i=0;i<28;i++){
      const a=i/28*Math.PI*2;
      const ray=mesh(gaze,new T.BoxGeometry(.009,.058,.008),i%3===0?materials.irisLight:materials.iris,[Math.sin(a)*.202,Math.cos(a)*.202,.298]);ray.rotation.z=-a;
    }
    ball(gaze,materials.pupil,[0,0,.287],[.143,.143,.041]);
    ball(gaze,materials.glint,[-.084,.094,.316],[.037,.045,.013],true);
    ball(gaze,materials.glint,[.065,-.063,.318],[.014,.017,.006],true);
    const top=mesh(socket,new T.SphereGeometry(.337,detail>1?40:20,detail>1?20:10,0,Math.PI*2,0,Math.PI/2),materials.face);
    const bottom=mesh(socket,new T.SphereGeometry(.338,detail>1?40:20,detail>1?20:10,0,Math.PI*2,Math.PI/2,Math.PI/2),materials.face);
    top.rotation.x=-Math.PI/2;bottom.rotation.x=Math.PI/2;
    refs.eyes.push({socket,gaze});refs.lids.push({top,bottom});
    const brow=tube(socket,materials.face,[[ -.25,.25,.12 ],[0,.35,.16],[ .25,.25,.12 ]],.033);refs.brows.push(brow);
    for(let i=0;i<3;i++){
      const x=side*(.33+i*.075), y=.35-(i%2)*.045;
      ball(head,materials.faceLight,[x,y,.60-i*.015],[.014,.014,.008],true);
    }
  }
  ball(head,materials.face,[0,.43,.655],[.090,.052,.067]);
  refs.smile=tube(head,materials.mouth,[[-.16,.285,.611],[-.095,.24,.651],[0,.225,.664],[.095,.24,.651],[.16,.285,.611]],.013);
  for(const side of [-1,1])ball(head,materials.faceLight,[side*.177,.286,.602],[.025,.024,.014],true);

  const cap=new T.Group();head.add(cap);refs.cap=cap;
  const profile=[[.92,1.03],[.82,1.29],[.64,1.54],[.40,1.79],[.12,1.99],[0,2.08]].map(([r,y])=>new T.Vector2(r,y));
  mesh(cap,new T.LatheGeometry(profile,detail>1?64:32),materials.joint);
  const rows=[{lo:1.04,hi:1.35,r0:.94,r1:.79,n:10},{lo:1.30,hi:1.61,r0:.82,r1:.60,n:9},{lo:1.56,hi:1.85,r0:.64,r1:.34,n:7},{lo:1.80,hi:2.04,r0:.38,r1:.075,n:5}];
  rows.forEach((row,j)=>{
    const radius=(row.r0+row.r1)/2;
    const width=radius*Math.PI*2/row.n-.022;
    const height=Math.hypot(row.hi-row.lo,row.r0-row.r1)*1.08;
    const geo=shield(width,height,.032);
    for(let i=0;i<row.n;i++){
      const theta=i/row.n*Math.PI*2+(j%2?Math.PI/row.n:0);
      const mount=new T.Group();mount.position.set(Math.sin(theta)*radius,(row.lo+row.hi)/2,Math.cos(theta)*radius);mount.rotation.y=theta;cap.add(mount);
      const tile=mesh(mount,geo,[materials.red[(i+j)%4],materials.edge]);tile.rotation.x=-Math.atan2(row.r0-row.r1,row.hi-row.lo);
      for(const sx of [-1,1])ball(tile,materials.bronze,[sx*width*.30,-height*.25,.058],[.014,.014,.010],true);
    }
  });
  ball(cap,materials.red[1],[0,2.055,0],[.105,.105,.105]);
  for(const side of [-1,1]){
    const flap=mesh(head,shield(.36,.52),[materials.red[2],materials.edge],[side*.84,.82,-.025]);flap.rotation.y=side*Math.PI/2;flap.rotation.z=side*.18;
    for(let i=0;i<3;i++){
      const strand=new T.Group();strand.position.set(side*(.79+i*.018),.55,-.15+i*.13);head.add(strand);
      const length=.45+(i===1?.18:0);
      capsule(strand,materials.face,[0,0,0],[side*.04,-length,0],.045);
      for(const u of [.45,.75])mesh(strand,new T.TorusGeometry(.047,.009,6,12),materials.bronze,[side*.04*u,-length*u,0]).rotation.x=Math.PI/2;
      refs.strands.push({node:strand,side,phase:i});
    }
  }

  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.445,.20,0);torso.add(arm);
    ball(arm,materials.joint,[0,0,0],[.12,.12,.12]);
    ball(arm,materials.red[0],[side*.018,.01,.012],[.165,.13,.17]);
    capsule(arm,materials.face,[0,-.08,0],[side*.06,-.33,.01],.076);
    const elbow=new T.Group();elbow.position.set(side*.06,-.32,.01);arm.add(elbow);
    ball(elbow,materials.joint,[0,0,0],[.091,.091,.091]);
    capsule(elbow,materials.red[side<0?2:1],[0,-.055,0],[0,-.29,.025],.102);
    mesh(elbow,new T.TorusGeometry(.096,.015,6,18),materials.bronze,[0,-.29,.025]).rotation.x=Math.PI/2;
    const hand=new T.Group();hand.position.set(0,-.39,.035);elbow.add(hand);
    ball(hand,materials.face,[0,0,0],[.114,.115,.076]);
    for(let i=0;i<3;i++)capsule(hand,materials.face,[-.064+i*.064,-.065,.035],[-.064+i*.064,-.18,.055],.028);
    capsule(hand,materials.face,[side*.085,.015,.015],[side*.15,-.07,.045],.032);
    refs.arms.push({node:arm,elbow,hand,side});
    const leg=new T.Group();leg.position.set(side*.19,-.49,0);root.add(leg);
    ball(leg,materials.joint,[0,-.04,0],[.095,.095,.095]);
    capsule(leg,materials.red[side<0?0:1],[0,-.07,0],[0,-.28,0],.115);
    ball(leg,materials.joint,[0,-.31,0],[.086,.086,.086]);
    capsule(leg,materials.red[2],[0,-.33,0],[0,-.48,.015],.092);
    ball(leg,materials.red[1],[0,-.56,.09],[.148,.105,.215]);
    ball(leg,materials.bronze,[0,-.625,.09],[.15,.026,.215]);
    refs.legs.push({node:leg,side});
  }
  root.traverse(node=>{if(node.isMesh){node.userData.characterPart=true;}});
  return refs;
}

function poseCompanionModel(T, model, state) {
  const t=state.time||0, idle=state.idle!==false;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  const hop=t-(state.hopAt??-100), wave=t-(state.waveAt??-100), spin=t-(state.spinAt??-100);
  let lift=0, sx=1, sy=1;
  if(hop>=0&&hop<.95){
    if(hop<.16){const c=Math.sin(hop/.16*Math.PI);sy=1-.05*c;sx=1+.03*c;lift=-.035*c;}
    else if(hop<.78){const p=(hop-.16)/.62;lift=.43*4*p*(1-p);}
    else {const c=Math.sin((hop-.78)/.17*Math.PI);sy=1-.04*c;sx=1+.02*c;}
  }
  model.root.position.y=lift+(idle?Math.sin(t*2)*.012:0);
  model.root.scale.set(sx,sy,sx);
  const spinning=spin>=0&&spin<2.7;
  model.root.rotation.y=-.08+(spinning?ease(spin/2.7)*Math.PI*2:0);
  const target=state.target||new T.Vector3(0,1.12,4);
  model.root.updateMatrixWorld(true);
  const local=model.root.worldToLocal(target.clone());
  let yaw=clamp(Math.atan2(local.x,local.z),-.49,.49);
  let pitch=clamp(-Math.atan2(local.y-1.12,Math.hypot(local.x,local.z)),-.29,.29);
  if(spinning){yaw=0;pitch=0;}
  model.head.rotation.set(pitch,yaw,-yaw*.13+(idle&&!state.pointer?Math.sin(t*.8)*.018:0),'YXZ');
  model.torso.rotation.z=-yaw*.035;
  model.root.updateMatrixWorld(true);
  const gaze=[];
  for(const eye of model.eyes){
    const v=eye.socket.worldToLocal(target.clone());
    const ey=spinning?0:clamp(Math.atan2(v.x,v.z),-.26,.26);
    const ex=spinning?0:clamp(-Math.atan2(v.y,Math.hypot(v.x,v.z)),-.23,.23);
    eye.gaze.rotation.set(ex,ey,0,'YXZ');gaze.push({x:ex,y:ey});
  }
  const blinkPhase=t%4.4;
  const blink=idle&&blinkPhase>3.25&&blinkPhase<3.51?Math.sin((blinkPhase-3.25)/.26*Math.PI):0;
  for(const lid of model.lids){lid.top.rotation.x=-Math.PI/2*(1-blink);lid.bottom.rotation.x=Math.PI/2*(1-blink);}
  for(const brow of model.brows)brow.position.y=(hop>=0&&hop<.95?.035:0)+Math.abs(yaw)*.04;
  model.smile.scale.x=hop>=0&&hop<.95?1.1:1;
  let waveAngle=0;
  if(wave>=0&&wave<1.85){
    if(wave<.3)waveAngle=2.45*ease(wave/.3);
    else if(wave<1.35)waveAngle=2.45+Math.sin((wave-.3)*Math.PI*6)*.18;
    else waveAngle=2.45*(1-ease((wave-1.35)/.5));
  }
  for(const arm of model.arms){
    arm.node.rotation.z=arm.side>0?waveAngle+.08:-.08;
    arm.node.rotation.x=idle?Math.sin(t*1.4+arm.side)*.035:0;
    arm.elbow.rotation.z=arm.side>0?-.12*Math.sin(waveAngle):.06;
    arm.hand.rotation.y=arm.side>0?waveAngle*.16:0;
  }
  for(const leg of model.legs)leg.node.rotation.z=leg.side*(1-sy)*1.2;
  for(const strand of model.strands)strand.node.rotation.z=-yaw*.12+(idle?Math.sin(t*1.8+strand.phase)*.013:0);
  model.root.updateMatrixWorld(true);
  return {yaw,pitch,gaze,blink,hop:hop>=0&&hop<.95,wave:wave>=0&&wave<1.85,spin:spinning};
}

if(typeof module!=='undefined'&&module.exports)module.exports={createCompanionModel,poseCompanionModel};
