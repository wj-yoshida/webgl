precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;

#define MAT_FLOOR 0.
#define MAT_PIPE 1.
#define MAT_BALL 2.

// めちゃくちゃ小さい数字
#define FLT_EPS  5.960464478e-8

const float pi = 3.141592;
const float pi2 = pi * 2.0;

vec2 min2(vec2 a, vec2 b) {
	return a.x < b.x ? a : b;
}

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

float smoothPulse(float start, float end, float period, float t, float smooth) {
    t = mod(t, period);
    return smoothstep(start, start + smooth, t) - smoothstep(end - smooth, end, t);
}

float energyAnim(float z) {
    return smoothPulse(0.0, 0.6, 6.0, z + time, 0.2);
}

vec2 map(vec3 p) {
    float sphere = sdSphere(p - vec3(0.0, cos(time) * 0.1, 0.0), 0.25);
    
    p.y -= 2.0;
    
    float flor = fOpDifferenceStairs(p.y, sdCappedCylinder(p, 8.0, 4.0), 4.0, 15.);
    flor = fOpUnionStairs(flor, sdCappedCylinder(p - vec3(0.0, -4.0, 0.0), 1.0, 1.0), 1.0, 5.);
    
    vec3 q = p;
    q.xz = pmod(q.xz, 5.0);
    float pipe = fOpPipe(flor - 0.05, abs(q.x + sin(q.z*2.0) * 0.1), 0.07);

    vec2 tile = fract(p.xz * 8.0) * 2.0 - 1.0;
    tile = abs(tile) - 0.5;
    float tileHeight = max(max(tile.x, tile.y), 0.0);
    float pipeHeight = smoothPulse(0.04, 0.06, 0.1, q.z, 0.01);

    vec2 d = min2(vec2(flor + tileHeight * 0.02, MAT_FLOOR), vec2(sphere, MAT_BALL));
    d = min2(d, vec2(pipe + pipeHeight * 0.02 - energyAnim(q.z) * 0.05, MAT_PIPE));
    return d;
}

// 滑らか(0)から粗い(1)で表現するroughnessというパラメータを計算で使用する指数にマッピングする関数
float roughnessToExponent(float roughness)
{
    return clamp(2.0 * (1.0 / (roughness * roughness)) - 2.0, FLT_EPS, 1.0 / FLT_EPS);
}

// サーフェイス位置・法線・視線方向・ライト位置・マテリアル情報でライティングする関数
vec3 light(vec3 p, vec3 n, vec3 v, vec3 lp, vec3 baseColor, float roughness, float reflectance, float metallic, vec3 radiance) {
    // 反射率をメタリックパラメータで分岐する
    vec3 ref = mix(vec3(reflectance), baseColor, metallic);

    // ライトベクトルと距離を計算する
    vec3 l = lp - p;
    float len = length(l);
    l /= len;
    
    // ハーフベクトルを計算
    vec3 h = normalize(l + v);
    
    // 正規化diffuseを評価
    vec3 diffuse = mix(1.0 - ref, vec3(0.0), metallic) * baseColor / pi;
    
    // 正規化blin-phongを評価
    float m = roughnessToExponent(roughness);
	vec3 specular = ref * pow( max( 0.0, dot( n, h ) ), m ) * ( m + 2.0 ) / ( 8.0 * pi );
	
	// diffuse項とspecular項を合算してポイントライトを評価
    return (diffuse + specular) * radiance * max(0.0, dot(l, n)) / (len*len);
}

vec3 cameraPos;

// 空間にライトを配置して全て評価する関数
vec3 evalLights(vec3 p, vec3 n, vec3 ray, vec3 baseColor, float roughness, float reflectance, float metallic) {
    // ボールから発せられるポイントライトを配置
    vec3 lp = vec3(0.0, cos(time) * 0.1, 0.0);
    vec3 result = light(p, n, -ray, lp, baseColor, roughness, reflectance, metallic, vec3(0.6, 0.05, 0.01) * (sin(time) * 0.5 + 0.5) * 8.0);
    
    // カメラ位置にポイントライトを配置
    result += light(p, n, -ray, cameraPos, baseColor, roughness, reflectance, metallic, vec3(3.0));
    return result;
}

// パラメータを追加
void getSurfaceParams(vec3 p, vec2 mat, out vec3 outColor, out vec3 outEmission, out float outRoughness, out float outReflectance, out float outMetallic) {
    outColor = vec3(0.0);
    outEmission = vec3(0.0);
    // 粗さパラメータを追加
    outRoughness = 1.0;
    // 反射率パラメータを追加
    outReflectance = 0.04;
    // メタリックパラメータを追加
    outMetallic = 0.0;
    if (mat.y == MAT_FLOOR) {
        outColor = vec3(0.5);
        outRoughness = 0.2;
    } else if (mat.y == MAT_PIPE) {
        outColor = vec3(0.9);
        outRoughness = 0.15;
        outMetallic = 1.0;
    	p.xz = pmod(p.xz, 5.0);
    	float energy = energyAnim(p.z);
        outEmission = mix(vec3(0.6, 0.05, 0.01), vec3(0.01, 0.05, 0.6), clamp(p.z * 0.2, 0.0, 1.0)) * 4.0 * energy;
    } else if (mat.y == MAT_BALL) {
        outColor = vec3(0.6);
        outEmission = vec3(0.6, 0.05, 0.01) * 4.0 * (sin(time) * 0.5 + 0.5);
        outRoughness = 0.8;
    }
}

// 衝突点付近を4tapして距離関数の法線を推定する関数
vec3 normal(vec3 p) {
	vec2 e = vec2(1.0, -1.0) * 0.001;
    return normalize(
        e.xyy * map(p+e.xyy).x+
        e.yxy * map(p+e.yxy).x+
        e.yyx * map(p+e.yyx).x+
        e.xxx * map(p+e.xxx).x
        );
}

void main() {
    vec2 p = (fragCoord * 2.0 - resolution) / min(resolution.x, resolution.y);
    cameraPos = vec3(sin(time * 0.1) + cos(time * 0.5) * 0.5, 2.0 + sin(time * 0.3) + cos(time) * 0.1, -5.0);
    vec3 targetPos = vec3(0.0, -0.5, 0.0);
    vec3 forward = normalize(targetPos - cameraPos);
    vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up      = normalize(cross(forward, right));
    vec3 ray     = normalize(forward * (2.5 + (sin(time * 0.5)*0.5 + 0.5)*2.0) + right * p.x + up * p.y);
    
    float t = 0.01;
    vec3 col = vec3(0.0);
    for(int i=0; i<99; i++) {
        vec3 pos = cameraPos + ray * t;
        vec2 d = map(pos);
        if (d.x < 0.0001) {
            // 取得するパラメータを増やした
            vec3 color, emission, n;
            float roughness, reflectance, mettalic;
            getSurfaceParams(pos, d, color, emission, roughness, reflectance, mettalic);
            
            // 法線を推定
            n = normal(pos);
            
            // ポイントライトを評価
            col = evalLights(pos, n, ray, color, roughness, reflectance, mettalic);
            // 発光色を加える
            col += emission;
            break;
        }
        t += d.x;
    }
    
    // ガンマ補正
    col = pow(col, vec3(1.0 / 2.2));
    // 暗いので露出を上げる
    gl_FragColor = vec4(col * 2.0, 1.0);
}