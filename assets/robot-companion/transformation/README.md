# Capsule transformation motion study

This is a separate preview of the unfolding sequence described by the user's new references. It does not replace the current companion page or change the profile README.

The same three-dimensional cap stays attached to the rising head. Face shutters slide out and rotate beside the head. The front shield becomes a chest plate, side panels retract onto the shoulders and forearms, and the base splits into ankle cuffs. The arms and legs extend from the closed capsule. The robot waves after opening, then follows the pointer with its head and eyes. The sequence is reversible with **Fold up** and repeatable with **Replay unfolding**.

This remains a stylized, procedural character rather than a film-production sculpt. The realism revision adds smoother curved cap surfaces, solid shell panels with contrasting inner surfaces and edges, visible shutter hinges, domed amber irises and reflective pupils, finer material grain, and a slightly shorter cap. Eye rims match the face instead of looking like separate goggles. Eye motion responds faster than the damped head movement.

The copper, brass and olive surfaces use subtle, deterministic base-color, roughness and bump textures created at runtime. They omit the previous coarse grime atlas. All character surfaces remain actual mesh geometry; no photographic character billboard or generated character image is substituted for the model.

The software path now uses perspective-correct material sampling, GGX direct lighting, Fresnel-weighted studio reflections, a depth shadow map, and local contact shading. It shades visible surfaces in linear color and converts the result with a filmic tone curve. During movement it reduces its internal image resolution, then restores detail when the movement settles. WebGL uses the native physically based materials, studio environment, and soft shadow maps.

The page supports WebGL with a software fallback using the same articulated geometry. Reduced-motion preferences prevent automatic unfolding and idle motion; the replay button provides an explicit way to inspect the sequence. Pointer tracking continues while idle motion is disabled. No reference photographs are embedded or published.

Three.js r160 is MIT licensed; see the existing `assets/robot-companion/THREE-LICENSE.txt` in the parent project.
