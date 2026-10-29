(async function(){
  'use strict';
  const T=window.THREE,root=document.getElementById('pawny-companion');
  const stage=root.querySelector('.stage'),loading=root.querySelector('#loading'),status=root.querySelector('.status');
  let canvas=root.querySelector('canvas'),renderer,engine;
  try{
    if(!T)throw Error('The 3D engine could not load. Please refresh the page.');
    try{
      renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;engine='webgl';
    }catch(error){
      const replacement=document.createElement('canvas');replacement.setAttribute('role','img');replacement.setAttribute('aria-label',canvas.getAttribute('aria-label'));canvas.replaceWith(replacement);canvas=replacement;renderer=createCompanionSoftwareRenderer(T,canvas);engine='software-3d';
    }
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,30);
    scene.add(new T.HemisphereLight(0xfff3e3,0x424e46,.75));
    const key=new T.DirectionalLight(0xfff0d9,2.5);key.position.set(-3,4.5,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-1.7;key.shadow.camera.right=1.7;key.shadow.camera.top=1.7;key.shadow.camera.bottom=-1.5;key.shadow.camera.near=.5;key.shadow.camera.far=12;key.shadow.bias=-.00008;key.shadow.normalBias=.0015;scene.add(key);
    const fill=new T.DirectionalLight(0xdbe7ed,.8);fill.position.set(4,2,4);scene.add(fill);
    const rim=new T.DirectionalLight(0xffe6c5,1.5);rim.position.set(1,4,-3);scene.add(rim);
    if(engine==='webgl'){
      const studio=new T.Scene();studio.add(new T.Mesh(new T.BoxGeometry(14,14,14),new T.MeshBasicMaterial({color:new T.Color().setRGB(.075,.085,.08),side:T.BackSide,toneMapped:false})));
      for(const [w,h,rgb,pos]of [[2.5,4.5,[3.8,3.6,3.3],[-3,3.5,5]],[1.4,3.5,[2.2,2.5,2.7],[4,1.8,4.7]],[4,4,[.8,.9,.85],[0,6,0]]]){
        const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color().setRGB(...rgb),side:T.DoubleSide,toneMapped:false}));panel.position.set(...pos);panel.lookAt(0,0,0);studio.add(panel);
      }
      const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.04,.1,40).texture;pmrem.dispose();studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
      const floor=new T.Mesh(new T.PlaneGeometry(6,6),new T.ShadowMaterial({color:0x172019,opacity:.13}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.129;floor.receiveShadow=true;scene.add(floor);
    }
    const response=await fetch('assets/robot-companion/pawny/character-refined.glb');
    if(!response.ok)throw Error('The character file could not load. Please refresh the page.');
    const rig=await createImportedCompanion(T,await response.arrayBuffer(),{anisotropy:engine==='webgl'?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1,createCanvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}});
    if(!rig.detail||rig.detail.eyes.length!==2)throw Error('The eye rig could not load. Please refresh the page.');
    scene.add(rig.root);root.dataset.handRevision=rig.source.handRepair?'rebuilt-v2':'source';root.dataset.eyeRig='independent-3d';root.dataset.materialGroups=String(rig.mesh.geometry.groups.length);
    const reduced=window.matchMedia('(prefers-reduced-motion:reduce)'),clock=()=>performance.now()/1000,start=clock();
    const state={idle:!reduced.matches,pointer:false,holdHead:true,face:false,yaw:0,pitch:0,desiredYaw:0,desiredPitch:0,helloAt:reduced.matches?-100:start+.6,hopAt:-100,turnAt:-100,blinkAt:-100,blinkPeak:0,nextBlink:start+2.8,idlePhase:-1,last:start,lastDraw:0,frames:0,dirty:true};
    const gazeTarget=new T.Vector3(0,.46,3),target=new T.Vector3(),ndc=new T.Vector2(),ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),-1.6);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
    const blinkClose=engine==='webgl'?.085:.14,blinkHold=engine==='webgl'?.035:.10,blinkOpen=engine==='webgl'?.155:.28;
    function blinkValue(now){const t=now-state.blinkAt;if(t<0||t>blinkClose+blinkHold+blinkOpen)return 0;if(t<blinkClose)return smooth(t/blinkClose);if(t<blinkClose+blinkHold)return 1;return 1-smooth((t-blinkClose-blinkHold)/blinkOpen);}
    function gestureActive(now){return now>=state.helloAt&&now-state.helloAt<1.7||now-state.hopAt<.9||now-state.turnAt<2.3;}
    function draw(now){
      const dt=Math.min(.25,Math.max(.001,now-state.last));state.last=now;
      const idleHead=state.idle&&!state.pointer&&engine==='webgl';
      const desiredYaw=state.pointer?state.desiredYaw:idleHead?.018*Math.sin(now*.8):0;
      const desiredPitch=state.pointer?state.desiredPitch:idleHead?.009*Math.sin(now*1.1):0;
      const mix=1-Math.exp(-dt*5.5);
      if(state.holdHead){state.yaw=0;state.pitch=0;}else{state.yaw+=(desiredYaw-state.yaw)*mix;state.pitch+=(desiredPitch-state.pitch)*mix;if(Math.abs(desiredYaw-state.yaw)<.000025)state.yaw=desiredYaw;if(Math.abs(desiredPitch-state.pitch)<.000025)state.pitch=desiredPitch;}
      const hello=now-state.helloAt,hop=now-state.hopAt,turn=now-state.turnAt;
      let nod=0,roll=idleHead?.006*Math.sin(now*1.5):0,lift=0,rotation=0,action='idle';
      if(hello>=0&&hello<1.7){const t=hello/1.7;nod=.085*Math.sin(t*Math.PI*3)*Math.sin(t*Math.PI);roll+=.065*Math.sin(Math.PI*t);action='hello';}
      if(hop>=0&&hop<.9){lift=.17*Math.sin(Math.PI*hop/.9);action='hop';}
      if(turn>=0&&turn<2.3){rotation=Math.PI*2*ease(turn/2.3);action='turn';}
      if(state.holdHead){nod=0;roll=0;}
      rig.setPose({yaw:state.yaw,pitch:state.pitch+nod,roll,hop:lift,turn:rotation});
      const blink=blinkValue(now),gaze=rig.detail.update({target:gazeTarget,dt,blink});state.blinkPeak=Math.max(state.blinkPeak,blink);
      renderer.render(scene,camera);state.frames++;state.lastDraw=performance.now();
      root.dataset.ready='true';root.dataset.engine=engine;root.dataset.headYaw=state.yaw.toFixed(5);root.dataset.headPitch=(state.pitch+nod).toFixed(5);root.dataset.eyeLeftYaw=gaze.leftYaw.toFixed(5);root.dataset.eyeRightYaw=gaze.rightYaw.toFixed(5);root.dataset.eyeLeftPitch=gaze.leftPitch.toFixed(5);root.dataset.eyeRightPitch=gaze.rightPitch.toFixed(5);root.dataset.blink=blink.toFixed(4);root.dataset.headHeld=String(state.holdHead);root.dataset.action=action;root.dataset.frames=String(state.frames);root.dataset.triangles=String(rig.triangleCount);root.dataset.rigJoints='4';root.dataset.view=state.face?'face':'full';
      root.dataset.blinkPeak=state.blinkPeak.toFixed(4);
      if(engine==='software-3d'){const stats=renderer.getStats();root.dataset.renderMs=stats.renderMs.toFixed(1);root.dataset.staticReused=String(stats.staticReused);}
      state.dirty=(!state.holdHead&&(Math.abs(desiredYaw-state.yaw)+Math.abs(desiredPitch-state.pitch)>.000025))||gaze.settling||blink>0||gestureActive(now);
      loading.hidden=true;
      const label=action==='hello'?'Hello, friend.':action==='hop'?'Happy to see you.':action==='turn'?'A little turn.':state.pointer?(state.holdHead?'Eyes following. Head held.':'Eyes following your pointer.'):'A little curious.';
      if(status.textContent!==label)status.textContent=label;
    }
    function resize(){
      const r=stage.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/r.height;
      const z=state.face?Math.max(2.35,1.42/(2*Math.tan(34*Math.PI/360)*camera.aspect)):camera.aspect<.8?4.9:4.4;
      camera.position.set(0,state.face?.48:.12,z);camera.lookAt(0,state.face?.43:0,0);camera.updateProjectionMatrix();draw(clock());
    }
    function pointer(e){
      const r=canvas.getBoundingClientRect();ndc.set(clamp((e.clientX-r.left)/r.width*2-1,-2,2),clamp(1-(e.clientY-r.top)/r.height*2,-2,2));ray.setFromCamera(ndc,camera);
      if(ray.ray.intersectPlane(plane,target)){
        gazeTarget.copy(target);
        const yaw=Math.atan2(target.x,target.z-.2),pitch=Math.atan2(.42-target.y,Math.hypot(target.x,target.z-.2));
        state.desiredYaw=clamp(Math.sign(yaw)*Math.max(0,Math.abs(yaw)-.22)*.6,-.16,.16);
        state.desiredPitch=clamp(Math.sign(pitch)*Math.max(0,Math.abs(pitch)-.12)*.55,-.10,.11);
        state.pointer=true;state.dirty=true;
      }
    }
    window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('pointerdown',pointer,{passive:true});
    document.documentElement.addEventListener('pointerleave',()=>{state.pointer=false;state.desiredYaw=state.desiredPitch=0;gazeTarget.set(0,.46,3);state.idlePhase=-1;state.dirty=true;});
    function action(name){const now=clock();if(name==='hello'){state.helloAt=now;state.blinkAt=now+.22;}if(name==='hop')state.hopAt=now;if(name==='turn')state.turnAt=now;state.dirty=true;}
    for(const name of['hello','hop','turn'])root.querySelector('[data-action="'+name+'"]').addEventListener('click',()=>action(name));
    canvas.addEventListener('click',()=>action('hop'));
    const hold=root.querySelector('[data-action="hold"]'),face=root.querySelector('[data-action="face"]'),idle=root.querySelector('[data-action="idle"]');
    hold.addEventListener('click',()=>{state.holdHead=!state.holdHead;hold.textContent=state.holdHead?'Release head':'Hold head';hold.setAttribute('aria-pressed',String(state.holdHead));state.dirty=true;});
    face.addEventListener('click',()=>{state.face=!state.face;face.textContent=state.face?'Full view':'Face view';face.setAttribute('aria-pressed',String(state.face));resize();});
    function idleLabel(){idle.textContent=state.idle?'Pause idle':'Resume idle';idle.setAttribute('aria-pressed',String(!state.idle));root.dataset.idle=String(state.idle);}
    idle.addEventListener('click',()=>{state.idle=!state.idle;state.nextBlink=clock()+2.8;idleLabel();state.dirty=true;});
    reduced.addEventListener('change',e=>{state.idle=!e.matches;state.nextBlink=clock()+2.8;idleLabel();state.dirty=true;});
    root.querySelectorAll('button').forEach(b=>b.disabled=false);idleLabel();new ResizeObserver(resize).observe(stage);resize();
    let visible=true;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)state.dirty=true;}).observe(stage);
    function tick(nowMs){
      if(document.hidden||!visible)return;const now=nowMs/1000;
      if(state.idle&&now>=state.nextBlink){state.blinkAt=now;state.nextBlink=now+3.3+(1+Math.sin(now*1.71))*1.1;state.dirty=true;}
      if(state.idle&&!state.pointer){const phase=Math.floor((now-start)/3.8);if(phase!==state.idlePhase){state.idlePhase=phase;gazeTarget.set(.24*Math.sin(phase*2.399),.46+.065*Math.sin(phase*1.17),3);state.dirty=true;}}
      const continuousHead=engine==='webgl'&&state.idle&&!state.pointer&&!state.holdHead;
      if((state.dirty||continuousHead||gestureActive(now)||blinkValue(now)>0)&&(engine==='webgl'||nowMs-state.lastDraw>12))draw(now);
    }
    if(engine==='webgl')renderer.setAnimationLoop(tick);else{const loop=ms=>{tick(ms);requestAnimationFrame(loop);};requestAnimationFrame(loop);}
  }catch(error){root.dataset.ready='error';loading.hidden=false;loading.textContent=error.message||'The character could not load. Please refresh the page.';status.textContent='Preview unavailable.';}
})();
