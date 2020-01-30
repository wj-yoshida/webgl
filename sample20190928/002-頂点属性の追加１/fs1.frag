precision mediump float;
uniform vec4 globalColor;
varying vec4 vColor; // varying 変数で頂点カラーをフラグメントシェーダで受け取る @@@
void main(){
    /**
     * GLSL で vec4 と vec4 を乗算演算子で処理することは以下の処理と同義 @@@
     * gl_FragColor.r = globalColor.r * vColor.r;
     * gl_FragColor.g = globalColor.g * vColor.g;
     * gl_FragColor.b = globalColor.b * vColor.b;
     * gl_FragColor.a = globalColor.a * vColor.a;
     */
    gl_FragColor = globalColor * vColor;
    /**
     * また、ここで登場した `変数名.rgba` のような要素を指定する書き方は
     * スウィズル演算子、と呼ばれます。
     * スウィズル演算子には `変数名.xyzw` や `変数名.stpq` などがあり、か
     * なり柔軟な記法として利用することができます。記述例は以下。
     *
     * vec2 v2 = vec2(1.0);
     * vec3 v3 = vec3(1.0);
     * vec4 v4 = vec4(1.0);
     *
     * v3 = v4.rgb; // 要素の一部だけを抽出して別のデータ型に代入
     * v3 = v4.rar; // 要素は複数回使っても良い、順番も自由
     * v3 = v4.xyz; // rgba と xyzw には意味的な違いはなく、単に見た目が違うだけ
     * v3 = vec3(v2, v4.s); // スウィズル演算子無しとも組み合わせ自由
     */
}

