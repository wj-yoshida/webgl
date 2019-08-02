precision mediump float;
uniform bool edge; // エッジフラグ @@@
varying vec3 vNormal;
varying vec4 vColor;

//頂点シェーダーとフラグメントシェーダーの両方で同じ名前でかつ、同じデータ型で宣言されているuniform変数はどちらからでも利用可能。*edgeのこと
//ただし、floatの様な浮遊少数が絡むデータ型は頂点シェーダとフラグメントで指定されている精度修飾子が異なる場合、共有できない！
//精度修飾子: flagの中, (precision mediump float;の) "mediump"のこと vartだと無条件にhighpになってので無理
//falgの方は精度修飾子の指定が自由、flagのhighpだとモバイルとかで動かないことがある。

const vec3 light = normalize(vec3(1.0));

void main(){
    // shade（陰）、つまり落ちる影ではなく物陰のほうの陰、暗さ
    float shade = 1.0;
    // 法線とライトベクトルの内積から拡散光を求める
    float diff = max(dot(normalize(vNormal), light), 0.0);
    // 拡散光の強さに応じて陰の暗さを段階的に変化させる
    if(edge == true){
        // エッジフラグが true の場合は極端に暗くする @@@
        shade = 0.1;
    }else if(diff < 0.1){
        shade = 0.4;
    }else if(diff < 0.3){
        shade = 0.6;
    }else if(diff < 0.6){
        shade = 0.8;
    }
    gl_FragColor = vColor * vec4(vec3(shade), 1.0);
}
