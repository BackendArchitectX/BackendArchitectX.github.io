(async function(){
  'use strict';
  const T=window.THREE,root=document.getElementById('pawny-companion'),stage=root.querySelector('.stage'),loading=root.querySelector('#loading'),status=root.querySelector('.status');
  let canvas=root.querySelector('canvas'),renderer,engine;
  try{
    if(!T)throw Error('The 3D engine could not load. Please refresh the page.');
    try{
      renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;engine='webgl';
    }catch(error){
      const replacement=document.createElement('canvas');replacement.setAttribute('role','img');replacement.setAttribute('aria-label',canvas.getAttribute('aria-label'));canvas.replaceWith(replacement);canvas=replacement;renderer=createCompanionSoftwareRenderer(T,canvas);engine='software-3d';
    }
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,30);camera.position.set(0,.12,4.4);camera.lookAt(0,0,0);
    scene.add(new T.HemisphereLight(0xfff3e3,0x424e46,.75));
    const key=new T.DirectionalLight(0xfff0d9,2.5);key.position.set(-3,4.5,5);scene.add(key);
    const fill=new T.DirectionalLight(0xdbe7ed,.8);fill.position.set(4,2,4);scene.add(fill);
    const rim=new T.DirectionalLight(0xffe6c5,1.5);rim.position.set(1,4,-3);scene.add(rim);
    if(engine==='webgl'){
      const studio=new T.Scene();studio.add(new T.Mesh(new T.BoxGeometry(14,14,14),new T.MeshBasicMaterial({color:new T.Color().setRGB(.075,.085,.08),side:T.BackSide,toneMapped:false})));
      for(const [w,h,rgb,pos]of [[2.5,4.5,[3.8,3.6,3.3],[-3,3.5,5]],[1.4,3.5,[2.2,2.5,2.7],[4,1.8,4.7]],[4,4,[.8,.9,.85],[0,6,0]]]){const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color().setRGB(...rgb),side:T.DoubleSide,toneMapped:false}));p.position.set(...pos);p.lookAt(0,0,0);studio.add(p);}
      const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.04,.1,40).texture;pmrem.dispose();studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
    }
    const response=await fetch('assets/robot-companion/pawny/character.glb');if(!response.ok)throw Error('The character file could not load. Please refresh the page.');
    const rig=await createImportedCompanion(T,await response.arrayBuffer(),{createCanvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}});scene.add(rig.root);
    const reduced=window.matchMedia('(prefers-reduced-motion:reduce)'),clock=()=>performance.now()/1000;
    const state={idle:!reduced.matches,pointer:false,yaw:0,pitch:0,desiredYaw:0,desiredPitch:0,helloAt:reduced.matches?-100:clock()+.6,hopAt:-100,turnAt:-100,last:clock(),lastDraw:0,lastPointer:0,frames:0,dirty:true};
    const ndc=new T.Vector2(),ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),-1.6),target=new T.Vector3();
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    function activeAt(now){return now>=state.helloAt&&now-state.helloAt<1.7||now-state.hopAt<.9||now-state.turnAt<2.3;}
    function draw(now){
      const dt=Math.min(.15,Math.max(.001,now-state.last));state.last=now;
      const idleYaw=state.idle&&!state.pointer?.028*Math.sin(now*.8):0,idlePitch=state.idle&&!state.pointer?.012*Math.sin(now*1.1):0;
      const y=state.pointer?state.desiredYaw:idleYaw,p=state.pointer?state.desiredPitch:idlePitch;
      const mix=1-Math.exp(-dt*16);state.yaw+=(y-state.yaw)*mix;state.pitch+=(p-state.pitch)*mix;
      const hello=now-state.helloAt,hop=now-state.hopAt,turn=now-state.turnAt;
      let nod=0,roll=state.idle?.008*Math.sin(now*1.5):0,lift=0,rotation=0,action='idle';
      if(hello>=0&&hello<1.7){const t=hello/1.7;nod=.105*Math.sin(t*Math.PI*3)*Math.sin(t*Math.PI);roll+=.085*Math.sin(Math.PI*t);action='hello';}
      if(hop>=0&&hop<.9){lift=.17*Math.sin(Math.PI*hop/.9);action='hop';}
      if(turn>=0&&turn<2.3){rotation=Math.PI*2*ease(turn/2.3);action='turn';}
      rig.setPose({yaw:state.yaw,pitch:state.pitch+nod,roll,hop:lift,turn:rotation});
      if(engine==='software-3d')renderer.setQuality(activeAt(now)||now-state.lastPointer<.3?.72:1);
      renderer.render(scene,camera);state.frames++;state.lastDraw=performance.now();
      root.dataset.ready='true';root.dataset.engine=engine;root.dataset.headYaw=state.yaw.toFixed(4);root.dataset.headPitch=state.pitch.toFixed(4);root.dataset.action=action;root.dataset.turn=rotation.toFixed(4);root.dataset.hop=lift.toFixed(4);root.dataset.frames=String(state.frames);root.dataset.triangles=String(rig.triangleCount);root.dataset.rigJoints='2';
      state.dirty=Math.abs(y-state.yaw)+Math.abs(p-state.pitch)>.0003;
      loading.hidden=true;
      const label=action==='hello'?'Hello, friend.':action==='hop'?'Happy to see you.':action==='turn'?'A little turn.':state.pointer?'Following your pointer.':'A little curious.';
      if(status.textContent!==label)status.textContent=label;
    }
    function resize(){const r=stage.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/r.height;camera.position.z=camera.aspect<.8?4.9:4.4;camera.updateProjectionMatrix();draw(clock());}
    function pointer(e){const r=canvas.getBoundingClientRect();ndc.set(clamp((e.clientX-r.left)/r.width*2-1,-2,2),clamp(1-(e.clientY-r.top)/r.height*2,-2,2));ray.setFromCamera(ndc,camera);if(ray.ray.intersectPlane(plane,target)){state.desiredYaw=clamp(Math.atan2(target.x,target.z-.2),-.32,.32);state.desiredPitch=clamp(Math.atan2(.42-target.y,Math.hypot(target.x,target.z-.2)),-.18,.19);state.pointer=true;state.dirty=true;state.lastPointer=clock();}}
    window.addEventListener('pointermove',pointer,{passive:true});window.addEventListener('pointerdown',pointer,{passive:true});
    document.documentElement.addEventListener('pointerleave',()=>{state.pointer=false;state.desiredYaw=state.desiredPitch=0;state.dirty=true;});
    function action(name){const now=clock();if(name==='hello')state.helloAt=now;if(name==='hop')state.hopAt=now;if(name==='turn')state.turnAt=now;state.dirty=true;}
    for(const name of ['hello','hop','turn'])root.querySelector('[data-action="'+name+'"]').addEventListener('click',()=>action(name));
    canvas.addEventListener('click',()=>action('hop'));
    const idle=root.querySelector('[data-action="idle"]');
    function idleLabel(){idle.textContent=state.idle?'Pause idle':'Resume idle';idle.setAttribute('aria-pressed',String(!state.idle));root.dataset.idle=String(state.idle);}
    idle.addEventListener('click',()=>{state.idle=!state.idle;idleLabel();state.dirty=true;});reduced.addEventListener('change',e=>{state.idle=!e.matches;idleLabel();state.dirty=true;});
    root.querySelectorAll('button').forEach(b=>b.disabled=false);idleLabel();new ResizeObserver(resize).observe(stage);resize();
    let visible=true;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)state.dirty=true;}).observe(stage);
    function tick(nowMs){if(document.hidden||!visible)return;const now=nowMs/1000;if((state.idle||state.dirty||activeAt(now))&&(engine==='webgl'||nowMs-state.lastDraw>80))draw(now);}
    if(engine==='webgl')renderer.setAnimationLoop(tick);else{const loop=ms=>{tick(ms);requestAnimationFrame(loop);};requestAnimationFrame(loop);}
  }catch(error){root.dataset.ready='error';loading.hidden=false;loading.textContent=error.message||'The character could not load. Please refresh the page.';status.textContent='Preview unavailable.';}
})();
