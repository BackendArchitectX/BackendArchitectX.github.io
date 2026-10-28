/* A reversible mechanical motion study. The production character asset is separate. */
function createTransformingCompanion(T,options={}){
  const core=typeof createCompanionModel==='function'?{createCompanionModel,poseCompanionModel}:require('./core-model.js');
  const model=core.createCompanionModel(T,options),root=model.root;
  const materials=model.materials,seen=new Set(),faceHex=materials.face.color.getHex();
  // Use clean, softly lit materials for judging motion; the former gritty atlas is omitted.
  root.traverse(o=>{
    if(!o.isMesh)return;
    o.geometry.deleteAttribute('color');
    for(const m of(Array.isArray(o.material)?o.material:[o.material])){
      if(seen.has(m))continue;seen.add(m);
      const face=m.color.getHex()===faceHex,red=m.roughness===.65&&m.metalness===.43;
      if(face){m.color.set('#b9bea1');m.roughness=.52;m.metalness=.20;}
      if(red){m.color.set('#be7050');m.roughness=.46;m.metalness=.58;}
      m.vertexColors=false;
    }
  });
  materials.bronze.color.set('#bca16b');materials.bronze.roughness=.4;
  materials.edge.color.set('#8c704d');materials.mouth.color.set('#505541');
  materials.joint.color.set('#42483d');
  const copper=new T.MeshStandardMaterial({color:'#bd6a43',roughness:.42,metalness:.64,envMapIntensity:.9});
  const inside=new T.MeshStandardMaterial({color:'#665044',roughness:.68,metalness:.5});
  const gold=new T.MeshStandardMaterial({color:'#c2a06a',roughness:.33,metalness:.80});
  const slit=new T.MeshStandardMaterial({color:'#282d25',roughness:.40,metalness:.1});
  const parts=[];
  function mesh(parent,g,m){const o=new T.Mesh(g,m);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function shield(w,h){
    const s=new T.Shape();s.moveTo(-w*.48,h*.5);s.quadraticCurveTo(0,h*.54,w*.48,h*.5);s.lineTo(w*.47,-h*.24);s.quadraticCurveTo(w*.34,-h*.45,0,-h*.55);s.quadraticCurveTo(-w*.34,-h*.45,-w*.47,-h*.24);s.closePath();
    return new T.ExtrudeGeometry(s,{depth:.037,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.012,bevelThickness:.012,curveSegments:7});
  }
  function patch(radius,height,span){
    const g=new T.CylinderGeometry(radius,radius,height,24,2,true,-span/2,span),p=g.attributes.position;
    for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-radius);g.computeVertexNormals();return g;
  }
  function addPart(node,closed,parent,position,rotation,scale,delay,duration,peel,theta=0){
    const startQ=new T.Quaternion().setFromEuler(new T.Euler(...closed.rotation));
    const endLocalQ=new T.Quaternion().setFromEuler(new T.Euler(...rotation));
    parts.push({node,start:new T.Vector3(...closed.position),startQ,parent,end:new T.Vector3(...position),endLocalQ,scale:new T.Vector3(...scale),delay,duration,peel,theta});
    node.position.copy(parts.at(-1).start);node.quaternion.copy(startQ);root.add(node);return node;
  }
  // One front shield, six side/rear panels: these retract onto the chest and limbs.
  const angles=[0,Math.PI/4,Math.PI/2,Math.PI*.75,Math.PI,Math.PI*1.25,Math.PI*1.5,Math.PI*1.75];
  angles.forEach((theta,i)=>{
    const g=i===0?shield(1.16,1.34):patch(.89,1.31,Math.PI/4*.97);
    const node=new T.Group();mesh(node,g,i===0?[copper,gold]:copper).material.side=T.DoubleSide;
    const rim=new T.Mesh(new T.TorusGeometry(.014,.005,4,8),gold);rim.position.set(.22,.46,.034);node.add(rim);
    let parent=model.torso,pos=[0,-.025,.35],rot=[0,0,0],scale=[.47,.48,.48];
    if(i===1||i===7){const side=i===1?1:-1;parent=model.arms.find(a=>a.side===side).node;pos=[side*.015,.015,.055];rot=[0,side*.5,side*.35];scale=[.29,.22,.29];}
    else if(i===2||i===6){const side=i===2?1:-1;parent=model.arms.find(a=>a.side===side).elbow;pos=[side*.01,-.15,.078];rot=[0,0,0];scale=[.23,.22,.25];}
    else if(i>=3&&i<=5){pos=[(i-4)*.16,-.07,-.28];rot=[0,Math.PI,0];scale=[.30,.42,.30];}
    addPart(node,{position:[Math.sin(theta)*.89,-.35,Math.cos(theta)*.89],rotation:[0,theta,0]},parent,pos,rot,scale,.85+(i%2)*.12,1.05,.35,theta);
  });
  // Two recognizable face shutters carry the closed form's narrow eye slits.
  for(const side of [-1,1]){
    const theta=side*.39,node=new T.Group();
    mesh(node,patch(.91,.67,.80),copper).material.side=T.DoubleSide;
    const eyeSlit=mesh(node,new T.BoxGeometry(.23,.029,.012),slit);eyeSlit.position.set(-side*.025,.035,.012);eyeSlit.rotation.z=side*.025;
    for(const y of [-.30,.30]){const seam=mesh(node,new T.BoxGeometry(.64,.012,.015),gold);seam.position.set(0,y,-.02);}
    addPart(node,{position:[Math.sin(theta)*.91,.65,Math.cos(theta)*.91],rotation:[0,theta,0]},model.head,[side*.82,.87,-.11],[0,side*Math.PI/2,side*.08],[.37,.62,.43],.38,.95,.26,theta);
  }
  for(let i=0;i<6;i++){
    const theta=.92+i*(Math.PI*2-1.84)/5,node=new T.Group();mesh(node,patch(.90,.67,.75),copper).material.side=T.DoubleSide;
    const targetTheta=1.12+i*(Math.PI*2-2.24)/5;
    addPart(node,{position:[Math.sin(theta)*.90,.65,Math.cos(theta)*.90],rotation:[0,theta,0]},model.head,[Math.sin(targetTheta)*.80,1.02,Math.cos(targetTheta)*.64],[0,targetTheta,0],[.58,.55,.58],.47,.98,.18,theta);
  }
  // The plinth splits into four brass quarters and folds around the ankles.
  for(let i=0;i<4;i++){
    const node=new T.Group();
    const band=mesh(node,new T.CylinderGeometry(.945,.945,.12,20,1,true,i*Math.PI/2,Math.PI/2*.99),gold);band.material.side=T.DoubleSide;
    const lower=mesh(node,new T.CylinderGeometry(.958,.958,.07,20,1,true,i*Math.PI/2,Math.PI/2*.99),copper);lower.position.y=-.08;lower.material.side=T.DoubleSide;
    const side=i===0||i===1?1:-1,parent=model.legs.find(a=>a.side===side).node;
    addPart(node,{position:[0,-1.04,0],rotation:[0,0,0]},parent,[0,-.38,.01],[0,0,0],[.14,.7,.14],1.24,.90,.12,i*Math.PI/2);
  }
  const inv=new T.Quaternion(),worldQ=new T.Quaternion(),targetQ=new T.Quaternion(),targetPos=new T.Vector3();
  function pose(state){
    const t=Math.max(0,Math.min(4.3,state.elapsed)),ease=(start,duration)=>{let x=Math.max(0,Math.min(1,(t-start)/duration));return x*x*(3-2*x);};
    const head=ease(.65,.92),body=ease(.85,.97),arms=ease(1.05,1.05),legs=ease(1.24,.95),look=ease(1.63,.65),eyes=ease(1.27,.35);
    const p=core.poseCompanionModel(T,model,{time:state.clock,idle:state.idle&&t>2.2,pointer:state.pointer,target:state.target,waveAt:state.waveAt??-100});
    model.head.position.y=.40-.45*(1-head);model.head.rotation.x*=look;model.head.rotation.y*=look;model.head.rotation.z*=look;
    model.torso.position.y=-.24*(1-body);
    for(const arm of model.arms){arm.node.rotation.z=arm.side*2.5*(1-arms)+arm.node.rotation.z*arms;arm.elbow.rotation.x=1.12*(1-arms);}
    for(const leg of model.legs){leg.node.position.y=-.49+.32*(1-legs);leg.node.rotation.x=-1.35*(1-legs);}
    for(const lid of model.lids){lid.top.rotation.x*=eyes;lid.bottom.rotation.x*=eyes;}
    root.updateMatrixWorld(true);root.getWorldQuaternion(inv).invert();
    for(const part of parts){
      const f=ease(part.delay,part.duration),bell=Math.sin(Math.PI*f);
      part.parent.localToWorld(targetPos.copy(part.end));root.worldToLocal(targetPos);
      part.parent.getWorldQuaternion(worldQ);targetQ.copy(inv).multiply(worldQ).multiply(part.endLocalQ);
      part.node.position.copy(part.start).lerp(targetPos,f);
      part.node.position.x+=Math.sin(part.theta)*part.peel*bell;part.node.position.z+=Math.cos(part.theta)*part.peel*bell;
      part.node.quaternion.copy(part.startQ).slerp(targetQ,f);
      const peel=new T.Quaternion().setFromAxisAngle(new T.Vector3(Math.cos(part.theta),0,-Math.sin(part.theta)),-.75*bell);part.node.quaternion.premultiply(peel);
      part.node.scale.set(1,1,1).lerp(part.scale,f);
    }
    root.updateMatrixWorld(true);
    const phase=t<.38?'Capsule sealed':t<1.27?'Panels opening':t<2.2?'Unfolding':t<4.15?'Hello there':'Following your pointer';
    return {phase,head:head,legs:legs,open:t>=2.2,yaw:p.yaw*look,gaze:p.gaze,panels:parts.map(p=>({position:p.node.position.clone(),scale:p.node.scale.clone()}))};
  }
  return {model,root,parts,pose};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createTransformingCompanion};
