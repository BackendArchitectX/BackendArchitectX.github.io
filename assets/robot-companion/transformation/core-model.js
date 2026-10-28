/* Articulated, textured geometry. No character images or billboards. */
function createCompanionModel(T, options = {}) {
  const detail=options.detail||1, high=detail>1;
  const root=new T.Group();root.name='CopperCapCompanion';
  const refs={root,eyes:[],lids:[],brows:[],strands:[],arms:[],legs:[]};
  const sphere=new T.SphereGeometry(1,high?56:32,high?36:20);
  const smallSphere=new T.SphereGeometry(1,12,8);
  let seed=1639;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function canvas(w,h){return options.createCanvas?options.createCanvas(w,h):null;}
  function canvasTexture(c,color=true){const t=new T.CanvasTexture(c);if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
  function textureSet(col,row){
    if(!options.atlasImage||!options.createCanvas)return {};
    const c=canvas(512,512),ctx=c.getContext('2d'),img=options.atlasImage;
    ctx.drawImage(img,col*img.width/2,row*img.height/2,img.width/2,img.height/2,0,0,512,512);
    const map=canvasTexture(c),pixels=ctx.getImageData(0,0,512,512);
    map.userData.pixels={data:pixels.data,width:512,height:512};
    const rough=canvas(512,512),rctx=rough.getContext('2d'),data=rctx.createImageData(512,512);
    for(let i=0;i<data.data.length;i+=4){const v=170+pixels.data[i]*.22;data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;}
    rctx.putImageData(data,0,0);
    const roughnessMap=canvasTexture(rough,false),bumpMap=canvasTexture(c,false);
    return {map,roughnessMap,bumpMap};
  }
  const olive=textureSet(0,0),red=textureSet(1,0),brass=textureSet(0,1),rubber=textureSet(1,1);
  const materials={
    face:new T.MeshStandardMaterial({color:olive.map?'#e2e8ce':'#777955',...olive,roughness:.80,metalness:.30,bumpScale:.013,envMapIntensity:.65}),
    joint:new T.MeshStandardMaterial({color:rubber.map?'#a3a6a0':'#272923',...rubber,roughness:.86,metalness:.20,bumpScale:.007}),
    bronze:new T.MeshStandardMaterial({color:brass.map?'#c6bca7':'#806b43',...brass,roughness:.59,metalness:.78,bumpScale:.005}),
    edge:new T.MeshStandardMaterial({color:brass.map?'#8a8070':'#685841',...brass,roughness:.70,metalness:.58,bumpScale:.006}),
    mouth:new T.MeshStandardMaterial({color:'#252a1b',roughness:.94,metalness:.05}),
    eye:new T.MeshPhysicalMaterial({color:'#17150d',roughness:.13,metalness:0,clearcoat:1,clearcoatRoughness:.035,envMapIntensity:1.4}),
    pupil:new T.MeshPhysicalMaterial({color:'#070a08',roughness:.065,metalness:0,clearcoat:1,clearcoatRoughness:.025,envMapIntensity:1.65}),
    glint:new T.MeshBasicMaterial({color:'#e8e5cf',transparent:true,opacity:.70}),
    led:new T.MeshStandardMaterial({color:'#8cb7c1',emissive:'#4e9bc6',emissiveIntensity:.45,roughness:.4}),
    red:['#ded2c5','#cfc1b2','#e1d3c4','#b9b1a5'].map(color=>new T.MeshStandardMaterial({color:red.map?color:'#883b2e',...red,roughness:.65,metalness:.43,bumpScale:.009,envMapIntensity:.8}))
  };
  materials.faceLight=materials.face;refs.materials=materials;
  function mesh(parent,g,material,position,scale){const m=new T.Mesh(g,material);if(position)m.position.set(...position);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function ball(parent,material,pos,scale,tiny=false){return mesh(parent,tiny?smallSphere:sphere,material,pos,scale);}
  function capsule(parent,material,a,b,radius){const start=new T.Vector3(...a),end=new T.Vector3(...b),length=start.distanceTo(end);const m=mesh(parent,new T.CapsuleGeometry(radius,Math.max(.001,length-radius*2),4,high?16:10),material,start.clone().add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return m;}
  function tube(parent,material,points,radius=.012){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),high?28:18,radius,6,false),material);}
  function shield(width,height,depth=.024){
    const s=new T.Shape();s.moveTo(-width*.37,height*.48);s.quadraticCurveTo(-width*.50,height*.48,-width*.50,height*.31);s.lineTo(-width*.48,-height*.28);s.quadraticCurveTo(-width*.32,-height*.46,-width*.08,-height*.50);s.quadraticCurveTo(width*.23,-height*.51,width*.48,-height*.28);s.lineTo(width*.5,height*.30);s.quadraticCurveTo(width*.50,height*.47,width*.35,height*.48);s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.009,bevelThickness:.008,curveSegments:high?7:4});
    const uv=g.attributes.uv,p=g.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/width+.5,p.getY(i)/height+.5);return g;
  }
  function aoGeometry(g,amount){const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const a=amount(p.getX(i),p.getY(i),p.getZ(i));c.push(a,a,a);}g.setAttribute('color',new T.Float32BufferAttribute(c,3));return g;}
  function agedClone(m){const n=m.clone();n.vertexColors=true;return n;}
  const torso=new T.Group();root.add(torso);refs.torso=torso;
  ball(torso,materials.joint,[0,-.05,0],[.39,.48,.28]);
  for(const side of [-1,1]){
    for(const front of [1,-1]){
      const g=shield(.35,.67,.025),p=g.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,p.getZ(i)+.050*(1-Math.pow(x/.19,2))+.035*(1-Math.pow(y/.35,2)));}g.computeVertexNormals();
      const plate=mesh(torso,g,[materials.red[side<0?0:1],materials.edge],[side*.175,.015,front*.235]);plate.rotation.y=front<0?Math.PI:side*.10;plate.rotation.z=side*-.07;
    }
    ball(torso,materials.led,[side*.18,.13,.317],[.013,.022,.008],true);
    for(const y of [.26,-.23])ball(torso,materials.bronze,[side*.27,y,.285],[.015,.015,.009],true);
  }
  ball(torso,materials.red[2],[0,-.37,0],[.30,.23,.26]);
  const belt=mesh(torso,new T.TorusGeometry(.28,.018,6,32),materials.edge,[0,-.30,0],[1,.85,1]);belt.rotation.x=Math.PI/2;
  mesh(torso,shield(.31,.27),[materials.red[1],materials.edge],[0,-.42,.24]);
  capsule(torso,materials.joint,[0,.29,0],[0,.48,0],.115);
  for(const y of [.35,.39,.43])mesh(torso,new T.TorusGeometry(.117,.012,6,24),materials.bronze,[0,y,0]).rotation.x=Math.PI/2;

  const head=new T.Group();head.position.y=.40;root.add(head);refs.head=head;
  const faceGeo=new T.SphereGeometry(1,high?96:56,high?64:36),fp=faceGeo.attributes.position;
  for(let i=0;i<fp.count;i++){
    let x=fp.getX(i)*.86,y=.65+fp.getY(i)*.72,z=fp.getZ(i)*.64;
    if(z>0){
      const front=Math.pow(z/.64,3),cheek=Math.exp(-Math.pow((Math.abs(x)-.48)/.23,2)-Math.pow((y-.43)/.25,2));
      const recess=Math.exp(-Math.pow((Math.abs(x)-.375)/.245,2)-Math.pow((y-.79)/.235,2));
      z+=front*(.045*cheek-.085*recess+.023*Math.exp(-x*x/.10-(y-.34)*(y-.34)/.08));
    }
    if(y<.18)y=.18+(y-.18)*.73;
    fp.setXYZ(i,x,y,z);
  }
  faceGeo.computeVertexNormals();aoGeometry(faceGeo,(x,y,z)=>{const eye=Math.exp(-Math.pow((Math.abs(x)-.375)/.27,2)-Math.pow((y-.79)/.25,2));return Math.max(.48,1-.25*eye*(z>.20?1:0)-.22*Math.max(0,(y-1.03)/.25)-.14*Math.max(0,.24-y));});
  mesh(head,faceGeo,agedClone(materials.face));

  let irisMaterial=new T.MeshStandardMaterial({color:'#8d642c',roughness:.31,metalness:0,envMapIntensity:.5});
  if(options.createCanvas){
    const c=canvas(512,512),ctx=c.getContext('2d'),center=256;
    ctx.fillStyle='#292112';ctx.fillRect(0,0,512,512);
    const grad=ctx.createRadialGradient(center,center,80,center,center,250);grad.addColorStop(0,'#745322');grad.addColorStop(.28,'#b48b40');grad.addColorStop(.72,'#786028');grad.addColorStop(1,'#272717');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(center,center,251,0,Math.PI*2);ctx.fill();
    for(let i=0;i<2800;i++){const a=random()*Math.PI*2,r=94+random()*145,end=Math.min(248,r+15+random()*72);ctx.strokeStyle=i%3?'rgba(37,31,13,'+(.12+random()*.30)+')':'rgba(212,172,86,'+(.15+random()*.25)+')';ctx.lineWidth=.35+random()*1.25;ctx.beginPath();ctx.moveTo(center+Math.cos(a)*r,center+Math.sin(a)*r);ctx.quadraticCurveTo(center+Math.cos(a+.015)*((r+end)/2),center+Math.sin(a+.015)*((r+end)/2),center+Math.cos(a)*end,center+Math.sin(a)*end);ctx.stroke();}
    const t=canvasTexture(c);t.userData.pixels={data:ctx.getImageData(0,0,512,512).data,width:512,height:512};irisMaterial=new T.MeshPhysicalMaterial({color:'#fff2da',map:t,roughness:.27,metalness:0,clearcoat:1,clearcoatRoughness:.035});
  }
  materials.iris=irisMaterial;
  for(const side of [-1,1]){
    const socket=new T.Group();socket.position.set(side*.375,.79,.566);head.add(socket);
    // The globe sits in the face. The corneal surface is shallow, not a protruding ball.
    mesh(socket,new T.TorusGeometry(.245,.020,high?12:8,high?64:40),materials.mouth,[0,0,.016],[1,1.025,1]);
    mesh(socket,new T.TorusGeometry(.229,.018,high?12:8,high?64:40),materials.bronze,[0,0,.034]);
    const gaze=new T.Group();socket.add(gaze);
    ball(gaze,materials.eye,[0,0,.018],[.225,.227,.108]);
    mesh(gaze,new T.CircleGeometry(.180,high?80:48),irisMaterial,[0,0,.122]);
    ball(gaze,materials.pupil,[0,0,.124],[.124,.127,.022]);
    ball(gaze,materials.glint,[-.064,.073,.149],[.027,.041,.004],true).rotation.z=-.22;
    ball(gaze,materials.glint,[.045,-.040,.150],[.009,.011,.003],true);
    const top=mesh(socket,new T.SphereGeometry(.242,high?48:28,high?24:14,0,Math.PI*2,0,Math.PI/2),materials.face,[0,0,.018],[1,1,.70]);
    const bottom=mesh(socket,new T.SphereGeometry(.242,high?48:28,high?24:14,0,Math.PI*2,Math.PI/2,Math.PI/2),materials.face,[0,0,.018],[1,1,.70]);
    top.rotation.x=-Math.PI/2;bottom.rotation.x=Math.PI/2;
    refs.eyes.push({socket,gaze});refs.lids.push({top,bottom});
    refs.brows.push(tube(socket,materials.face,[[-.215,.168,.003],[-.04,.268,.025],[.183,.195,.008]],.025));
    tube(head,materials.face,[[side*.21,.49,.595],[side*.40,.40,.596],[side*.56,.39,.523]],.012);
  }
  ball(head,materials.face,[0,.48,.644],[.096,.052,.052]);
  for(const side of [-1,1])ball(head,materials.mouth,[side*.036,.467,.690],[.018,.009,.004],true);
  refs.smile=tube(head,materials.mouth,[[-.115,.319,.616],[-.055,.291,.642],[.020,.292,.646],[.104,.326,.624]],.010);
  tube(head,materials.face,[[-.080,.273,.628],[0,.261,.644],[.078,.278,.628]],.017);

  const cap=new T.Group();head.add(cap);refs.cap=cap;
  const profile=[[.91,1.04],[.83,1.27],[.68,1.50],[.47,1.73],[.20,1.96],[0,2.08]].map(([r,y])=>new T.Vector2(r,y));
  const undercoat=materials.red[3].clone();undercoat.color.multiplyScalar(.56);
  mesh(cap,new T.LatheGeometry(profile,high?72:48),undercoat);
  const rows=[{lo:1.035,hi:1.35,r0:.938,r1:.803,n:10},{lo:1.285,hi:1.60,r0:.834,r1:.609,n:9},{lo:1.535,hi:1.84,r0:.661,r1:.354,n:7},{lo:1.78,hi:2.06,r0:.415,r1:.035,n:5}];
  rows.forEach((row,j)=>{
    for(let i=0;i<row.n;i++){
      const theta=i/row.n*Math.PI*2+(j%2?Math.PI/row.n:0)+.025*Math.sin(i*3+j),span=Math.PI*2/row.n*.985;
      const width=(row.r0+row.r1)/2*span,height=row.hi-row.lo,g=shield(width,height,.024),p=g.attributes.position;
      for(let k=0;k<p.count;k++){
        const x=p.getX(k),y=p.getY(k),z=p.getZ(k),v=y/height+.5,angle=theta+x/width*span;
        const radius=row.r0+(row.r1-row.r0)*v+z+.012*Math.sin(i*2+j);
        p.setXYZ(k,Math.sin(angle)*radius,(row.lo+row.hi)/2+y,Math.cos(angle)*radius);
      }
      g.computeVertexNormals();aoGeometry(g,(x,y,z)=>.80+.18*Math.min(1,Math.max(0,(y-row.lo)/height*2)));
      mesh(cap,g,[agedClone(materials.red[(i+j)%4]),materials.edge]);
      const y=row.lo+height*.24,r=row.r0+(row.r1-row.r0)*.24+.05;
      for(const s of [-1,1])ball(cap,materials.bronze,[Math.sin(theta+s*span*.32)*r,y,Math.cos(theta+s*span*.32)*r],[.012,.012,.012],true);
    }
  });
  ball(cap,materials.red[2],[0,2.05,0],[.060,.085,.060]);
  for(const side of [-1,1]){
    const flap=mesh(head,shield(.37,.48),[materials.red[2],materials.edge],[side*.825,.88,-.05]);flap.rotation.y=side*Math.PI/2;flap.rotation.z=side*.14;
    for(let i=0;i<3;i++){
      const strand=new T.Group();strand.position.set(side*(.79+i*.018),.59,-.15+i*.13);head.add(strand);
      const length=.43+(i===1?.18:0);tube(strand,materials.face,[[0,0,0],[side*.03,-length*.45,.015],[side*.05,-length,.02]],.039);
      for(const u of [.45,.77])mesh(strand,new T.TorusGeometry(.040,.009,6,12),materials.bronze,[side*.04*u,-length*u,.02]).rotation.x=Math.PI/2;
      refs.strands.push({node:strand,side,phase:i});
    }
  }
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.405,.21,0);torso.add(arm);
    ball(arm,materials.joint,[0,0,0],[.10,.10,.10]);
    ball(arm,materials.red[2],[side*.020,.016,-.010],[.125,.103,.14]);
    capsule(arm,materials.bronze,[0,-.065,0],[side*.05,-.30,.01],.060);
    const elbow=new T.Group();elbow.position.set(side*.05,-.30,.01);arm.add(elbow);
    mesh(elbow,new T.CylinderGeometry(.080,.080,.12,16),materials.joint).rotation.z=Math.PI/2;
    for(const s of [-1,1])ball(elbow,materials.bronze,[s*.066,0,0],[.012,.029,.029],true);
    capsule(elbow,materials.red[side<0?2:1],[0,-.035,0],[side*.025,-.26,.025],.082);
    mesh(elbow,new T.TorusGeometry(.077,.011,6,20),materials.edge,[side*.025,-.24,.025]).rotation.x=Math.PI/2;
    const hand=new T.Group();hand.position.set(side*.025,-.31,.035);elbow.add(hand);
    ball(hand,materials.face,[0,0,0],[.091,.092,.059]);
    for(let i=0;i<3;i++){const x=-.053+i*.053;capsule(hand,materials.face,[x,-.046,.02],[x,-.135+(i===1?-.012:0),.054],.023);ball(hand,materials.bronze,[x,-.083,.055],[.024,.012,.009],true);}
    capsule(hand,materials.face,[side*.07,.008,.018],[side*.12,-.063,.049],.028);refs.arms.push({node:arm,elbow,hand,side});
    const leg=new T.Group();leg.position.set(side*.175,-.49,0);root.add(leg);
    ball(leg,materials.joint,[0,-.035,0],[.080,.080,.080]);
    capsule(leg,materials.red[side<0?0:1],[0,-.06,0],[0,-.26,0],.094);
    ball(leg,materials.bronze,[0,-.28,.016],[.073,.075,.077]);
    capsule(leg,materials.red[2],[0,-.30,0],[0,-.48,.015],.077);
    ball(leg,materials.red[1],[0,-.55,.075],[.12,.086,.185]);
    ball(leg,materials.edge,[0,-.61,.075],[.125,.022,.19]);
    refs.legs.push({node:leg,side});
  }
  root.traverse(node=>{if(node.isMesh)node.userData.characterPart=true;});
  return refs;
}

