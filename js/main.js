import * as THREE from "./threeR136/build/three.module.js";
import { OrbitControls } from "./threeR136/examples/jsm/controls/OrbitControls.js";
import * as BufferGeometryUtils from "./threeR136/examples/jsm/utils/BufferGeometryUtils.js";
import { TWEEN } from "./threeR136/examples/jsm/libs/tween.module.min.js";
import { FontLoader } from "./threeR136/build/three.module.js";
import { TextGeometry } from "./threeR136/build/three.module.js";


let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(0, 1, 0.375).setLength(15);
let renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(innerWidth, innerHeight);
//renderer.setClearColor(0x7f7f7f);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", onWindowResize);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
//controls.autoRotate = true;
controls.minDistance = 8;
controls.maxDistance = 15;

const textureLoader = new THREE.TextureLoader();

let tex = await textureLoader.loadAsync('https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg');
tex.encoding = THREE.sRGBEncoding;
tex.mapping = THREE.EquirectangularReflectionMapping;

let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 1, -2);
scene.add(/*light, */new THREE.AmbientLight(0xffffff, 2));

let phraseTextures = createTextures();

let globalUniforms = {
    time: { value: 0 },
    baseVisibility: { value: 1 },
    textVisibility: { value: 0 },
    text: { value: null }
}

let g1 = new THREE.SphereGeometry(4, 200, 100, 0, Math.PI * 2, Math.PI * 0.18, Math.PI * 0.85);
shiftSphereSurface(g1, true); // outer sphere
let g2 = g1.clone().scale(0.9, 0.9, 0.9); // inner sphere
let g3 = buildSides(g1); // bridge between spheres
// let g4 = new THREE.SphereGeometry(3.99, 200, 25, 0, Math.PI * 2, 0, Math.PI * 0.18); // lens
let g4 = new THREE.CircleGeometry(2.1, 200,Math.PI * 1,Math.PI * 2); // lens
g4.rotateX(-Math.PI / 2);
g4.translate(0, 3.4, 0);
let g5 = new THREE.TorusGeometry(
	2.05, 0.25,
	3, 300 );
    g5.rotateX(-Math.PI / 2);
g5.translate(0, 3.3, 0);
let g = BufferGeometryUtils.mergeBufferGeometries([g1, g2, g3, g4,g5], true);
let m = [
    new THREE.MeshStandardMaterial({
        envMap: tex,
        // color:new THREE.Color(0.5,0.5,0.5),
        color: new THREE.Color("black").addScalar(0.25).multiplyScalar(5),
        roughness: 0.75,
        metalness: 1,
        onBeforeCompile: shader => {
            shader.uniforms.time = globalUniforms.time;
            shader.vertexShader = `
      	varying vec3 vPos;
      	${shader.vertexShader}
      `.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
        	vPos = position;
       	`
            );
            //console.log(shader.vertexShader)
            shader.fragmentShader = `
      	#define ss(a, b, c) smoothstep(a, b, c)
      	uniform float time;
        varying vec3 vPos;
      	${fbm}
      	${shader.fragmentShader}
      `.replace(
                `#include <roughnessmap_fragment>`,
                `
        	float roughnessFactor = roughness;

          vec2 v2d = normalize(vPos.xz) * 1.;
          //vec3 nCoord = vec3(v2d.x, vPos.y * 4. - time * 0.5, v2d.y);
          vec3 nCoord = vPos + vec3(0, time, 0);

          float nd = clamp(fbm(nCoord) * 0.1, 0., 1.);
          nd = pow(nd, 0.5);
          float hFactor = vUv.y;
          nd = mix(0.25, nd, ss(0.4, 0.6, hFactor));
          nd = mix(nd, 0., ss(0.9, 1., hFactor));

          roughnessFactor *= clamp((nd * 0.8) + 0.2, 0., 1.);

        `
            );
            //console.log(shader.fragmentShader);
        }
    }),
    new THREE.MeshLambertMaterial({
        color: 0x000088,
        side: THREE.BackSide
    }),
    new THREE.MeshLambertMaterial({
        color: 0x000088,
        opacity: 0,
        transparent: true,
        onBeforeCompile: shader => {
            shader.fragmentShader = `
      	#define ss(a, b, c) smoothstep(a, b, c)
      	mat2 rot(float a){
        	float c = cos(a), s = sin(a);
        	return mat2( c, s,
                			-s, c);
        }
      	${shader.fragmentShader}
      `.replace(
                `vec4 diffuseColor = vec4( diffuse, opacity );`,
                `
        vec3 col = diffuse;
        vec2 uv = vUv;


        vec2 wUv = uv - 0.5;
        wUv.y *= 5.;
        wUv.y += sin(uv.x * PI2 * 20.) * 0.1;
        float fw = length(fwidth(wUv * PI));
        float l = ss(fw, 0., abs(sin(wUv.y * PI)));

        col = mix(col * 0.5, col, l);

        vec4 diffuseColor = vec4( col, opacity );
        `
            );
            //console.log(shader.fragmentShader);
        }
    }),
    new THREE.MeshStandardMaterial({
        envMap: tex,
        envMapIntensity: 10,
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        metalness: 1,
        roughness: 0,
        side: THREE.DoubleSide,
    }),
    new THREE.MeshStandardMaterial({
        envMap: tex,
        envMapIntensity: 10,
        color: 0x000,
        // color: new THREE.Color("black").addScalar(0.25).multiplyScalar(5),
        // transparent: true,
        opacity: 0.5,
        metalness: 1,
        roughness: 2,
        side: THREE.DoubleSide,
    })
]
m[0].defines = { USE_UV: "" };
m[2].defines = { USE_UV: "" };
let o = new THREE.Mesh(g, m);

//scene.add(o);

let ig = new THREE.PlaneGeometry(0.4 * 8, 0.4 * 8);
ig.rotateX(-Math.PI * 0.5);
ig.setAttribute("instId", new THREE.InstancedBufferAttribute(new Float32Array([0, 1, 2, 3]), 1));
let im = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0, 0.5, 1),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    onBeforeCompile: shader => {
        shader.uniforms.baseVisibility = globalUniforms.baseVisibility;
        shader.uniforms.textVisibility = globalUniforms.textVisibility;
        shader.uniforms.text = globalUniforms.text;
        shader.vertexShader = `
    	attribute float instId;

    	varying float vInstId;

      ${shader.vertexShader}
    `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
      	vInstId = instId;
      `
        );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
    	#define ss(a, b, c) smoothstep(a, b, c)
      uniform float baseVisibility;
      uniform float textVisibility;
      uniform sampler2D text;

      varying float vInstId;

      float tri(vec2 uv, int N){
        float Pi = 3.1415926;
        float Pi2 = Pi * 2.;
        float a = atan(uv.x,uv.y)+Pi;
        float r = Pi2/float(N);
        return cos(floor(.5+a/r)*r-a)*length(uv);
      }

    	${shader.fragmentShader}
    `.replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `vec4 diffuseColor = vec4( diffuse, opacity * ((vInstId / 3.) * 0.9 + 0.1) );

        vec2 uv = (vUv - 0.5) * 5.;

        float fw = length(fwidth(uv));

        float fb = tri(uv, 3);
        float b = 0.;
        b = max(b, ss(1.1 - fw, 1.1, fb) - ss(1.2, 1.2 + fw, fb));

        vec2 uv81 = uv - vec2(0, 0.5);
        fb = tri(uv81, 60);
        b = max(b, ss(0.25 - fw, 0.25, fb) - ss(0.45, 0.45 + fw, fb));

        vec2 uv82 = uv + vec2(0, 0.25);
        fb = tri(uv82, 60);
        b = max(b, ss(0.3 - fw, 0.3, fb) - ss(0.5, 0.5 + fw, fb));

        b *= baseVisibility;

        vec3 col = vec3(0);
        col = mix(col, diffuse, b);

        vec4 text = texture(text, (vUv - 0.5) + 0.5);
        float tx = text.a * textVisibility;
        col = mix(col, text.rgb * vec3(1, 1, 1), tx);


        float f = max(b, tx);

        diffuseColor.rgb = col;
        diffuseColor.a *= f;


      `
        );
    }
});
im.defines = { USE_UV: "" };
let iWriting = new THREE.InstancedMesh(ig, im, 4);
let step = 0.05;
iWriting.setMatrixAt(0, new THREE.Matrix4().setPosition(0, (0.75 * 4) - step * 3, 0));
iWriting.setMatrixAt(1, new THREE.Matrix4().setPosition(0, (0.75 * 4) - step * 2, 0));
iWriting.setMatrixAt(2, new THREE.Matrix4().setPosition(0, (0.75 * 4) - step * 1, 0));
iWriting.setMatrixAt(3, new THREE.Matrix4().setPosition(0, (0.75 * 4) - step * 0, 0));

iWriting.renderOrder = 9998;
o.renderOrder = 9999;
scene.add(o);
scene.add(iWriting);

