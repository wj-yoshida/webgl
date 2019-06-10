(() => {
    // variables
    let canvasWidth  = null;
    let canvasHeight = null;
    let targetDOM    = null;
    let run = true;
    let isDown = false;
    // three objects
    let scene;
    let camera;
    let controls;
    let renderer;
    let geometry;
    let material;
    let materialPoint;
    let plane;
    let box;
    let sphere;
    let cone;
    let torus;
    let group; // group @@@
    let directionalLight;
    let ambientLight;
    let axesHelper;
    let light;
    // constant variables
    const RENDERER_PARAM = {
        clearColor: 0x333333
    };
    const MATERIAL_PARAM = {
        color: 0x333333,
        specular: 0xffffff
    };
    const MATERIAL_PARAM_POINT = {
        color: 0x333333,
        size: 0.1
    };
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    const AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.2
    };
    const radians = (degrees) => {
      return degrees * Math.PI / 180;
    }
    const distance = (x1, y1, x2, y2) => {
      return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }
    const map = (value, start1, stop1, start2, stop2) => {
      return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
    }

    class Box {
      constructor() {
        this.geom = new THREE.TorusBufferGeometry(.3, .12, 30, 200);
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
      }
    }
    class Cone {
      constructor() {
        this.geom = new THREE.ConeBufferGeometry(.3, .5, 32);
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = radians(-180);
      }
    }
    class Torus {
      constructor() {
        this.geom = new THREE.TorusBufferGeometry(.3, .12, 30, 200);
        this.rotationX = radians(90);
        this.rotationY = 0;
        this.rotationZ = 0;
      }
    }
    setup(){
      // handles mouse coordinates mapping from 2D canvas to 3D world
      this.raycaster = new THREE.Raycaster();
      this.gutter = { size: 1 };
      this.meshes = [];
      this.grid = { cols: 14, rows: 6 };
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.mouse3D = new THREE.Vector2();
      this.geometries = [
        new Box(),
        new Tourus(),
        new Cone()
      ];
      window.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });

      // we call this to simulate the initial position of the mouse cursor
      this.onMouseMove({ clientX: 0, clientY: 0 });
    }
    onMouseMove({ clientX, clientY }) {
        this.mouse3D.x = (clientX / this.width) * 2 - 1;
        this.mouse3D.y = -(clientY / this.height) * 2 + 1;
      }
      createScene() {
      this.scene = new THREE.Scene();

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);


      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      document.body.appendChild(this.renderer.domElement);
    }
    createCamera() {
      this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1);

      // set the distance our camera will have from the grid
      this.camera.position.set(0, 65, 0);

      // we rotate our camera so we can get a view from the top
      this.camera.rotation.x = -1.57;

      this.scene.add(this.camera);
    }
    getRandomGeometry() {
       return this.geometries[Math.floor(Math.random() * Math.floor(this.geometries.length))];
     }
     getMesh(geometry, material) {
      const mesh = new THREE.Mesh(geometry, material);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      return mesh;
    }
    createGrid() {
   // create a basic 3D object to be used as a container for our grid elements so we can move all of them together
   this.groupMesh = new THREE.Object3D();

   const meshParams = {
     color: '#ff00ff',
     metalness: .58,
     emissive: '#000000',
     roughness: .18,
   };

   // we create our material outside the loop to keep it more performant
   const material = new THREE.MeshPhysicalMaterial(meshParams);

   for (let row = 0; row < this.grid.rows; row++) {
     this.meshes[row] = [];

     for (let col = 0; col < this.grid.cols; col++) {
       const geometry = this.getRandomGeometry();
       const mesh = this.getMesh(geometry.geom, material);

       mesh.position.set(col + (col * this.gutter.size), 0, row + (row * this.gutter.size));
       mesh.rotation.x = geometry.rotationX;
       mesh.rotation.y = geometry.rotationY;
       mesh.rotation.z = geometry.rotationZ;

       // store the initial rotation values of each element so we can animate back
       mesh.initialRotation = {
         x: mesh.rotation.x,
         y: mesh.rotation.y,
         z: mesh.rotation.z,
       };

       this.groupMesh.add(mesh);

       // store the element inside our array so we can get back when need to animate
       this.meshes[row][col] = mesh;
     }
   }

   //center on the X and Z our group mesh containing all the grid elements
   const centerX = ((this.grid.cols - 1) + ((this.grid.cols - 1) * this.gutter.size)) * .5;
   const centerZ = ((this.grid.rows - 1) + ((this.grid.rows - 1) * this.gutter.size)) * .5;
   this.groupMesh.position.set(-centerX, 0, -centerZ);

   this.scene.add(this.groupMesh);
 }
    // entry point
    window.addEventListener('load', () => {
        // canvas
        canvasWidth  = window.innerWidth;
        canvasHeight = window.innerHeight;
        targetDOM    = document.getElementById('webgl');

        // scene and camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 50.0);
        camera.position.x = 0.0;
        camera.position.y = 3.0;
        camera.position.z = 10.0;
        camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(canvasWidth, canvasHeight);
        renderer.shadowMap.enabled = true;
        targetDOM.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        // group @@@
        group = new THREE.Group();

        // material and geometory
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        materialPoint = new THREE.PointsMaterial(MATERIAL_PARAM_POINT);




        // helper
        axesHelper = new THREE.AxesHelper(5.0);
        //scene.add(axesHelper);

        // events
        window.addEventListener('keydown', (eve) => {
            run = eve.key !== 'Escape';
            if(eve.key === ' '){
                isDown = true;
            }
        }, false);
        window.addEventListener('keyup', (eve) => {
            if(eve.key === ' '){
                isDown = false;
            }
        }, false);
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }, false);

        // rendering
        render();
    }, false);

    // rendering
    function render(){
        if(run){requestAnimationFrame(render);}

        if(isDown === true){
            // group に対して処理する @@@
            group.rotation.y += 0.02;
        }

        renderer.render(scene, camera);
    }
})();