function poseCompanionModel(T,model,state){
  const t=state.time||0,idle=state.idle!==false,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
  const hop=t-(state.hopAt??-100),wave=t-(state.waveAt??-100),spin=t-(state.spinAt??-100);
  let lift=0,sx=1,sy=1;
  if(hop>=0&&hop<.95){if(hop<.16){const c=Math.sin(hop/.16*Math.PI);sy=1-.035*c;sx=1+.018*c;lift=-.025*c;}else if(hop<.78){const p=(hop-.16)/.62;lift=.34*4*p*(1-p);}else{const c=Math.sin((hop-.78)/.17*Math.PI);sy=1-.03*c;sx=1+.015*c;}}
  model.root.position.y=lift+(idle?Math.sin(t*1.8)*.009:0);model.root.scale.set(sx,sy,sx);
  const spinning=spin>=0&&spin<2.7;model.root.rotation.y=-.08+(spinning?ease(spin/2.7)*Math.PI*2:0);
  const target=state.target||new T.Vector3(0,1.16,4);model.root.updateMatrixWorld(true);const local=model.root.worldToLocal(target.clone());
  let yaw=clamp(Math.atan2(local.x,local.z),-.44,.44),pitch=clamp(-Math.atan2(local.y-1.16,Math.hypot(local.x,local.z)),-.24,.24);if(spinning){yaw=0;pitch=0;}
  model.head.rotation.set(pitch,yaw,-yaw*.10+(idle&&!state.pointer?Math.sin(t*.7)*.015:0),'YXZ');model.torso.rotation.z=-yaw*.025;model.root.updateMatrixWorld(true);
  const gaze=[];for(const eye of model.eyes){const v=eye.socket.worldToLocal(target.clone());v.z+=.85;const ey=spinning?0:clamp(Math.atan2(v.x,v.z),-.24,.24),ex=spinning?0:clamp(-Math.atan2(v.y,Math.hypot(v.x,v.z)),-.20,.20);eye.gaze.rotation.set(ex,ey,0,'YXZ');gaze.push({x:ex,y:ey});}
  const phase=t%4.9,blink=idle&&phase>3.6&&phase<3.87?Math.sin((phase-3.6)/.27*Math.PI):0;for(const lid of model.lids){lid.top.rotation.x=-Math.PI/2*(1-blink);lid.bottom.rotation.x=Math.PI/2*(1-blink);}
  for(const brow of model.brows)brow.position.y=(hop>=0&&hop<.95?.016:0)+Math.abs(yaw)*.02;model.smile.scale.x=hop>=0&&hop<.95?1.07:1;
  let angle=0;if(wave>=0&&wave<1.85){if(wave<.3)angle=2.35*ease(wave/.3);else if(wave<1.35)angle=2.35+Math.sin((wave-.3)*Math.PI*5.5)*.14;else angle=2.35*(1-ease((wave-1.35)/.5));}
  for(const arm of model.arms){arm.node.rotation.z=arm.side>0?angle+.09:-.09;arm.node.rotation.x=idle?Math.sin(t*1.25+arm.side)*.025:0;arm.elbow.rotation.z=arm.side>0?-.10*Math.sin(angle):.06;arm.hand.rotation.y=arm.side>0?angle*.12:0;}
  for(const leg of model.legs)leg.node.rotation.z=leg.side*(1-sy)*1.2;for(const s of model.strands)s.node.rotation.z=-yaw*.12+(idle?Math.sin(t*1.7+s.phase)*.011:0);
  model.root.updateMatrixWorld(true);return {yaw,pitch,gaze,blink,hop:hop>=0&&hop<.95,wave:wave>=0&&wave<1.85,spin:spinning};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCompanionModel,poseCompanionModel};
