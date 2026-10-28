/* Loader for the supplied, embedded-texture GLB and its two-joint preview rig. */
function readCompanionGLB(arrayBuffer) {
  const view=new DataView(arrayBuffer);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2)throw Error('The character file is not a GLB 2.0 asset.');
  const length=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(arrayBuffer,20,length)));
  const bin=28+length;
  const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},types={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
  function accessor(i){const a=json.accessors[i],b=json.bufferViews[a.bufferView],Ctor=types[a.componentType];if(!Ctor)throw Error('Unsupported character attribute.');return {array:new Ctor(arrayBuffer,bin+(b.byteOffset||0)+(a.byteOffset||0),a.count*sizes[a.type]).slice(),size:sizes[a.type],normalized:!!a.normalized};}
  function imageBytes(i){const im=json.images[i],b=json.bufferViews[im.bufferView];return {bytes:new Uint8Array(arrayBuffer,bin+(b.byteOffset||0),b.byteLength),mime:im.mimeType};}
  return {json,accessor,imageBytes};
}

async function createImportedCompanion(T,arrayBuffer,options={}) {
  const data=readCompanionGLB(arrayBuffer),j=data.json,primitive=j.meshes[0].primitives[0],g=new T.BufferGeometry();
  for(const [semantic,name] of Object.entries({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv',JOINTS_0:'skinIndex',WEIGHTS_0:'skinWeight',COLOR_0:'color'})){
    if(primitive.attributes[semantic]===undefined)continue;
    const a=data.accessor(primitive.attributes[semantic]);g.setAttribute(name,new T.BufferAttribute(a.array,a.size,a.normalized));
  }
  const parts=j.meshes[0].primitives.map(p=>({indices:data.accessor(p.indices).array,material:p.material||0}));
  const indices=new Uint32Array(parts.reduce((n,p)=>n+p.indices.length,0));let start=0;
  for(const part of parts){indices.set(part.indices,start);g.addGroup(start,part.indices.length,part.material);start+=part.indices.length;}
  g.setIndex(new T.BufferAttribute(indices,1));
  const textures=[];
  for(let i=0;i<j.images.length;i++){
    const source=data.imageBytes(i);let img;
    if(options.loadImage)img=await options.loadImage(source.bytes,source.mime);
    else{
      const url=URL.createObjectURL(new Blob([source.bytes],{type:source.mime}));
      try{img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('A character texture could not be decoded.'));im.src=url;});}
      finally{URL.revokeObjectURL(url);}
    }
    const canvas=options.createCanvas(img.width,img.height),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const texture=new T.CanvasTexture(canvas);texture.flipY=false;texture.anisotropy=options.anisotropy||1;texture.colorSpace=i===0?T.SRGBColorSpace:T.NoColorSpace;texture.userData.pixels=ctx.getImageData(0,0,img.width,img.height);texture.userData.pixels.flipY=false;textures.push(texture);
  }
  function textureAt(index){const source=j.textures[index].extensions?.EXT_texture_webp?.source??j.textures[index].source;return textures[source];}
  const materials=j.materials.map(source=>{
    const p=source.pbrMetallicRoughness||{},eye=source.name==='Amber eyes';
    const material=eye?new T.MeshPhysicalMaterial({clearcoat:.2,clearcoatRoughness:.18}):new T.MeshStandardMaterial();
    material.name=source.name||'Character surface';material.vertexColors=!!g.attributes.color;
    material.roughness=p.roughnessFactor??1;material.metalness=p.metallicFactor??1;
    if(p.baseColorTexture)material.map=textureAt(p.baseColorTexture.index);
    if(p.metallicRoughnessTexture){const texture=textureAt(p.metallicRoughnessTexture.index);material.roughnessMap=texture;material.metalnessMap=texture;material.userData.metalRoughPixels=texture.userData.pixels;}
    const finish=source.extras||{};material.userData.roughnessMin=finish.roughnessMin??.045;material.userData.roughnessMax=finish.roughnessMax??1;
    if(finish.roughnessMin!==undefined){material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor, '+finish.roughnessMin.toFixed(4)+', '+finish.roughnessMax.toFixed(4)+');');};material.customProgramCacheKey=()=>material.name+'-finish-v1';}
    return material;
  });
  const root=new T.Group();root.name='PawnyCompanion';
  const body=new T.Bone();body.name='Body';
  const head=new T.Bone();head.name='Head';head.position.set(0,-.018,0);body.add(head);
  const mesh=new T.SkinnedMesh(g,materials.length===1?materials[0]:materials);mesh.name='PawnyCharacter';mesh.add(body);root.add(mesh);root.updateMatrixWorld(true);
  mesh.bind(new T.Skeleton([body,head]));mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
  root.scale.setScalar(2.25);
  const pose={yaw:0,pitch:0,roll:0,bodyOffset:0};mesh.userData.companionPose=pose;
  function setPose(next={}) {
    pose.yaw=next.yaw||0;pose.pitch=next.pitch||0;pose.roll=next.roll||0;pose.bodyOffset=next.bodyOffset||0;
    head.rotation.set(pose.pitch,pose.yaw,pose.roll,'YXZ');body.position.y=pose.bodyOffset;
    root.position.y=next.hop||0;root.rotation.y=next.turn||0;
    root.updateMatrixWorld(true);mesh.skeleton.update();
    return pose;
  }
  setPose();
  return {root,mesh,head,body,pose,setPose,triangleCount:g.index.count/3,source:j.extras};
}
if(typeof module!=='undefined'&&module.exports)module.exports={readCompanionGLB,createImportedCompanion};
