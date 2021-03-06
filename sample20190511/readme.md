
# WebGL School 2019 three.js samples

## サンプル内のコメントの読み方 Tips（共通）

この一連のサンプル群では、コメントの付け方にルールを作っています。

それを目安にしながら中身を自分なりに分析していきましょう。

### ブロックコメント

ブロックコメントというのは、要するにコメントが複数行にまたがるような長文で書かれている場所のことです。

ブロックコメントは、そのサンプルのポイントや、あるいは処理の意味合いが変化するタイミングなど、考え方を切り替える際などに出てくるように書いてあります。

ブロックコメントに使われている記号別に詳細度がわかれてます。イメージ的には、よく文章を書くときに「章」だとか「節」だとかにわけるのと同じような感じです。

#### 例

**サンプルの説明やポイントを記載する（章）**

```
// = サンプルのポイントなど ===================================================
// イコール記号は一番大きなブロック。
// そのサンプル全体の意味や、理解すべきポイントを書いてます。
// ============================================================================
```

**扱うテーマが変化するときなどに記載する（節）**

```
// - この節のテーマ -----------------------------------------------------------
// イコール記号の二重線から少し簡略化されたハイフン表記が節に相当します。
// サンプルのなかで考え方や意味合いが変化したときに書きます。
// ----------------------------------------------------------------------------
```

**テーマ内である程度のかたまりとなる処理（項）**

```
// . かたまりとなる処理 .......................................................
// テーマ自体は同じでも、ある程度のかたまりで区切ったほうが理解しやすい場合もあ
// りますよね。そういうときはこんなふうにピリオドでブロックコメントを書きます。
// ............................................................................
```

## サンプル全体の作りについて

three.js のサンプルに限りませんが、本講義のサンプルは「JavaScript に不慣れな人」でも理解できるように作ってあるつもりです。

これは経験的に、この WebGL スクールに参加している受講者が、必ずしも JavaScript に習熟していない場合があるからです。普段はウェブデザインのみを行っている人や、あるいは Unity を使っているエンジニアさんなどが参加者に含まれている場合が多いので、あまりトリッキーな記述は利用せずに、できる限りシンプルな構造で作られています。

また、上記と同じ理由で、これわざわざコメントで説明するようなことじゃないだろ！ と思ってしまうような、ある意味丁寧すぎるコメントが含まれていると感じる場合もあるかもしれません。そういった場合は、遠慮なく必要ないコメントは各自で適当に消してしまいましょう。コメント多すぎると、コード読みづらくなることもありますので。

サンプルを見ていると、コメントに「@ マーク」が付いている箇所があることにも気がつくでしょう。

この @ マークが示すのは、直前のサンプルからどこが変更されているか、です。新しく該当サンプルで追加された部分をわかりやすくすることで、どのように新しいトピックが追加されていくのかを視認しやすくしています。


