# Uploaded character preview

`character.glb` derives from the user's `sample_2026-10-28T234950.433.glb`, generated with Microsoft's TRELLIS.2 from their supplied Pawny reference. It is not the original film production model. Embedded colour and metallic/roughness textures are preserved.

The derived asset adds Body and Head joints, with a smooth neck transition. The source has one fused mesh, no separate eyeballs, no eyelid rig and no independently modelled folding armour. This preview implements head tracking, a greeting nod, a whole-body hop and a turn. It does not claim independent pupil movement, blinking, walking, waving or capsule unfolding.

The original uploaded asset is retained unchanged. No reference photographs are included in this directory. The profile README, portfolio homepage and earlier companion pages are unchanged by this preview.

Geometry preparation uses the MIT-licensed meshoptimizer simplifier, with strong UV preservation. Runtime uses the existing MIT-licensed Three.js r160 bundle. `character-loader.js` reads this known GLB layout and builds the two-joint rig for WebGL. `software-renderer.js` renders the same geometry and head deformation on a 2D canvas when WebGL is unavailable; it preserves both texture coordinate orientation and the metallic/roughness map channels.

## Hand and material revision

`character-refined.glb` replaces the raised right hand with a closed, locally sculpted mesh. It retains the uploaded model's four-digit layout, adds a cupped palm, tapered and flexed fingers, and a closed bevelled wrist cuff. The hand has one connected, watertight surface. The new hand colour is sampled from the supplied skin and balanced toward the cheek palette; the two embedded texture image files remain unchanged.

Organic skin, amber eyes, copper armour, hand and cuff have separate material groups. The skin is nonmetallic, organic seam normals are smoothed, and the renderer constrains surface roughness to reduce metallic sparkle. Anisotropic filtering is enabled where the GPU supports it. The generated source's coarse armour geometry and texture detail still limit the final finish; this revision does not reconstruct the original production asset.
