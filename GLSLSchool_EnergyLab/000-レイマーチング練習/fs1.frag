precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;
varying   vec2   vTexCoord;
uniform float     timeScale;       // 時間の経過に対するスケール
const float PI = 3.1415926;

// マテリアルIDを定義する
#define MAT_FLOOR 0.
#define MAT_FACE 1.
#define MAT_BALL 2.


float dot2(in vec2 v ) { return dot(v,v); }
float dot2(in vec3 v ) { return dot(v,v); }

float rounding( in float d, in float h ){
    return d - h;
}
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c,s,-s,c);
}

vec2 pmod(vec2 p, float r) {
    float a = PI/r - atan(p.x, p.y);
    float n = PI/r;
    a = floor(a/n)*n;
    return p * rot(a);
}

// xに距離、yにマテリアルIDを入れたvec2のmin関数
vec2 min2(vec2 a, vec2 b) {
	return a.x < b.x ? a : b;
}

// スムーズなパルス波を作る関数
float smoothPulse(float start, float end, float period, float t, float smooth) {
    t = mod(t, period);
    return smoothstep(start, start + smooth, t) - smoothstep(end - smooth, end, t);
}

// 球の距離関数
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

vec3 trans(vec3 p){
    return mod(p, 4.0) - 2.0;
}

const float sphereSize = 1.0;
float distanceFunc(vec3 p){
    return length(trans(p)) - sphereSize;
}

//円錐の距離関数
float sdCappedCone( in vec3 p, in float h, in float r1, in float r2 ){
    vec2 q = vec2( length(p.xz), p.y );
    vec2 k1 = vec2(r2,h);
    vec2 k2 = vec2(r2-r1,2.0*h);
    vec2 ca = vec2(q.x-min(q.x,(q.y < 0.0)?r1:r2), abs(q.y)-h);
    vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot2(k2), 0.0, 1.0 );
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    return s*sqrt( min(dot2(ca),dot2(cb)) );
}

// 円柱の距離関数
float sdCappedCylinder(vec3 p, float r, float h) {
    // xz平面上の円（高さ無限の円柱）の距離関数を評価する
    float d = length(p.xz) - r;
    // 高さhの厚みがある無限平面の距離関数を評価する
	p.y = abs(p.y) - h;
	// 無限円柱と平面の積集合を取る
    return max(d, p.y);
}


vec3 trans(vec3 p){
    return mod(p, 4.0) - 2.0;
}


vec2 map(vec3 p) {
    p.y -= 0.2;
    // y座標が-1の無限平面を定義
    float plane = p.y + 1.0;
    
    vec3 q = p - vec3(0.0,0.5,0.0);
    //float sphere = sdCappedCone( q, 0.8, 0.8, 0.01 );//普通の円錐
    float sphere = rounding(sdCappedCone( q, 0.5, 0.1, 0.05 ), 0.2);//角丸の円錐
    vec3 fq = p - vec3(0.0 ,0.7,-0.06);
    float face = sdSphere(fq, 0.28);
    
    float eye_l = sdSphere(p - vec3(0.0 + (cos(time * 2.5)*0.05), 0.75, -0.27), 0.1);
    // xz平面をタイリングして、タイルごとに座標系を作る（-1~1）
    vec2 tile = fract(p.xz * 2.0) * 2.0 - 1.0;
    vec2 tile2 = fract(p.xz * 20.0) * 3.0 - 2.5;
    // 四角形の距離関数を応用してタイルごとの高さを計算する
    tile = abs(tile) - 0.1;
    float tileHeight = max(max(tile.x, tile.y), 0.0);
    float tileHeight2 = max(max(tile2.x, tile2.y), 0.0);
    // 高さを反映しながら距離関数を合成する
    //float d = min(plane + tileHeight * 0.02, sphere + (tileHeight*0.2) );
    // オブジェクト事にマテリアルIDを設定する
    vec2 d = min2(vec2(plane + tileHeight * 0.02, MAT_FLOOR), vec2(sphere, MAT_BALL));
    //d = min2(d, vec2(face, MAT_FACE));
    //d = min2(d, vec2(eye_l + tileHeight2 , MAT_BALL));
    return d;
}


// 衝突点とマテリアルIDからマテリアル情報を取得する関数
void getSurfaceParams(vec3 p, vec2 mat, out vec3 outColor, out vec3 outEmission) {
    // 色
    outColor = vec3(1.0);
    outEmission = vec3(0.0);
    // 発光色
    //outEmission = vec3(0.2);
    if (mat.y == MAT_FLOOR) {
        // 床の場合
        outColor = vec3(1.0);
        
   } else if (mat.y == MAT_BALL) {
        // ボールの場合
        outColor = vec3(1.0, 1.0, 1.0);

        //outEmission = vec3(0.6, 0.05, 0.01) * 4.0 * (sin(time) * 0.5 + 0.5);
    }
}

void main(){
    vec2 p = (fragCoord * 2.0 - resolution) / min(resolution.x, resolution.y);
    //vec3 cameraPos = vec3(1.0, 2.0, -3.0);//固定カメラ
    vec3 cameraPos = vec3(sin(time * 0.05) + cos(time * 0.5) * 0.1, 1.0 + sin(time * 0.3) + cos(time) * 0.01, -4.0);
    vec3 targetPos = vec3(0.0, 0.0, 0.0);
    vec3 forward = normalize(targetPos - cameraPos);
    vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up      = normalize(cross(forward, right));
    vec3 ray     = normalize(forward * 2.5 + right * p.x + up * p.y);
    // sinで視野角をアニメーションする
    //vec3 ray     = normalize(forward * (1.5 + (sin(time * 0.5)*0.5 + 0.8)*2.0) + right * p.x + up * p.y);
    
    float t = 0.01;
    vec3 col = vec3(0.4);
    for(int i=0; i<99; i++) {
        vec3 pos = cameraPos + ray * t;
        // 戻り値がvec2になった
        vec2 d = map(pos);
        if (d.x < 0.0001) {
            // 衝突点とマテリアルIDからマテリアル情報を得る
            vec3 color, emission;
            getSurfaceParams(pos, d, color, emission);
            col = 1.0 - vec3(float(i) / 99.0);
            // マテリアルを反映
            col *= color;
            col += emission;
            break;
        }
        t += d.x;
    }
    gl_FragColor = vec4(col, 1.0);
}
