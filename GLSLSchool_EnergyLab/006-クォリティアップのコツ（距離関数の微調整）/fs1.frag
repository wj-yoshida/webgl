precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;

const float pi = 3.141592;
const float pi2 = pi * 2.0;

mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c,s,-s,c);
}

vec2 pmod(vec2 p, float r) {
    float a = pi/r - atan(p.x, p.y);
    float n = pi2/r;
    a = floor(a/n)*n;
    return p * rot(a);
}

// by http://mercury.sexy/hg_sdf/
float fOpPipe(float a, float b, float r) {
	return length(vec2(a, b)) - r;
}

float fOpUnionStairs(float a, float b, float r, float n) {
	float s = r/n;
	float u = b-r;
	return min(min(a,b), 0.5 * (u + a + abs ((mod (u - a + s, 2. * s)) - s)));
}

float fOpDifferenceStairs(float a, float b, float r, float n) {
	return -fOpUnionStairs(-a, b, r, n);
}

// by https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdCappedCylinder(vec3 p, float r, float h) {
    float d = length(p.xz) - r;
	p.y = abs(p.y) - h;
    return max(d, p.y);
}

float sdTorus(vec3 p, float r, float s) {
	vec2 q = vec2(length(p.xz) - s, p.y);
    return length(q) - r;
}

// スムーズなパルス波を作る関数
float smoothPulse(float start, float end, float period, float t, float smooth) {
    t = mod(t, period);
    return smoothstep(start, start + smooth, t) - smoothstep(end - smooth, end, t);
}

float map(vec3 p) {
    float sphere = sdSphere(p, 0.25);
    
    p.y -= 2.0;
    
    float flor = fOpDifferenceStairs(p.y, sdCappedCylinder(p, 8.0, 4.0), 4.0, 15.);
    flor = fOpUnionStairs(flor, sdCappedCylinder(p - vec3(0.0, -4.0, 0.0), 1.0, 1.0), 1.0, 5.);
    
    vec3 q = p;
    q.xz = pmod(q.xz, 5.0);
    // 平面をsinでオフセットして曲線を作る
    float pipe = fOpPipe(flor - 0.05, q.x + sin(q.z*2.0) * 0.1, 0.07);

    // xz平面をタイリングして、タイルごとに座標系を作る（-1~1）
    vec2 tile = fract(p.xz * 8.0) * 2.0 - 1.0;
    // 四角形の距離関数を応用してタイルごとの高さを計算する
    tile = abs(tile) - 0.5;
    float tileHeight = max(max(tile.x, tile.y), 0.0);
    // パルス波を使用してパイプの窪みを作る
    float pipeHeight = smoothPulse(0.04, 0.06, 0.1, q.z, 0.01);
    
    // 高さを反映しながら距離関数を合成する
    float d = min(flor + tileHeight * 0.02, sphere);
    d = min(d, pipe + pipeHeight * 0.02);
    return d;
}

void main() {
    vec2 p = (fragCoord * 2.0 - resolution) / min(resolution.x, resolution.y);
    vec3 cameraPos = vec3(3.0, 2.0, -5.0);
    vec3 targetPos = vec3(0.0, -0.5, 0.0);
    vec3 forward = normalize(targetPos - cameraPos);
    vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up      = normalize(cross(forward, right));
    vec3 ray     = normalize(forward * 3.5 + right * p.x + up * p.y);
    
    float t = 0.01;
    vec3 col = vec3(0.0);
    for(int i=0; i<99; i++) {
        vec3 pos = cameraPos + ray * t;
        float d = map(pos);
        if (d < 0.0001) {
            col = 1.0 - vec3(float(i) / 99.0);
            break;
        }
        t += d;
    }
    gl_FragColor = vec4(col, 1.0);
}