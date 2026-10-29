/* Independent spherical eyes and textured eyelids for the supplied character. */
function createCompanionDetailRig(T,model,options={}){
  const source=model.mesh.geometry,p=source.attributes.position,uv=source.attributes.uv,pixels=options.pixels;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),linear=x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);
  const eyeCenters=[new T.Vector3(-.091,.206,.164),new T.Vector3(.088,.206,.166)];
  const globeRadius=.0485,globeDepth=.0455,irisRadius=.0385,pupilRadius=.029;
  let hand=null,leftHand=null;
  if(options.handData){
    const data=options.handData;
    if(data.revision!=='relaxed-textured-v3'||data.positions.length!==data.normals.length||data.colors.length!==data.positions.length||data.indices.length%3)throw Error('The refined hand file is invalid.');
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));geometry.setAttribute('color',new T.Uint8BufferAttribute(data.colors,3,true));geometry.setIndex(data.indices);geometry.computeBoundingSphere();
    const material=new T.MeshStandardMaterial({color:new T.Color().setRGB(.96,1,.93),vertexColors:true,roughness:.69,metalness:0});material.name='Detailed organic hand';
    hand=new T.Mesh(geometry,material);hand.name='RelaxedRightHand';hand.castShadow=true;hand.receiveShadow=true;model.body.add(hand);
    if(data.left){const d=data.left;if(d.positions.length!==d.normals.length||d.colors.length!==d.positions.length||d.indices.length%3)throw Error('The hanging hand file is invalid.');const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(d.positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(d.normals,3));g.setAttribute('color',new T.Uint8BufferAttribute(d.colors,3,true));g.setIndex(d.indices);g.computeBoundingSphere();leftHand=new T.Mesh(g,material);leftHand.name='RelaxedLeftHand';leftHand.castShadow=true;leftHand.receiveShadow=true;model.body.add(leftHand);}
    const index=source.index.array,kept=[],groups=[];for(const group of source.groups){if(group.materialIndex===3)continue;const start=kept.length;for(let i=group.start;i<group.start+group.count;i+=3){const ids=[index[i],index[i+1],index[i+2]],x=ids.reduce((s,k)=>s+p.getX(k),0)/3,y=ids.reduce((s,k)=>s+p.getY(k),0)/3,oldLeft=leftHand&&y<-.297&&Math.pow((x-.184)/.034,2)+Math.pow((y+.350)/.070,2)<1.15;if(!oldLeft)kept.push(...ids);}if(kept.length>start)groups.push({start,count:kept.length-start,materialIndex:group.materialIndex});}source.setIndex(kept);source.clearGroups();for(const group of groups)source.addGroup(group.start,group.count,group.materialIndex);
  }
  // A small sculpted smile: lift the mouth corners and soften the protruding
  // central lip, preserving the source UVs and all armour positions.
  const sourceNormals=source.attributes.normal;
  function faceOffset(x,y,z){const front=clamp((z-.125)/.030,0,1),mouth=Math.exp(-Math.pow((y-.064)/.019,2)),width=Math.exp(-Math.pow(x/.061,4)),corners=Math.pow(Math.min(1,Math.abs(x)/.040),1.7);return[.0090*mouth*width*corners*front,-.0080*Math.exp(-Math.pow(x/.039,2)-Math.pow((y-.064)/.022,2))*front];}
  const j=new T.Matrix3(),normal=new T.Vector3(),step=.0001;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(Math.abs(x)>.095||y<.012||y>.115||z<.125)continue;const d=faceOffset(x,y,z);if(Math.abs(d[0])+Math.abs(d[1])<.00001)continue;const dx1=faceOffset(x+step,y,z),dx0=faceOffset(x-step,y,z),dy1=faceOffset(x,y+step,z),dy0=faceOffset(x,y-step,z),dz1=faceOffset(x,y,z+step),dz0=faceOffset(x,y,z-step);j.set(1,0,0,(dx1[0]-dx0[0])/(2*step),1+(dy1[0]-dy0[0])/(2*step),(dz1[0]-dz0[0])/(2*step),(dx1[1]-dx0[1])/(2*step),(dy1[1]-dy0[1])/(2*step),1+(dz1[1]-dz0[1])/(2*step)).invert().transpose();normal.fromBufferAttribute(sourceNormals,i).applyMatrix3(j).normalize();sourceNormals.setXYZ(i,normal.x,normal.y,normal.z);p.setXYZ(i,x,y+d[0],z+d[1]);}sourceNormals.needsUpdate=true;
  const skinSamples=[];
  if(pixels&&uv){
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      if(y<.13||y>.28||z<.10||Math.abs(x)>.17)continue;
      const ix=clamp(Math.round(uv.getX(i)*(pixels.width-1)),0,pixels.width-1),iy=clamp(Math.round(uv.getY(i)*(pixels.height-1)),0,pixels.height-1),at=(iy*pixels.width+ix)*4;
      const r=pixels.data[at]/255,g=pixels.data[at+1]/255,b=pixels.data[at+2]/255;
      const inOldEye=eyeCenters.some(c=>Math.pow((x-c.x)/.069,2)+Math.pow((y-c.y)/.055,2)<1.08);
      if(!inOldEye&&source.attributes.normal.getZ(i)>.12&&g>.9*r&&g>1.01*b&&Math.max(r,g,b)<.73&&r+g+b>.45)skinSamples.push({x,y,z,color:[linear(r),linear(g),linear(b)]});
    }
  }
  function skinColor(x,y,z){
    const near=[{d:Infinity},{d:Infinity},{d:Infinity},{d:Infinity}];
    for(const sample of skinSamples){const d=(sample.x-x)**2+(sample.y-y)**2+(sample.z-z)**2;if(d>=near[3].d)continue;let k=3;while(k>0&&d<near[k-1].d){near[k]=near[k-1];k--;}near[k]={d,color:sample.color};}
    const result=[0,0,0];let total=0;
    for(const s of near){if(!s.color)continue;const w=1/(s.d+.00003);total+=w;for(let k=0;k<3;k++)result[k]+=s.color[k]*w;}
    return total?result.map(v=>v/total):[.14,.16,.085];
  }
  function fitSocket(center){
    const samples=[];for(let i=0;i<p.count;i++){const x=(p.getX(i)-center.x)/.064,y=(p.getY(i)-center.y)/.050,r=Math.hypot(x,y),z=p.getZ(i);if(r>1.12&&r<1.7&&z>.105&&source.attributes.normal.getZ(i)>.22&&p.getX(i)*Math.sign(center.x)>.012)samples.push({v:[1,x,y,x*x,x*y,y*y],z});}
    let coeff=[.15,0,0,0,0,0];for(let pass=0;pass<3;pass++){const a=Array.from({length:6},()=>new Float64Array(7));for(const sample of samples){const error=Math.abs(sample.z-sample.v.reduce((s,v,k)=>s+v*coeff[k],0)),w=pass?Math.min(1,.007/(error+.0001)):1;for(let j=0;j<6;j++){for(let k=0;k<6;k++)a[j][k]+=w*sample.v[j]*sample.v[k];a[j][6]+=w*sample.v[j]*sample.z;}}for(let j=0;j<6;j++)a[j][j]+=.00001;for(let k=0;k<6;k++){let pivot=k;for(let j=k+1;j<6;j++)if(Math.abs(a[j][k])>Math.abs(a[pivot][k]))pivot=j;[a[k],a[pivot]]=[a[pivot],a[k]];const d=a[k][k]||1e-8;for(let j=k;j<7;j++)a[k][j]/=d;for(let row=0;row<6;row++)if(row!==k){const f=a[row][k];for(let j=k;j<7;j++)a[row][j]-=f*a[k][j];}}coeff=a.map(row=>row[6]);}
    return {center,at(x,y){const a=(x-center.x)/.064,b=(y-center.y)/.050;return clamp(coeff[0]+coeff[1]*a+coeff[2]*b+coeff[3]*a*a+coeff[4]*a*b+coeff[5]*b*b,.10,.205);}};
  }
  const sockets=eyeCenters.map(fitSocket),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  function lidSurface(socket,x,y){const face=socket.at(socket.center.x+x,socket.center.y+y)-socket.center.z,r2=(x*x+y*y)/(globeRadius*globeRadius);if(r2>=1)return face;const sphere=globeDepth*Math.sqrt(1-r2)+.0011,d=face-sphere;return .5*(face+sphere+Math.sqrt(d*d+.000012));}
  // Reuse the supplied skin texture on the new three-dimensional eyelids.
  function buildSkinTexture(){
    if(!pixels||!uv)return null;const size=512,minX=-.205,maxX=.205,minY=.025,maxY=.295,rgba=new Uint8Array(size*size*4),depth=new Float32Array(size*size);depth.fill(-Infinity);
    const sample=(u,v)=>{const fx=clamp(u,0,1)*(pixels.width-1),fy=clamp(v,0,1)*(pixels.height-1),ix=Math.floor(fx),iy=Math.floor(fy),dx=fx-ix,dy=fy-iy;return[0,1,2].map(k=>{const at=(x,y)=>pixels.data[(y*pixels.width+x)*4+k];return(at(ix,iy)*(1-dx)+at(Math.min(ix+1,pixels.width-1),iy)*dx)*(1-dy)+(at(ix,Math.min(iy+1,pixels.height-1))*(1-dx)+at(Math.min(ix+1,pixels.width-1),Math.min(iy+1,pixels.height-1))*dx)*dy;});};
    const idx=source.index.array;for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];if([a,b,c].some(k=>p.getZ(k)<.085))continue;const xx=[a,b,c].map(k=>(p.getX(k)-minX)/(maxX-minX)*(size-1)),yy=[a,b,c].map(k=>(p.getY(k)-minY)/(maxY-minY)*(size-1));const x0=Math.max(0,Math.floor(Math.min(...xx))),x1=Math.min(size-1,Math.ceil(Math.max(...xx))),y0=Math.max(0,Math.floor(Math.min(...yy))),y1=Math.min(size-1,Math.ceil(Math.max(...yy))),den=(yy[1]-yy[2])*(xx[0]-xx[2])+(xx[2]-xx[1])*(yy[0]-yy[2]);if(Math.abs(den)<1e-8)continue;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const w0=((yy[1]-yy[2])*(x-xx[2])+(xx[2]-xx[1])*(y-yy[2]))/den,w1=((yy[2]-yy[0])*(x-xx[2])+(xx[0]-xx[2])*(y-yy[2]))/den,w2=1-w0-w1;if(Math.min(w0,w1,w2)<-.00001)continue;const z=w0*p.getZ(a)+w1*p.getZ(b)+w2*p.getZ(c),at=y*size+x;if(z<=depth[at])continue;depth[at]=z;const rgb=sample(w0*uv.getX(a)+w1*uv.getX(b)+w2*uv.getX(c),w0*uv.getY(a)+w1*uv.getY(b)+w2*uv.getY(c));for(let k=0;k<3;k++)rgba[at*4+k]=rgb[k];rgba[at*4+3]=255;}}
    const original=rgba.slice(),get=(x,y)=>{const ix=clamp(Math.round((x-minX)/(maxX-minX)*(size-1)),0,size-1),iy=clamp(Math.round((y-minY)/(maxY-minY)*(size-1)),0,size-1),at=(iy*size+ix)*4;return original.slice(at,at+4);};
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const px=minX+x/(size-1)*(maxX-minX),py=minY+y/(size-1)*(maxY-minY),at=(y*size+x)*4;for(const center of eyeCenters){const dx=px-center.x,dy=py-center.y,r=Math.hypot(dx/.069,dy/.055);if(r>1.03)continue;const blend=1-smooth((r-.68)/.35),cheek=get(center.x+dx*.8,.103+dy*.72);if(cheek[3]){for(let k=0;k<3;k++)rgba[at+k]=original[at+3]?original[at+k]*(1-blend)+cheek[k]*blend:cheek[k];rgba[at+3]=255;}}if(!rgba[at+3]){const c=skinColor(px,py,.15);for(let k=0;k<3;k++)rgba[at+k]=255*(c[k]<=.0031308?12.92*c[k]:1.055*Math.pow(c[k],1/2.4)-.055);}const radius=Math.min(...eyeCenters.map(c=>Math.hypot((px-c.x)/.069,(py-c.y)/.055)));rgba[at+3]=255*(1-smooth((radius-.99)/.13));}
    const texture=new T.DataTexture(rgba,size,size,T.RGBAFormat);texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;texture.userData.pixels={data:rgba,width:size,height:size,flipY:false};return{texture,uv(x,y){return[(x-minX)/(maxX-minX),(y-minY)/(maxY-minY)];}};
  }
  const skinAtlas=buildSkinTexture();
  // Retire the painted, fused irises. Keep the original skin rims and face;
  // only the opaque eye-colour triangles are replaced by the new eye meshes.
  const retained=[],groups=[],oldIndex=source.index.array;let removedEyeFaces=0;
  for(const group of source.groups){const start=retained.length;for(let i=group.start;i<group.start+group.count;i+=3){const ids=[oldIndex[i],oldIndex[i+1],oldIndex[i+2]],x=ids.reduce((s,k)=>s+p.getX(k),0)/3,y=ids.reduce((s,k)=>s+p.getY(k),0)/3,z=ids.reduce((s,k)=>s+p.getZ(k),0)/3,inside=z>.13&&eyeCenters.some(c=>((x-c.x)/.062)**2+((y-c.y)/.045)**2<1);if(inside&&(group.materialIndex===2||group.materialIndex===0)){removedEyeFaces++;continue;}retained.push(...ids);}if(retained.length>start)groups.push({start,count:retained.length-start,materialIndex:group.materialIndex});}
  source.setIndex(retained);source.clearGroups();for(const group of groups)source.addGroup(group.start,group.count,group.materialIndex);
  // Seat the old angular skin rim just behind the new continuous lid surface.
  // Its texture coordinates and the surrounding face stay in place.
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(z<.12||y<.14||y>.27)continue;let next=z;for(const socket of sockets){const dx=x-socket.center.x,dy=y-socket.center.y,r=Math.hypot(dx/.069,dy/.055),w=1-smooth((r-.9)/.17);if(w){const cap=socket.center.z+lidSurface(socket,dx,dy)-.0025;next=Math.min(next,z+(Math.min(z,cap)-z)*w);}}p.setZ(i,next);}p.needsUpdate=true;source.computeBoundingSphere();

  function geometry(rows,segments,position,color,normal){
    const positions=[],colors=[],normals=[],indices=[];
    for(let i=0;i<=rows;i++)for(let j=0;j<=segments;j++){const u=i/rows,a=j/segments*Math.PI*2,v=position(u,a);positions.push(...v);if(color)colors.push(...color(u,a));if(normal)normals.push(...normal(u,a));}
    for(let i=0;i<rows;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));if(colors.length)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);if(normals.length)g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));else g.computeVertexNormals();return g;
  }
  function normalAt(r,a,dz){const v=new T.Vector3(-dz*Math.cos(a),-dz*Math.sin(a),1).normalize();return[v.x,v.y,v.z];}
  function convexZ(r){return globeDepth*Math.sqrt(Math.max(.00001,1-r*r/(globeRadius*globeRadius)));}
  function dzdr(r){return -globeDepth*r/(globeRadius*globeRadius*Math.sqrt(Math.max(.00001,1-r*r/(globeRadius*globeRadius))));}
  const globeMaterial=new T.MeshPhysicalMaterial({color:new T.Color().setRGB(linear(.29),linear(.30),linear(.15)),roughness:.6,metalness:0,specularIntensity:.2,clearcoat:.6,clearcoatRoughness:.07});
  const irisMaterial=new T.MeshPhysicalMaterial({vertexColors:true,roughness:.62,metalness:0,specularIntensity:.12,clearcoat:.85,clearcoatRoughness:.06});
  const pupilMaterial=new T.MeshPhysicalMaterial({color:new T.Color().setRGB(.0015,.0012,.0008),roughness:.7,metalness:0,specularIntensity:.04,clearcoat:.85,clearcoatRoughness:.06});
  const lidMaterial=new T.MeshStandardMaterial({color:new T.Color().setRGB(.96,1,.93),map:skinAtlas?.texture||null,vertexColors:true,roughness:.73,metalness:0,side:T.FrontSide,transparent:true,depthWrite:true,alphaTest:.003});
  const theta0=Math.asin(irisRadius/globeRadius);
  const globeGeometry=geometry(26,64,(u,a)=>{const theta=theta0+(Math.PI-theta0)*u;return[globeRadius*Math.sin(theta)*Math.cos(a),globeRadius*Math.sin(theta)*Math.sin(a),globeDepth*Math.cos(theta)];},null,(u,a)=>{const theta=theta0+(Math.PI-theta0)*u,v=new T.Vector3(Math.sin(theta)*Math.cos(a)/globeRadius,Math.sin(theta)*Math.sin(a)/globeRadius,Math.cos(theta)/globeDepth).normalize();return[v.x,v.y,v.z];});
  const irisGeometry=geometry(18,128,(u,a)=>{const r=pupilRadius+(irisRadius-pupilRadius)*u;return[r*Math.cos(a),r*Math.sin(a),convexZ(r)+.00015];},(u,a)=>{
    const fiber=.5+.5*Math.sin(a*87+.8*Math.sin(a*19)+u*4.6+.3*Math.sin(u*17));
    const fine=.5+.5*Math.sin(a*153+u*9+Math.sin(a*31));
    const crypt=Math.pow(.5+.5*Math.sin(a*43+u*25),6)*Math.exp(-Math.pow((u-.3)/.23,2));
    const rim=1-.65*Math.pow(clamp((u-.78)/.22,0,1),.7),brightness=(.72+.17*fiber+.06*fine-.07*crypt)*rim;
    return[linear(clamp((.52+.16*Math.sin(u*Math.PI))*brightness,0,1)),linear(clamp((.35+.15*Math.sin(u*Math.PI))*brightness,0,1)),linear(clamp((.10+.035*fine)*brightness,0,1))];
  },(u,a)=>{const r=pupilRadius+(irisRadius-pupilRadius)*u;return normalAt(r,a,dzdr(r));});
  const pupilGeometry=geometry(8,96,(u,a)=>{const r=pupilRadius*u;return[r*Math.cos(a),r*Math.sin(a),convexZ(r)+.00015-.00022*(1-u*u)];},null,(u,a)=>{const r=pupilRadius*u;return normalAt(r,a,dzdr(r)+.00044*u/pupilRadius);});
  const eyes=[];
  function makeLid(center,upper){
    const segments=96,border=Array.from({length:segments+1},(_,j)=>{const u=-1+2*j/segments;return{u,x:.0775*u,y:(upper?.062:-.062)*Math.sqrt(Math.max(0,1-u*u))};}),rows=20,front=(segments+1)*(rows+1),positions=new Float32Array(front*2*3),colors=new Float32Array(front*2*3),texcoords=new Float32Array(front*2*2),indices=[];
    for(let i=0;i<rows;i++)for(let j=0;j<segments;j++){const a=i*(segments+1)+j,b=a+segments+1;const tri=upper?[a,b,a+1,b,b+1,a+1]:[a,a+1,b,b,a+1,b+1];indices.push(...tri);for(let k=0;k<tri.length;k+=3)indices.push(tri[k]+front,tri[k+2]+front,tri[k+1]+front);}
    const perimeter=[];for(let j=0;j<=segments;j++)perimeter.push(j);for(let i=1;i<=rows;i++)perimeter.push(i*(segments+1)+segments);for(let j=segments-1;j>=0;j--)perimeter.push(rows*(segments+1)+j);for(let i=rows-1;i>0;i--)perimeter.push(i*(segments+1));
    for(let i=0;i<perimeter.length;i++){const a=perimeter[i],b=perimeter[(i+1)%perimeter.length];indices.push(a,a+front,b,b,a+front,b+front);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('color',new T.BufferAttribute(colors,3));if(skinAtlas)g.setAttribute('uv',new T.BufferAttribute(texcoords,2));g.setIndex(indices);
    const socket=sockets[eyeCenters.indexOf(center)];
    function surfaceAt(x,y){return lidSurface(socket,x,y);}
    let last=-1,coloured=false;
    function update(blink){if(Math.abs(blink-last)<.0001)return;last=blink;const close=clamp(blink,0,1),meet=-.0015,openHeight=upper?.033:-.0295,aperture=openHeight*(1-close)+meet*close;
      for(let i=0;i<=rows;i++)for(let j=0;j<=segments;j++){const t=i/rows,b=border[j],u=b.u,arch=Math.sqrt(Math.max(0,1-u*u)),innerX=.045*u,innerY=aperture*arch,x=b.x*(1-t)+innerX*t,y=b.y*(1-t)+innerY*t,z=surfaceAt(x,y);const at=(i*(segments+1)+j)*3;positions[at]=x;positions[at+1]=y;positions[at+2]=z;positions[at+front*3]=x;positions[at+front*3+1]=y;positions[at+front*3+2]=z-.0018;
        if(!coloured){const c=skinAtlas?[1,1,1]:skinColor(center.x+x,center.y+y,center.z+z),tone=1-.03*Math.pow(t,7);for(let k=0;k<3;k++){colors[at+k]=c[k]*tone;colors[at+front*3+k]=c[k]*tone*.78;}if(skinAtlas){const xy=skinAtlas.uv(center.x+x,center.y+y),ti=at/3*2;texcoords[ti]=texcoords[ti+front*2]=xy[0];texcoords[ti+1]=texcoords[ti+front*2+1]=xy[1];}}
      }
      coloured=true;g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true;g.computeVertexNormals();for(let i=0;i<front;i++){const x=positions[i*3],y=positions[i*3+1],h=.00008,n=new T.Vector3(-(surfaceAt(x+h,y)-surfaceAt(x-h,y))/(2*h),-(surfaceAt(x,y+h)-surfaceAt(x,y-h))/(2*h),1).normalize();g.attributes.normal.setXYZ(i,n.x,n.y,n.z);g.attributes.normal.setXYZ(i+front,-n.x,-n.y,-n.z);}g.attributes.normal.needsUpdate=true;g.computeBoundingSphere();
    }
    update(0);const mesh=new T.Mesh(g,lidMaterial);mesh.name=upper?'UpperEyelid':'LowerEyelid';mesh.userData.dynamicEye=true;mesh.castShadow=false;mesh.receiveShadow=true;mesh.renderOrder=5;return {mesh,update,positions,front,segments,rows,centerIndex:rows*(segments+1)+48};
  }
  for(let i=0;i<2;i++){
    const center=eyeCenters[i],socket=new T.Group();socket.name=i?'RightEyeSocket':'LeftEyeSocket';socket.position.copy(center).sub(model.head.position);model.head.add(socket);
    const pivot=new T.Bone();pivot.name=i?'Eye.R':'Eye.L';socket.add(pivot);
    const globe=new T.Mesh(globeGeometry,globeMaterial),iris=new T.Mesh(irisGeometry,irisMaterial),pupil=new T.Mesh(pupilGeometry,pupilMaterial);
    globe.name='Eyeball';iris.name='AmberIris';pupil.name='Pupil';
    for(const mesh of[globe,iris,pupil]){mesh.userData.dynamicEye=true;mesh.castShadow=true;mesh.receiveShadow=false;pivot.add(mesh);}
    const upper=makeLid(center,true),lower=makeLid(center,false);socket.add(upper.mesh,lower.mesh);
    eyes.push({socket,pivot,globe,iris,pupil,upper,lower,yaw:0,pitch:0});
  }
  const targetLocal=new T.Vector3();
  function update({target,dt=1/60,blink=0,snap=false}={}){
    model.root.updateMatrixWorld(true);
    const damping=snap?1:1-Math.exp(-Math.min(.25,Math.max(.001,dt))*28);let settling=false;
    for(const eye of eyes){const destination=target||new T.Vector3(0,.46,3);targetLocal.copy(destination);eye.socket.worldToLocal(targetLocal);const yaw=clamp(Math.atan2(targetLocal.x,Math.max(.01,targetLocal.z)),-.33,.33),pitch=clamp(-Math.atan2(targetLocal.y,Math.max(.01,Math.hypot(targetLocal.x,targetLocal.z))),-.24,.24);eye.yaw+=(yaw-eye.yaw)*damping;eye.pitch+=(pitch-eye.pitch)*damping;settling=settling||Math.abs(yaw-eye.yaw)+Math.abs(pitch-eye.pitch)>.0003;eye.pivot.rotation.set(eye.pitch,eye.yaw,0,'YXZ');eye.upper.update(blink);eye.lower.update(blink);eye.pivot.updateMatrixWorld(true);}
    model.root.updateMatrixWorld(true);return {leftYaw:eyes[0].yaw,rightYaw:eyes[1].yaw,leftPitch:eyes[0].pitch,rightPitch:eyes[1].pitch,blink,settling};
  }
  // Backing volume remains inside the existing armour silhouette.
  const backing=new T.Mesh(new T.SphereGeometry(1,32,24),new T.MeshStandardMaterial({color:new T.Color().setRGB(linear(.17),linear(.18),linear(.125)),roughness:.92,metalness:0}));backing.name='ArmourBacking';backing.position.set(0,-.155,.012);backing.scale.set(.142,.122,.103);model.body.add(backing);backing.castShadow=true;backing.receiveShadow=true;
  let triangles=0;model.root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});
  update({snap:true});
  return {eyes,update,removedEyeFaces,hand,leftHand,handRevision:hand?options.handData.revision:'source',triangleCount:triangles,revision:'gentle-expression-v5'};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCompanionDetailRig};
