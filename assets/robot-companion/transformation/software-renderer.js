/* Geometry projection fallback: the same articulated mesh, without WebGL. */
function createCompanionSoftwareRenderer(T, canvas) {
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('A drawing context is unavailable.');
  let width=640,height=420,image,depth;
  const normalMatrix=new T.Matrix3(), vp=new T.Matrix4();
  const vertex=new T.Vector3(), normal=new T.Vector3();
  const light=new T.Vector3(-.8,1.3,1.4).normalize(),fill=new T.Vector3(.8,.3,1).normalize();
  const halfway=light.clone().add(new T.Vector3(0,.12,1).normalize()).normalize();
  return {
    domElement:canvas,
    setPixelRatio(){},
    setSize(w,h){const scale=Math.min(1,900/w);width=Math.round(w*scale);height=Math.round(h*scale);canvas.width=width;canvas.height=height;image=ctx.createImageData(width,height);depth=new Float32Array(width*height);},
    render(scene,camera){
      scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
      image.data.fill(0);depth.fill(Infinity);
      const pixels=image.data;
      scene.traverse(object=>{
        if(!object.isMesh||!object.visible||object.material.isShadowMaterial)return;
        const g=object.geometry,positions=g.attributes.position,normals=g.attributes.normal,index=g.index,uv=g.attributes.uv,colors=g.attributes.color;
        if(!positions)return;
        normalMatrix.getNormalMatrix(object.matrixWorld);
        let work=object.userData.softwareWork;
        if(!work||work.lights.length!==positions.count)work=object.userData.softwareWork={screen:new Float32Array(positions.count*3),lights:new Float32Array(positions.count),specular:new Float32Array(positions.count)};
        const {screen,lights,specular}=work;
        for(let i=0;i<positions.count;i++){
          vertex.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld).applyMatrix4(vp);
          screen[i*3]=(vertex.x*.5+.5)*width;screen[i*3+1]=(-vertex.y*.5+.5)*height;screen[i*3+2]=vertex.z;
          if(normals){normal.fromBufferAttribute(normals,i).applyMatrix3(normalMatrix).normalize();lights[i]=.38+.78*Math.max(0,normal.dot(light))+.14*Math.max(0,normal.dot(fill));specular[i]=Math.max(0,normal.dot(halfway));}else lights[i]=.8;
          if(colors)lights[i]*=colors.getX(i);
        }
        const count=index?index.count:positions.count;
        const groups=g.groups.length?g.groups:[{start:0,count,materialIndex:0}];
        for(const group of groups){
          const material=Array.isArray(object.material)?object.material[group.materialIndex]:object.material;
          if(!material)continue;
          const hex=material.color?material.color.getHex():0x999999;
          const rgb=[(hex>>16)&255,(hex>>8)&255,hex&255];
          const tex=material.map&&material.map.userData.pixels;
          const shininess=5+Math.pow(1-(material.roughness??.7),3)*100;
          const shine=.025+.10*(material.metalness||0)+.19*(material.clearcoat||0);
          const vertexColor=(i,k)=>material.isMeshBasicMaterial?rgb[k]:Math.min(255,rgb[k]*lights[i]+255*shine*Math.pow(specular[i],shininess));
          for(let i=group.start;i<Math.min(count,group.start+group.count);i+=3){
            const a=(index?index.getX(i):i)*3,b=(index?index.getX(i+1):i+1)*3,c=(index?index.getX(i+2):i+2)*3;
            const area=(screen[b]-screen[a])*(screen[c+1]-screen[a+1])-(screen[b+1]-screen[a+1])*(screen[c]-screen[a]);
            if(area>=0&&material.side!==T.DoubleSide)continue;
            const z=(screen[a+2]+screen[b+2]+screen[c+2])/3;if(z>1||z< -1)continue;
            const x0=screen[a],y0=screen[a+1],x1=screen[b],y1=screen[b+1],x2=screen[c],y2=screen[c+1];
            const minX=Math.max(0,Math.floor(Math.min(x0,x1,x2))),maxX=Math.min(width-1,Math.ceil(Math.max(x0,x1,x2)));
            const minY=Math.max(0,Math.floor(Math.min(y0,y1,y2))),maxY=Math.min(height-1,Math.ceil(Math.max(y0,y1,y2)));
            if(minX>maxX||minY>maxY||Math.abs(area)<1e-8)continue;
            const denominator=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2);
            const dx0=(y1-y2)/denominator,dy0=(x2-x1)/denominator,dx1=(y2-y0)/denominator,dy1=(x0-x2)/denominator;
            let row0=((y1-y2)*(minX+.5-x2)+(x2-x1)*(minY+.5-y2))/denominator;
            let row1=((y2-y0)*(minX+.5-x2)+(x0-x2)*(minY+.5-y2))/denominator;
            const ca=[vertexColor(a/3,0),vertexColor(a/3,1),vertexColor(a/3,2)],cb=[vertexColor(b/3,0),vertexColor(b/3,1),vertexColor(b/3,2)],cc=[vertexColor(c/3,0),vertexColor(c/3,1),vertexColor(c/3,2)];
            const ua=uv?uv.getX(a/3):0,va=uv?uv.getY(a/3):0,ub=uv?uv.getX(b/3):0,vb=uv?uv.getY(b/3):0,uc=uv?uv.getX(c/3):0,vc=uv?uv.getY(c/3):0;
            for(let yy=minY;yy<=maxY;yy++){
              let w0=row0,w1=row1;
              for(let xx=minX;xx<=maxX;xx++){
                const w2=1-w0-w1;
                if(w0>=-1e-5&&w1>=-1e-5&&w2>=-1e-5){
                  const zz=w0*screen[a+2]+w1*screen[b+2]+w2*screen[c+2],at=yy*width+xx;
                  if(zz<depth[at]){
                    depth[at]=zz;const pixel=at*4;
                    if(tex&&uv){
                      const u=w0*ua+w1*ub+w2*uc,v=w0*va+w1*vb+w2*vc;
                      const fx=(u-Math.floor(u))*(tex.width-1),fy=(1-v+Math.floor(v))*(tex.height-1),tx=Math.floor(fx),ty=Math.floor(fy),dx=fx-tx,dy=fy-ty;
                      const ti=(ty*tex.width+tx)*4,tx1=Math.min(tex.width-1,tx+1)*4,ty1=Math.min(tex.height-1,ty+1)*tex.width*4,lum=(w0*lights[a/3]+w1*lights[b/3]+w2*lights[c/3])*1.13;
                      const reflection=255*shine*Math.pow(w0*specular[a/3]+w1*specular[b/3]+w2*specular[c/3],shininess);
                      for(let k=0;k<3;k++){
                        const sample=(tex.data[ti+k]*(1-dx)+tex.data[ty*tex.width*4+tx1+k]*dx)*(1-dy)+(tex.data[ty1+tx*4+k]*(1-dx)+tex.data[ty1+tx1+k]*dx)*dy;
                        pixels[pixel+k]=Math.min(255,sample*rgb[k]/255*lum+reflection);
                      }
                    }else{pixels[pixel]=w0*ca[0]+w1*cb[0]+w2*cc[0];pixels[pixel+1]=w0*ca[1]+w1*cb[1]+w2*cc[1];pixels[pixel+2]=w0*ca[2]+w1*cb[2]+w2*cc[2];}
                    pixels[pixel+3]=255;
                  }
                }
                w0+=dx0;w1+=dx1;
              }
              row0+=dy0;row1+=dy1;
            }
          }
        }
      });
      ctx.putImageData(image,0,0);
      const companion=scene.getObjectByName('CopperCapCompanion');
      const lift=companion?Math.max(0,companion.position.y):0;
      vertex.set(0,-1.13,.05).applyMatrix4(vp);
      const px=(vertex.x*.5+.5)*width,py=(-vertex.y*.5+.5)*height;
      ctx.save();ctx.globalCompositeOperation='destination-over';ctx.translate(px,py);ctx.scale(width*.075*(1+lift),height*.021*(1+lift));
      const shadow=ctx.createRadialGradient(0,0,0,0,0,1);shadow.addColorStop(0,'rgba(15,20,24,'+(.22-lift*.18)+')');shadow.addColorStop(1,'rgba(15,20,24,0)');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  };
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCompanionSoftwareRenderer};
