/* Deferred geometry fallback with GGX lighting, studio reflections, shadows and contact shading. */
function createCompanionSoftwareRenderer(T,canvas){
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('A drawing context is unavailable.');
  let width=640,height=420,displayWidth=640,displayHeight=420,quality=1,image,depth,owner,world,normalBuffer,uvBuffer;
  const vp=new T.Matrix4(),normalMatrix=new T.Matrix3(),shadowVP=new T.Matrix4(),shadowSize=256,shadowDepth=new Float32Array(shadowSize*shadowSize);
  const lightCamera=new T.OrthographicCamera(-2.8,2.8,3.1,-2.5,.1,19);lightCamera.position.set(-3,5,5);lightCamera.lookAt(0,.55,0);lightCamera.updateMatrixWorld(true);shadowVP.multiplyMatrices(lightCamera.projectionMatrix,lightCamera.matrixWorldInverse);
  const se=shadowVP.elements,materials=[null],materialIds=new WeakMap(),stats={renderMs:0,meshes:0,triangles:0};
  const srgb=new Float32Array(256),output=new Uint8ClampedArray(8193);
  for(let i=0;i<256;i++){const v=i/255;srgb[i]=v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}
  for(let i=0;i<output.length;i++){let v=i/1024*.98;v=Math.min(1,Math.max(0,(v*(2.51*v+.03))/(v*(2.43*v+.59)+.14)));output[i]=255*(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055);}
  const normalized=(x,y,z)=>{const l=Math.hypot(x,y,z);return[x/l,y/l,z/l];};
  const key=normalized(-3,4.45,5),fill=normalized(4,1.45,4),lights=[{dir:key,rgb:[3.4,3.13,2.70],shadow:true},{dir:fill,rgb:[.70,.83,.92],shadow:false}];
  function softbox(direction,w,h,rgb){const right=normalized(direction[2],0,-direction[0]),up=[direction[1]*right[2],direction[2]*right[0]-direction[0]*right[2],-direction[1]*right[0]];return {direction,right,up,w,h,rgb};}
  const boxes=[softbox(normalized(-.48,.56,.68),.21,.43,[5.8,5.55,5.0]),softbox(normalized(.62,.28,.73),.13,.34,[3.0,3.5,3.9])];
  function allocate(){const scale=Math.min(1,850/displayWidth)*quality;width=Math.max(1,Math.round(displayWidth*scale));height=Math.max(1,Math.round(displayHeight*scale));canvas.width=width;canvas.height=height;image=ctx.createImageData(width,height);depth=new Float32Array(width*height);owner=new Uint16Array(width*height);world=new Float32Array(width*height*3);normalBuffer=new Float32Array(width*height*3);uvBuffer=new Float32Array(width*height*2);}
  function materialId(m){
    if(materialIds.has(m))return materialIds.get(m);const id=materials.length;materialIds.set(m,id);
    materials.push({source:m,color:[m.color.r,m.color.g,m.color.b],rough:Math.max(.045,m.roughness??.6),metal:m.metalness||0,coat:m.clearcoat||0,basic:!!m.isMeshBasicMaterial,tex:m.map&&m.map.userData.pixels,surface:m.userData.softwareSurface,emissive:m.emissive?[m.emissive.r*(m.emissiveIntensity??1),m.emissive.g*(m.emissiveIntensity??1),m.emissive.b*(m.emissiveIntensity??1)]:[0,0,0]});return id;
  }
  function project(source,destination,matrix,w,h){
    const e=matrix.elements;
    for(let i=0;i<source.length;i+=3){const x=source[i],y=source[i+1],z=source[i+2],inv=1/(e[3]*x+e[7]*y+e[11]*z+e[15]),at=i/3*4;destination[at]=((e[0]*x+e[4]*y+e[8]*z+e[12])*inv*.5+.5)*w;destination[at+1]=(-(e[1]*x+e[5]*y+e[9]*z+e[13])*inv*.5+.5)*h;destination[at+2]=(e[2]*x+e[6]*y+e[10]*z+e[14])*inv;destination[at+3]=inv;}
  }
  function triangle(record,ia,ib,ic,id,shadow){
    const s=shadow?record.shadow:record.screen,w=shadow?shadowSize:width,h=shadow?shadowSize:height,zbuffer=shadow?shadowDepth:depth;
    const a=ia*4,b=ib*4,c=ic*4,x0=s[a],y0=s[a+1],x1=s[b],y1=s[b+1],x2=s[c],y2=s[c+1],area=(x1-x0)*(y2-y0)-(y1-y0)*(x2-x0);
    if(Math.abs(area)<1e-8||(!shadow&&area>=0&&materials[id].source.side!==T.DoubleSide))return;
    if(s[a+3]<=0||s[b+3]<=0||s[c+3]<=0)return;
    const minX=Math.max(0,Math.floor(Math.min(x0,x1,x2))),maxX=Math.min(w-1,Math.ceil(Math.max(x0,x1,x2))),minY=Math.max(0,Math.floor(Math.min(y0,y1,y2))),maxY=Math.min(h-1,Math.ceil(Math.max(y0,y1,y2)));
    if(minX>maxX||minY>maxY)return;
    const den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2),dx0=(y1-y2)/den,dy0=(x2-x1)/den,dx1=(y2-y0)/den,dy1=(x0-x2)/den;
    let row0=((y1-y2)*(minX+.5-x2)+(x2-x1)*(minY+.5-y2))/den,row1=((y2-y0)*(minX+.5-x2)+(x0-x2)*(minY+.5-y2))/den;
    const p=record.world,n=record.normals,uv=record.geometry.attributes.uv,flip=area>=0?-1:1;
    for(let yy=minY;yy<=maxY;yy++){
      let b0=row0,b1=row1;
      for(let xx=minX;xx<=maxX;xx++){
        const b2=1-b0-b1;
        if(b0>=-1e-6&&b1>=-1e-6&&b2>=-1e-6){
          const zz=b0*s[a+2]+b1*s[b+2]+b2*s[c+2],at=yy*w+xx;
          if(zz>=-1&&zz<=1&&zz<zbuffer[at]){
            zbuffer[at]=zz;
            if(!shadow){
              const sum=b0*s[a+3]+b1*s[b+3]+b2*s[c+3],q0=b0*s[a+3]/sum,q1=b1*s[b+3]/sum,q2=b2*s[c+3]/sum,o=at*3;
              owner[at]=id;
              for(let k=0;k<3;k++){world[o+k]=q0*p[ia*3+k]+q1*p[ib*3+k]+q2*p[ic*3+k];normalBuffer[o+k]=flip*(q0*n[ia*3+k]+q1*n[ib*3+k]+q2*n[ic*3+k]);}
              if(uv){uvBuffer[at*2]=q0*uv.getX(ia)+q1*uv.getX(ib)+q2*uv.getX(ic);uvBuffer[at*2+1]=q0*uv.getY(ia)+q1*uv.getY(ib)+q2*uv.getY(ic);}else{uvBuffer[at*2]=uvBuffer[at*2+1]=0;}
            }
          }
        }
        b0+=dx0;b1+=dx1;
      }
      row0+=dy0;row1+=dy1;
    }
  }
  function visibility(x,y,z,nl){
    const sx=((se[0]*x+se[4]*y+se[8]*z+se[12])*.5+.5)*(shadowSize-1),sy=(-(se[1]*x+se[5]*y+se[9]*z+se[13])*.5+.5)*(shadowSize-1),sz=se[2]*x+se[6]*y+se[10]*z+se[14]-(.004+.004*(1-nl));
    if(sx<1||sy<1||sx>=shadowSize-2||sy>=shadowSize-2)return 1;const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
    const a=sz<=shadowDepth[iy*shadowSize+ix]?1:0,b=sz<=shadowDepth[iy*shadowSize+ix+1]?1:0,c=sz<=shadowDepth[(iy+1)*shadowSize+ix]?1:0,d=sz<=shadowDepth[(iy+1)*shadowSize+ix+1]?1:0;
    return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;
  }
  function rectWeight(box,x,y,z,rough){
    const forward=x*box.direction[0]+y*box.direction[1]+z*box.direction[2];if(forward<=.02)return 0;
    const u=Math.abs((x*box.right[0]+y*box.right[1]+z*box.right[2])/forward),v=Math.abs((x*box.up[0]+y*box.up[1]+z*box.up[2])/forward),blur=.016+rough*rough*.65;
    let a=Math.max(0,Math.min(1,(box.w+blur-u)/(2*blur))),b=Math.max(0,Math.min(1,(box.h+blur-v)/(2*blur)));a=a*a*(3-2*a);b=b*b*(3-2*b);return a*b;
  }
  function shade(camera){
    const cp=camera.matrixWorld.elements,pixels=image.data,offsets=[[-5,0],[5,0],[0,-5],[0,5]];
    for(let at=0;at<owner.length;at++){
      const id=owner[at];if(!id)continue;const m=materials[id],o=at*3,x=world[o],y=world[o+1],z=world[o+2];
      let nx=normalBuffer[o],ny=normalBuffer[o+1],nz=normalBuffer[o+2],nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
      let ar=m.color[0],ag=m.color[1],ab=m.color[2],rough=m.rough,ti=0;
      if(m.tex){
        const tex=m.tex,u=uvBuffer[at*2],v=uvBuffer[at*2+1],fx=(u-Math.floor(u))*(tex.width-1),fy=(1-v+Math.floor(v))*(tex.height-1),ix=Math.floor(fx),iy=Math.floor(fy),dx=fx-ix,dy=fy-iy;
        const p0=(iy*tex.width+ix)*4,p1=(iy*tex.width+Math.min(tex.width-1,ix+1))*4,p2=(Math.min(tex.height-1,iy+1)*tex.width+ix)*4,p3=(Math.min(tex.height-1,iy+1)*tex.width+Math.min(tex.width-1,ix+1))*4;
        const sample=k=>srgb[Math.min(255,Math.max(0,Math.round((tex.data[p0+k]*(1-dx)+tex.data[p1+k]*dx)*(1-dy)+(tex.data[p2+k]*(1-dx)+tex.data[p3+k]*dx)*dy)))];
        ar*=sample(0);ag*=sample(1);ab*=sample(2);ti=iy*tex.width+ix;
        if(tex.rough)rough*=tex.rough[ti];
        if(m.surface){
          const s=m.surface,strength=s.bump*tex.width*.65,gx=tex.gradX[ti]*strength,gy=tex.gradY[ti]*strength;
          let tx=nz,tz=-nx,tl=Math.hypot(tx,tz);if(tl<.01){tx=1;tz=0;tl=1;}tx/=tl;tz/=tl;
          const bx=ny*tz,by=nz*tx-nx*tz,bz=-ny*tx;
          nx+=gx*tx+gy*bx;ny+=gy*by;nz+=gx*tz+gy*bz;nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
        }
      }
      let cr=0,cg=0,cb=0;
      if(m.basic){cr=ar;cg=ag;cb=ab;}else{
        let vx=cp[12]-x,vy=cp[13]-y,vz=cp[14]-z;const vl=Math.hypot(vx,vy,vz)||1;vx/=vl;vy/=vl;vz/=vl;const nv=Math.max(.001,nx*vx+ny*vy+nz*vz);
        const f0r=.04*(1-m.metal)+ar*m.metal,f0g=.04*(1-m.metal)+ag*m.metal,f0b=.04*(1-m.metal)+ab*m.metal;
        let occ=0;const px=at%width,py=Math.floor(at/width);
        for(const [dx,dy]of offsets){const xx=px+dx,yy=py+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const other=yy*width+xx;if(!owner[other])continue;const t=other*3,ox=world[t]-x,oy=world[t+1]-y,oz=world[t+2]-z,dist=Math.hypot(ox,oy,oz);if(dist>.008&&dist<.30)occ+=Math.max(0,(nx*ox+ny*oy+nz*oz-.012)/dist)*(1-dist/.30);}
        const ao=1-Math.min(.38,occ*.27),ambient=(.32+.12*Math.max(0,ny))*ao*(1-m.metal);
        cr=ar*ambient;cg=ag*ambient;cb=ab*ambient;
        const alpha=rough*rough,a2=alpha*alpha;
        for(const light of lights){
          const l=light.dir,dotNL=Math.max(0,nx*l[0]+ny*l[1]+nz*l[2]);if(dotNL<=0)continue;
          let hx=vx+l[0],hy=vy+l[1],hz=vz+l[2],len=Math.hypot(hx,hy,hz);hx/=len;hy/=len;hz/=len;
          const nh=Math.max(0,nx*hx+ny*hy+nz*hz),vh=Math.max(0,vx*hx+vy*hy+vz*hz),a=1-vh,aa=a*a,f=a*aa*aa,den=nh*nh*(a2-1)+1,D=a2/(Math.PI*den*den+.000001);
          const G=.5/(dotNL*Math.sqrt(a2+(1-a2)*nv*nv)+nv*Math.sqrt(a2+(1-a2)*dotNL*dotNL)+.00001);
          const shadow=light.shadow ? .16+.84*visibility(x,y,z,dotNL) : 1,scale=dotNL*shadow,fsr=f0r+(1-f0r)*f,fsg=f0g+(1-f0g)*f,fsb=f0b+(1-f0b)*f;
          const diff=(1-m.metal)/Math.PI*ao;
          cr+=((1-fsr)*ar*diff+D*G*fsr)*light.rgb[0]*scale;cg+=((1-fsg)*ag*diff+D*G*fsg)*light.rgb[1]*scale;cb+=((1-fsb)*ab*diff+D*G*fsb)*light.rgb[2]*scale;
        }
        const rx=2*nv*nx-vx,ry=2*nv*ny-vy,rz=2*nv*nz-vz,one=1-nv,pow=one*one*one*one*one;
        let er=.12+.10*Math.max(0,ry),eg=.14+.11*Math.max(0,ry),eb=.13+.10*Math.max(0,ry);
        for(const box of boxes){const w=rectWeight(box,rx,ry,rz,rough);er+=box.rgb[0]*w;eg+=box.rgb[1]*w;eb+=box.rgb[2]*w;}
        const attenuation=1-.55*rough*rough,fr=f0r+(1-f0r)*pow,fg=f0g+(1-f0g)*pow,fb=f0b+(1-f0b)*pow;
        cr+=er*fr*attenuation;cg+=eg*fg*attenuation;cb+=eb*fb*attenuation;
        if(m.coat){let wr=.06,wg=.07,wb=.07;for(const box of boxes){const w=rectWeight(box,rx,ry,rz,.04);wr+=box.rgb[0]*w;wg+=box.rgb[1]*w;wb+=box.rgb[2]*w;}const c=m.coat*(.04+.96*pow);cr=cr*(1-c)+wr*c;cg=cg*(1-c)+wg*c;cb=cb*(1-c)+wb*c;}
      }
      cr+=m.emissive[0];cg+=m.emissive[1];cb+=m.emissive[2];const pixel=at*4;
      pixels[pixel]=output[Math.min(8192,Math.max(0,Math.round(cr*1024)))];pixels[pixel+1]=output[Math.min(8192,Math.max(0,Math.round(cg*1024)))];pixels[pixel+2]=output[Math.min(8192,Math.max(0,Math.round(cb*1024)))];pixels[pixel+3]=255;
    }
  }
  const renderer={
    domElement:canvas,setPixelRatio(){},
    setSize(w,h){displayWidth=w;displayHeight=h;allocate();},
    setQuality(q){q=Math.max(.5,Math.min(1,q));if(Math.abs(q-quality)>.01){quality=q;allocate();}},
    getStats(){return {...stats};},
    render(scene,camera){
      const began=performance.now();scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);depth.fill(Infinity);owner.fill(0);image.data.fill(0);shadowDepth.fill(Infinity);const records=[];stats.triangles=0;
      scene.traverseVisible(object=>{
        if(!object.isMesh||object.material.isShadowMaterial)return;const geometry=object.geometry,p=geometry.attributes.position,n=geometry.attributes.normal;if(!p)return;
        let work=object.userData.pbrWork;if(!work||work.world.length!==p.count*3)work=object.userData.pbrWork={world:new Float32Array(p.count*3),normals:new Float32Array(p.count*3),screen:new Float32Array(p.count*4),shadow:new Float32Array(p.count*4)};
        const e=object.matrixWorld.elements;normalMatrix.getNormalMatrix(object.matrixWorld);const nm=normalMatrix.elements;
        for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),at=i*3;work.world[at]=e[0]*x+e[4]*y+e[8]*z+e[12];work.world[at+1]=e[1]*x+e[5]*y+e[9]*z+e[13];work.world[at+2]=e[2]*x+e[6]*y+e[10]*z+e[14];const ax=n?n.getX(i):0,ay=n?n.getY(i):0,az=n?n.getZ(i):1;let nx=nm[0]*ax+nm[3]*ay+nm[6]*az,ny=nm[1]*ax+nm[4]*ay+nm[7]*az,nz=nm[2]*ax+nm[5]*ay+nm[8]*az,len=Math.hypot(nx,ny,nz)||1;work.normals[at]=nx/len;work.normals[at+1]=ny/len;work.normals[at+2]=nz/len;}
        project(work.world,work.screen,vp,width,height);project(work.world,work.shadow,shadowVP,shadowSize,shadowSize);const record={...work,geometry,object};records.push(record);
        const index=geometry.index&&geometry.index.array,count=index?index.length:p.count;stats.triangles+=count/3;
        for(let i=0;i<count;i+=3)triangle(record,index?index[i]:i,index?index[i+1]:i+1,index?index[i+2]:i+2,0,true);
      });
      for(const record of records){const g=record.geometry,index=g.index&&g.index.array,count=index?index.length:g.attributes.position.count,groups=g.groups.length?g.groups:[{start:0,count,materialIndex:0}];for(const group of groups){const m=Array.isArray(record.object.material)?record.object.material[group.materialIndex]:record.object.material;if(!m||m.visible===false)continue;const id=materialId(m);for(let i=group.start;i<group.start+group.count;i+=3)triangle(record,index?index[i]:i,index?index[i+1]:i+1,index?index[i+2]:i+2,id,false);}}
      shade(camera);ctx.putImageData(image,0,0);
      const p=new T.Vector3(0,-1.13,.05).applyMatrix4(vp),companion=scene.getObjectByName('CopperCapCompanion'),lift=companion?Math.max(0,companion.position.y):0;
      ctx.save();ctx.globalCompositeOperation='destination-over';ctx.translate((p.x*.5+.5)*width,(-p.y*.5+.5)*height);ctx.scale(width*.075*(1+lift),height*.021*(1+lift));const shadow=ctx.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,'rgba(15,20,24,'+(.22-lift*.18)+')');shadow.addColorStop(1,'rgba(15,20,24,0)');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();stats.meshes=records.length;stats.renderMs=performance.now()-began;
    }
  };return renderer;
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCompanionSoftwareRenderer};
