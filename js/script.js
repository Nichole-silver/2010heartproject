console.clear();

// 创建场景对象 Scene
const scene = new THREE.Scene();

// 创建透视相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//  创建渲染器对象
const renderer = new THREE.WebGLRenderer({
  antialias: true, //  是否执行抗锯齿。默认值为false。
});

renderer.setClearColor(new THREE.Color("#fbf9f6")); // trắng sữa sáng hơn



// 将输 canvas 的大小调整为 (width, height) 并考虑设备像素比，且将视口从 (0, 0) 开始调整到适合大小
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 表示对象局部位置的 Vector3。默认值为(0, 0, 0)。
camera.position.z = 1.8;

// 轨迹球控制器
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.noPan = true;
controls.maxDistance = 3;
controls.minDistance = 0.7;

// 物体
const group = new THREE.Group();
scene.add(group);

let heart = null;
let sampler = null;
let originHeart = null;

// OBJ加载器
new THREE.OBJLoader().load(
  "https://assets.codepen.io/127738/heart_2.obj",
  (obj) => {
    heart = obj.children[0];
    heart.geometry.rotateX(-Math.PI * 0.5);
    heart.geometry.scale(0.04, 0.04, 0.04);
    heart.geometry.translate(0, -0.4, 0);
    group.add(heart);
    // 🌸 Tạo dòng chữ xoay quanh trục Y, bên dưới tim
    const loader = new THREE.FontLoader();
    loader.load(
      "https://threejs.org/examples/fonts/optimer_regular.typeface.json",
      function (font) {
        const text = "Vietnamese Women's Day     Happy ";

        const textGroup = new THREE.Group();
        group.add(textGroup);

        const radius = 0.55;       // vòng nhỏ hơn
        const textHeight = -0.5;   // vị trí dưới tim
        const angleStep = (Math.PI * 2) / text.length;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const textGeo = new THREE.TextGeometry(char, {
            font: font,
            size: 0.07,
            height: 0.02,
            curveSegments: 8,
          });

          const textMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#f6d6a8"),    // vàng champagne sang
            emissive: new THREE.Color("#ffe6c7"), // ánh sáng nhẹ
            emissiveIntensity: 0.35,
            metalness: 0.25,
            roughness: 0.45,
          });

          const textMesh = new THREE.Mesh(textGeo, textMat);

          const angle = -i * angleStep;
          textMesh.position.x = Math.cos(angle) * radius;
          textMesh.position.z = Math.sin(angle) * radius;
          textMesh.position.y = textHeight;

          textMesh.rotation.y = angle + Math.PI / 2;

          textGroup.add(textMesh);
        }

        // 💫 Chữ xoay quanh trục Y
        function rotateText() {
          textGroup.rotation.y -= 0.004; // ngược chiều
          requestAnimationFrame(rotateText);
        }
        rotateText();

        // ✨ Ánh sáng
        const pointLight = new THREE.PointLight(0xffffff, 1.2, 5);
        pointLight.position.set(0, 0.5, 1.5);
        scene.add(pointLight);

        // 🌷 Thêm icon bó hoa 💐 (xoay cùng vòng chữ)
        const loader2 = new THREE.TextureLoader();
        loader2.load("https://twemoji.maxcdn.com/v/latest/svg/1f490.svg", (texture) => {
          const material = new THREE.SpriteMaterial({ map: texture });
          const flower = new THREE.Sprite(material);
          flower.scale.set(0.22, 0.22, 0.22); // nhỏ hơn một chút
          flower.position.set(0, textHeight, radius * 1.1);
          textGroup.add(flower);
        });
      }
    );




    // 基础网格材质
    heart.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffe6ec"),
      transparent: true,
      opacity: 0.3,
    });

    originHeart = Array.from(heart.geometry.attributes.position.array);
    // 用于在网格表面上采样加权随机点的实用程序类。
    sampler = new THREE.MeshSurfaceSampler(heart).build();
    // 生成表皮
    init();
    // 每一帧都会调用
    renderer.setAnimationLoop(render);
  }
);

let positions = [];
let colors = [];
const geometry = new THREE.BufferGeometry();

const material = new THREE.PointsMaterial({
  vertexColors: true, // Let Three.js knows that each point has a different color
  size: 0.009,
});

const particles = new THREE.Points(geometry, material);
group.add(particles);

const simplex = new SimplexNoise();
const pos = new THREE.Vector3();
const palette = [
  new THREE.Color("#ffd4ee"),
  new THREE.Color("#ff77fc"),
  new THREE.Color("#ff77ae"),
  new THREE.Color("#ff1775"),
];

class SparkPoint {
  constructor() {
    sampler.sample(pos);
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.rand = Math.random() * 0.03;
    this.pos = pos.clone();
    this.one = null;
    this.two = null;
  }
  update(a) {
    const noise =
      simplex.noise4D(this.pos.x * 1, this.pos.y * 1, this.pos.z * 1, 0.1) +
      1.5;
    const noise2 =
      simplex.noise4D(this.pos.x * 500, this.pos.y * 500, this.pos.z * 500, 1) +
      1;
    this.one = this.pos.clone().multiplyScalar(1.01 + noise * 0.15 * beat.a);
    this.two = this.pos
      .clone()
      .multiplyScalar(1 + noise2 * 1 * (beat.a + 0.3) - beat.a * 1.2);
  }
}

let spikes = [];
function init(a) {
  positions = [];
  colors = [];
  for (let i = 0; i < 7000; i++) {
    const g = new SparkPoint();
    spikes.push(g);
  }
}

const beat = { a: 0 };
gsap.timeline({
  repeat: -1,
  yoyo: true,         // chuyển động đi–về mượt hơn
})
.to(beat, {
  a: 0.35,            // biên độ lớn hơn
  duration: 2.5,      // chậm hơn, nhịp “cơ học” rõ hơn
  ease: "sine.inOut", // mượt ở 2 đầu biên, đều ở giữa
});



// 0.22954521554974774 -0.22854083083283794
const maxZ = 0.23;
const rateZ = 0.5;

function render(a) {
  positions = [];
  colors = [];
  spikes.forEach((g, i) => {
    g.update(a);
    const rand = g.rand;
    const color = g.color;
    if (maxZ * rateZ + rand > g.one.z && g.one.z > -maxZ * rateZ - rand) {
      positions.push(g.one.x, g.one.y, g.one.z);
      colors.push(color.r, color.g, color.b);
    }
    if (
      maxZ * rateZ + rand * 2 > g.one.z &&
      g.one.z > -maxZ * rateZ - rand * 2
    ) {
      positions.push(g.two.x, g.two.y, g.two.z);
      colors.push(color.r, color.g, color.b);
    }
  });
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );

  const vs = heart.geometry.attributes.position.array;
  for (let i = 0; i < vs.length; i += 3) {
    const v = new THREE.Vector3(
      originHeart[i],
      originHeart[i + 1],
      originHeart[i + 2]
    );
    const noise =
      simplex.noise4D(
        originHeart[i] * 1.5,
        originHeart[i + 1] * 1.5,
        originHeart[i + 2] * 1.5,
        a * 0.0005
      ) + 1;
    v.multiplyScalar(0 + noise * 0.15 * beat.a);
    vs[i] = v.x;
    vs[i + 1] = v.y;
    vs[i + 2] = v.z;
  }
  heart.geometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
