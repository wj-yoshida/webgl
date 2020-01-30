precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;

// 円周率を定義
const float pi = 3.141592;
const float pi2 = pi * 2.0;

// 二次元の回転行列
mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c,s,-s,c);
}

// Polar Mod p座標を極座標でr分割して複製する
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

float map(vec3 p) {
    float sphere = sdSphere(p, 0.25);
    
    p.y -= 2.0;
    float flor = fOpDifferenceStairs(p.y, sdCappedCylinder(p, 8.0, 4.0), 4.0, 15.);
    flor = fOpUnionStairs(flor, sdCappedCylinder(p - vec3(0.0, -4.0, 0.0), 1.0, 1.0), 1.0, 5.);
    
    // xz平面を5分割して複製する
    vec3 q = p;
    q.xz = pmod(q.xz, 5.0);
    // 床とx平面を合成してパイプを作る
    float pipe = fOpPipe(flor - 0.05, q.x, 0.07);

    float d = min(flor, sphere);
    d = min(d, pipe);
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

