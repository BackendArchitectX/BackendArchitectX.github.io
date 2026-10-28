/* Subtle procedural material detail: fine grain and brushing, with no character bitmap. */
function createCompanionSurfaces(T,createCanvas){
  const definitions={
    olive:{rgb:[174,181,139],rough:.62,metal:.16,bump:.0025},
    copper:{rgb:[178,81,49],rough:.48,metal:.66,bump:.0035},
    copperDark:{rgb:[112,55,34],rough:.63,metal:.52,bump:.003},
    brass:{rgb:[173,137,83],rough:.37,metal:.80,bump:.002},
    lining:{rgb:[59,66,51],rough:.77,metal:.22,bump:.003}
  },cache={};
  const fract=v=>v-Math.floor(v),noise=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
  function get(role){
    if(cache[role])return cache[role];const d=definitions[role],size=256;
    const c=createCanvas(size,size),ctx=c.getContext('2d'),pixels=ctx.createImageData(size,size),height=new Float32Array(size*size),rough=new Float32Array(size*size);
    const bumpCanvas=createCanvas(size,size),bctx=bumpCanvas.getContext('2d'),bp=bctx.createImageData(size,size),roughCanvas=createCanvas(size,size),rctx=roughCanvas.getContext('2d'),rp=rctx.createImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const at=y*size+x,i=at*4,fine=noise(x,y)-.5,broad=Math.sin(x*.083)*Math.sin(y*.061)+.45*Math.sin(x*.029+y*.047),brush=role==='olive'?0:Math.sin(y*2.1+Math.sin(x*.015))*.007;
      const modulation=1+broad*.026+fine*.023+brush;
      for(let k=0;k<3;k++)pixels.data[i+k]=d.rgb[k]*modulation;pixels.data[i+3]=255;
      height[at]=.5+fine*.065+broad*.025+brush;rough[at]=.89+fine*.07;
      bp.data[i]=bp.data[i+1]=bp.data[i+2]=height[at]*255;bp.data[i+3]=255;
      rp.data[i]=rp.data[i+1]=rp.data[i+2]=rough[at]*255;rp.data[i+3]=255;
    }
    ctx.putImageData(pixels,0,0);bctx.putImageData(bp,0,0);rctx.putImageData(rp,0,0);
    const gradX=new Float32Array(size*size),gradY=new Float32Array(size*size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x;gradX[i]=height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size];gradY[i]=height[(y+1)%size*size+x]-height[(y+size-1)%size*size+x];}
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;
    const data={data:pixels.data,width:size,height:size,gradX,gradY,rough};map.userData.pixels=data;
    const bumpMap=new T.CanvasTexture(bumpCanvas),roughnessMap=new T.CanvasTexture(roughCanvas);for(const t of[bumpMap,roughnessMap]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;}
    return cache[role]={map,bumpMap,roughnessMap,data,definition:d};
  }
  function apply(material,role,tint=1){
    const s=get(role);material.color.setRGB(tint,tint,tint);material.map=s.map;material.bumpMap=s.bumpMap;material.roughnessMap=s.roughnessMap;material.roughness=s.definition.rough;material.metalness=s.definition.metal;material.bumpScale=s.definition.bump;material.envMapIntensity=.9;material.vertexColors=false;material.userData.softwareSurface={data:s.data,bump:s.definition.bump};material.needsUpdate=true;return material;
  }
  return {apply,get};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createCompanionSurfaces};