// <BACKGROUND>
let bg = new THREE.SphereGeometry(1000, 100, 50);
let bm = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
        time: globalUniforms.time
    },
    vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
    fragmentShader: `
    uniform float bloom;
    uniform float time;
    varying vec3 vNormal;
    ${noiseV3}
void main() {
    vec3 col = vec3(0.3, 0.5, 1.0); // Light sky blue

    float wave = sin(vNormal.y * 5.0 + time * 2.0) * 0.1;
    float ns = snoise(vec4(vNormal * 3., time * 0.05));
    ns = smoothstep(-0.3, 0.3, ns); // Smooth out noise transitions

    vec3 softGlow = mix(vec3(1.0, 0.9, 0.7), col, pow(abs(ns), 0.6));
    col = mix(col, softGlow, 0.4);

    float shimmer = sin(vNormal.y * 15.0 + time * 1.5) * 0.05; // Reduced frequency
    col += shimmer;

    gl_FragColor = vec4(col, 1.0);
}
  `
});
let bo = new THREE.Mesh(bg, bm);
scene.add(bo);
// </BACKGROUND>

// <INTERACTION>
let isRunning = false; // Prevent multiple triggers

function animation(param, valStart, valEnd, duration = 500, delay = 0) {
    return new TWEEN.Tween({ val: valStart })
        .to({ val: valEnd }, duration)
        .delay(delay)
        .onUpdate(val => {
            param.value = val.val;
        });
}
function resetPositions() {
    globalUniforms.baseVisibility.value = 1;
    globalUniforms.textVisibility.value = 0;

    iWriting.position.set(0, 0, 0);
    o.position.set(0, 0, 0);

    iWriting.updateMatrixWorld();
    o.updateMatrixWorld();
}

// Run animation sequence
function runAnimation() {
    resetPositions();
    isRunning = true; // Lock animation

    let fadeOut = animation(globalUniforms.baseVisibility, 1, 0.375, 2000, 2000);
    let fadeIn = animation(globalUniforms.textVisibility, 0, 1, 5000, 4000);

    fadeOut.start();
    fadeIn.onStart(() => setNewText());
    fadeIn.onComplete(() => {
        // clearText(); // Clear text after animation
        // stopOscillation(); // Stop oscillation
        // resetText(); // Reset text to "8"
        isRunning = false;
    });

    fadeIn.start();
    moveCameraToFinalPosition();
    // startOscillation(); // Start oscillation when animation begins
}

let pointer = new THREE.Vector2();
let raycaster = new THREE.Raycaster();

// window.addEventListener("pointerup", event => {
//     if (isRunning) return; // Prevent multiple triggers

//     pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//     pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
//     raycaster.setFromCamera(pointer, camera);
//     let intersections = raycaster.intersectObject(iWriting).filter(m => {
//         return (m.uv.subScalar(0.5).length() * 2) < 0.5; // Click inside central circle
//     });

//     if (intersections.length > 0) {
//         runAnimation();
//     }
// });
window.addEventListener("pointerup", (event) => {
    if (isRunning) return; // Prevent multiple triggers

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // Intersect with the entire sphere
    const intersections = raycaster.intersectObject(o, true);

    if (intersections.length > 0) {
        runAnimation();
    }
});
window.addEventListener("devicemotion", (event) => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const threshold = 15; // Adjust this for shake sensitivity
    const { x, y, z } = acceleration;

    // Detect sudden movement in any direction
    if (Math.abs(x) > threshold || Math.abs(y) > threshold || Math.abs(z) > threshold) {
        runAnimation();
    }
});



function moveCameraToFinalPosition() {
    let finalPosition = new THREE.Vector3(0, 1, 0.375).setLength(15); // Final resting position
    let orbitRadius = 20; // Radius for circular motion
    let orbitDuration = 4000; // Time to complete the orbit
    controls.target.set(0, 0, 0);
    controls.update();

    let orbitTween = new TWEEN.Tween({ angle: 0 }) // Start angle
        .to({ angle: Math.PI * 4 }, orbitDuration) // Full 360-degree rotation
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(obj => {
            camera.position.x = orbitRadius * Math.cos(obj.angle);
            camera.position.z = orbitRadius * Math.sin(obj.angle);
            camera.lookAt(new THREE.Vector3(0, 0, 0)); // Keep looking at the ball
        })
        .onComplete(() => {
            resetBall();
            resetTextPosition();

            // Move back to the final position after reset
            new TWEEN.Tween(camera.position)
                .to({ x: finalPosition.x, y: finalPosition.y, z: finalPosition.z }, 1500)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(() => camera.lookAt(new THREE.Vector3(0, 0, 0))) // Keep looking at the ball
                .start();
        })
        .start();

    // Reset Orbit Controls

}

// Function to reset the text position
function resetTextPosition() {
    for (let i = 0; i < iWriting.count; i++) {
        let matrix = new THREE.Matrix4();
        let position = new THREE.Vector3(0, 3.2, 0); // Reset to cutout position
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3(1, 1, 1);

        matrix.compose(position, quaternion, scale);
        iWriting.setMatrixAt(i, matrix);
    }
    iWriting.instanceMatrix.needsUpdate = true;
}
function resetBall() {
    o.position.set(0, 0, 0);
    o.rotation.set(0, 0, 0);
}

function setNewText() {
    globalUniforms.text.value = phraseTextures[THREE.MathUtils.randInt(0, 19)];
}

// </INTERACTION>

let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
    let t = clock.getElapsedTime();
    globalUniforms.time.value = t;
    controls.update();
    TWEEN.update();
    renderer.render(scene, camera);
    console.log(renderer.info.render.frame,renderer.info.render.frame % 100);
    if (renderer.info.render.frame > 0) {
        // setIsRendered(true);renderer.info.render.frame
        // window.addEventListener("load", () => {
            document.getElementById("loader").style.display = "none";
        // });
      }
});

function onWindowResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

function buildSides(g) {
    let v3 = new THREE.Vector3();
    //console.log(g.parameters);
    let segs = g.parameters.widthSegments;
    let pts = new Array((segs + 1) * 2);
    for (let i = 0; i <= segs; i++) {
        v3.fromBufferAttribute(g.attributes.position, i);
        pts[i] = v3.clone().setLength(v3.length() * 0.9);
        pts[i + (segs + 1)] = v3.clone();
    }
    //console.log(pts)
    let sg = new THREE.PlaneGeometry(1, 1, segs, 1)
    sg.setFromPoints(pts);
    sg.computeVertexNormals();
    return sg;
}

function shiftSphereSurface(g, hole) {
    let sectors = 5;
    let sph = new THREE.Spherical();
    let v3 = new THREE.Vector3();
    let n = new THREE.Vector3();
    for (let i = 0; i < g.attributes.position.count; i++) {
        v3.fromBufferAttribute(g.attributes.position, i);
        sph.setFromVector3(v3);
        let localTheta = (Math.abs(sph.theta) * sectors / (Math.PI * 2)) % 1;
        let phiShift = 1 - (Math.cos(localTheta * Math.PI * 2) * 0.5 + 0.5);
        let phiAspect = sph.phi / Math.PI;
        phiAspect = hole ? 1 - phiAspect : phiAspect;
        let phiVal = Math.pow(phiShift, 0.9) * 0.05 * phiAspect;
        sph.phi += hole ? -phiVal : phiVal;
        v3.setFromSpherical(sph);
        g.attributes.position.setXYZ(i, v3.x, v3.y, v3.z);
        n.copy(v3).normalize();
        g.attributes.normal.setXYZ(i, n.x, n.y, n.z);
    }
}

function createTextures() {
    let canvases = [];
    [
        "It|is|certain",
        "It is|decidedly|so",
        "Without|a doubt",
        "Yes -|definitely",
        "You may|rely|on it",

        "As I|see it,|yes",
        "Most|likely",
        "Outlook|good",
        "Signs|point|to yes",
        "Yes",

        "Reply|hazy,|try|again",
        "Ask|again|later",
        "Better not|tell you|now",
        "Cannot|predict|now",
        "Concentrate|and ask|again",

        "Don’t|count|on it",
        "My|reply|is no",
        "My|sources|say no",
        "Outlook|not so|good",
        "Very|doubtful"
    ].forEach(phrase => {

        let c = document.createElement("canvas");
        c.style.fontSmooth = "never";
        c.width = c.height = 256;
        let ctx = c.getContext("2d");
        ctx.clearRect(0, 0, 256, 256);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let size = 30;
        let sizeRatio = 1.0;
        ctx.font = `bold ${size}px Arial`;


        let phraseChunks = phrase.split("|");
        let pcLength = phraseChunks.length;
        let startPoint = (pcLength - 1) * 0.5 * size * sizeRatio;
        ctx.fillStyle = "#FFF";
        phraseChunks.forEach((pc, idx) => {
            ctx.fillText(pc.toUpperCase(), 127, 127 - startPoint + (idx * size * sizeRatio));
        })

        canvases.push(new THREE.CanvasTexture(c));
    })
    return canvases;
}
