// phina.js をグローバル領域に展開
phina.globalize();

var ASSETS = {
  image: {
	'clock_frame': './img/clock_frame.png',
	'clock_needle': './img/clock_needle.png',
	},
};

var DF = {
};
DF.SC_W = 240;
DF.SC_H = 320;

class Rotation {
}
Rotation.RIGHT = 0;
Rotation.DOWN = 90;
Rotation.LEFT = 180;
Rotation.UP = 270;

class MathHelper {

	static max(a, b) {
		return a < b ? b : a;
	}

	static min(a, b) {
		return a < b ? a : b;
	}

	static wrap(v, min, max) {
		const length = max - min;
		const v2 = v - min;
		if (0 <= v2) {
			return min + (parseInt(v2) % parseInt(length));
		}
		return min + (length + (v2 % length)) % length;
	}

	static clamp(v, min, max) {
		if (v < min) return min;
		if (max < v) return max;
		return v;
	}

	static clamp01(v, min, max) {
		return MathHelper.clamp(v, 0.0, 1.0);
	}

	static lerp(a, b, t) {
		return a + (b - a) * t;
	}

	static tForLerp(a, b) {
		if (b <= 0) return 1;
		return a / b;
	}

	static isLerpEnd(t) {
		return 1 <= t;
	}

	/** [ min, max ) */
	static isInRange(v, min, max) {
		return min <= v && v < max;
	}

	static progress01(t, length) {
		if (length <= 0) return 1.0;
		return MathHelper.clamp01(t / length);
	}
}

function assertEq(a, b) {
	if (a === b) return;
	throw "assert " + a + " vs " + b;
}

assertEq(0, MathHelper.wrap(3, 0, 3));
assertEq(2, MathHelper.wrap(2, 0, 3));
assertEq(1, MathHelper.wrap(1, 0, 3));
assertEq(2, MathHelper.wrap(-1, 0, 3));
assertEq(1, MathHelper.wrap(-2, 0, 3));
assertEq(0, MathHelper.wrap(-3, 0, 3));
assertEq(2, MathHelper.wrap(-4, 0, 3));
assertEq(1, MathHelper.wrap(-5, 0, 3));

assertEq(0, MathHelper.clamp(-1, 0, 10));
assertEq(10, MathHelper.clamp(11, 0, 10));

assertEq(1, MathHelper.progress01(2, 0));
assertEq(1, MathHelper.progress01(2, -10));
assertEq(0, MathHelper.progress01(0, 10));
assertEq(0.5, MathHelper.progress01(5, 10));
assertEq(1, MathHelper.progress01(10, 10));
assertEq(1, MathHelper.progress01(11, 10));

class Vector2Helper {
	static isZero(v) {
		return v.x === 0 && v.y === 0;
	}
	static copyFrom(a, b) {
		a.x = b.x;
		a.y = b.y;
	}
}

const StateId = {
	S1I: 10,
	S1: 11,
	S2I: 20,
	S2: 21,
	S3: 30,
	S4I: 40,
	S4: 41,
	S5I: 50,
	S5: 51,
}

// MainScene クラスを定義
phina.define('MainScene', {
	superClass: 'DisplayScene',
	init: function(options) {
		this.superInit(options);
		// 背景色を指定
		this.backgroundColor = '#ffffff';

		{
			const layer = DisplayElement();
			layer.addChildTo(this);
			this.layer0 = layer;
		}

		{
			const layer = DisplayElement();
			layer.addChildTo(this);
			this.layer1 = layer;
		}


		const data = {
			config: {
			},
			progress: {
				state: StateId.S1I,
				stateTime: 0,
				elapsedTime: 0,
				limitTime: 1000 * 60,
				tapCount: 0,
				tapCountMax: 60,
				score: 0,
				scoreItemsCounts: [],
				isPlaying: false,
			},
			record: {
				tapTimes: [],
				recordI: 0,
			},
			scoreItems: [
				{
					index: 0,
					name: "超いいね",
					time: 50,
					score: 1000,
					fillColor: '#ffff00',
				},
				{
					index: 1,
					name: "すごいね",
					time: 100,
					score: 500,
					fillColor: '#ff0000',
				},
				{
					index: 2,
					name: "いいね",
					time: 200,
					score: 250,
					fillColor: '#ffffff',
				},
				{
					index: 3,
					time: 300,
					name: "うん",
					score: 100,
					fillColor: '#cccccc',
				},
				{
					index: 4,
					time: 400,
					name: "おっ",
					score: 50,
					fillColor: '#cccccc',
				},
				{
					index: 5,
					time: 500,
					name: "あ...",
					score: 10,
					fillColor: '#cccccc',
				}
			],
		};

		{
			const sprite = new Sprite('clock_frame');
			sprite.x = DF.SC_W * 0.5;
			sprite.y = DF.SC_H * 0.4;
			sprite.addChildTo(this.layer1);
			data.clockFrameSprite = sprite;
		}
		{
			const sprite = new Sprite('clock_needle');
			sprite.x = DF.SC_W * 0.5;
			sprite.y = DF.SC_H * 0.4;
			sprite.addChildTo(this.layer1);
			data.clockNeedleSprite = sprite;
		}

		{
			const label = Label({
				originX: 0.5,
				originY: 0,
				fontSize: 8,
				lineHeight: 2,
				align: 'left',
				fill: '#ffffff',
				stroke: '#000000',
				strokeWidth: 4,
			}).addChildTo(this);
			label.text = "hoge";
			label.x = 8;
			label.y = 16;
			this.debugLabel = label;
			this.debugLabel.visible = false;
		}
		{
			const label = Label({
				originX: 0.5,
				originY: 0,
				fontSize: 8,
				lineHeight: 2,
				align: 'left',
				fill: '#ffffff',
				stroke: '#000000',
				strokeWidth: 4,
			}).addChildTo(this);
			label.x = 8;
			label.y = 0;
			this.label = label;
		}
		{
			const label = Label({
				originX: 0.5,
				originY: 0.5,
				fontSize: 8,
				lineHeight: 2,
				align: 'center',
				fill: '#ffffff',
				stroke: '#000000',
				strokeWidth: 4,
			}).addChildTo(this);
			label.x = DF.SC_W * 0.5;
			label.y = DF.SC_H * 0.5;
			label.text = "hkt6";
			this.centerLabel = label;
		}
		this.data = data;
	},

	getScoreItem: function(diff) {
		const scoreItems = this.data.scoreItems;
		for (let i = 0; i < scoreItems.length; i++) {
			const item = scoreItems[i];
			if (diff < item.time) return scoreItems[i];
		}
		return scoreItems[scoreItems.length - 1];
	},

	update: function() {
		const player = this.data.player;

		const progress = this.data.progress;
		switch (progress.state) {
		case StateId.S1I:
			this.centerLabel.text = "おまえの秒を刻め！\nタップでスタート";
			progress.elapsedTime = 0;
			progress.stateTime = 0;
			progress.state = StateId.S1;
			progress.score = 0;
			progress.isPlaying = false;
			progress.tapCount = 0;
			this.data.record.tapTimes.splice(0, this.data.record.tapTimes.length);
			{
				const scoreItems = this.data.scoreItems;
				for (let i = 0; i < scoreItems.length; i++) {
					const item = scoreItems[i];
					progress.scoreItemsCounts[item.index] = 0;
				}
			}

			break;
		case StateId.S1:
			if (this.app.pointer.getPointingEnd()) {
				this.centerLabel.text = "";
				progress.state = StateId.S2I;
			}
			break;
		case StateId.S2I:
			this.centerLabel.text = "READY";
			progress.stateTime = 0;
			progress.state = StateId.S2;
			break;
		case StateId.S2:
			if (1000 < progress.stateTime) {
				this.centerLabel.text = "";
				progress.isPlaying = true;
				progress.state = StateId.S3;
			}
			break;
		case StateId.S3:
			// 操作.
			if (this.app.pointer.getPointingStart()) {
				//console.log(`click ${this.app.pointer.position.x.toFixed(1)}, ${this.app.pointer.position.y.toFixed(1)}`);
				const sec1 = this.data.progress.elapsedTime;
				const sec2 = Math.round(sec1 / 1000) * 1000;
				const diff = Math.abs(sec2 - sec1);
				const scoreItem = this.getScoreItem(diff);
				progress.score += scoreItem.score;
				progress.tapCount += 1;
				progress.scoreItemsCounts[scoreItem.index] += 1;
				this.data.record.tapTimes.push(sec1);

				var sprite = new Label({
					text: scoreItem.name,
					originX: 0.5,
					originY: 0.5,
					fontSize: 16,
					lineHeight: 2,
					align: 'center',
					fill: scoreItem.fillColor,
					stroke: '#000000',
					strokeWidth: 4,
				});
				
				let pos = new Vector2(this.data.clockNeedleSprite.x, this.data.clockNeedleSprite.y);
				pos.add(new Vector2().fromDegree(this.data.clockNeedleSprite.rotation - 90, 64));
				sprite.x = pos.x;
				sprite.y = pos.y;

				sprite.addChildTo(this.layer1);
				sprite.elapsedTime = 0;
				sprite.update = () => {
					const t = sprite.elapsedTime / 1000;
					if (1 <= t) {
						sprite.remove();
					}
					sprite.y -= 25 * this.app.ticker.deltaTime / 1000;
					sprite.elapsedTime += this.app.ticker.deltaTime;
				};

			}
			if (60 <= progress.tapCount) {
				progress.state = StateId.S4I;
			}
			if (60000 <= progress.elapsedTime) {
				progress.state = StateId.S4I;
			}
			if (this.app.keyboard.getKeyDown('r')) {
				progress.state = StateId.S1I;
			}
			if (this.app.keyboard.getKeyDown('t')) {
				progress.elapsedTime = progress.limitTime - 6000;
			}

			this.data.progress.elapsedTime += this.app.ticker.deltaTime;

			break;
		case StateId.S4I:
			progress.isPlaying = false;
			progress.state = StateId.S4;
			this.centerLabel.text = "おしまい";
			progress.stateTime = 0;
			break;
		case StateId.S4:
			if (2000 <= progress.stateTime) {
				progress.state = StateId.S5I;
			}
			break;
		case StateId.S5I:
			progress.state = StateId.S5;
			let resultText = `スコア ${progress.score}\n`;
			{
				const scoreItems = this.data.scoreItems;
				for (let i = 0; i < scoreItems.length; i++) {
					const item = scoreItems[i];
					const cnt = progress.scoreItemsCounts[item.index];
					resultText += `${item.name} x${cnt}\n`;
				}
			}
			this.centerLabel.text = resultText;
			progress.stateTime = 0;
			progress.elapsedTime = 0;
			break;
		case StateId.S5:
			let record = this.data.record;
			while (record.recordI < record.tapTimes.length) {
				const time = record.tapTimes[record.recordI];
				if (time <= progress.stateTime) {
					progress.elapsedTime += 1000;
					record.recordI += 1;
				} else {
					break;
				}
			}
			if (this.app.pointer.getPointingEnd()) {
				progress.state = StateId.S1I;
			}
			break;
		}
		progress.stateTime += this.app.ticker.deltaTime;

		const sec1 = (this.data.progress.elapsedTime / 1000);
		const sec2 = Math.floor(sec1);
		const rot2 = sec2 * 360 / 60;
		this.data.clockNeedleSprite.rotation = rot2;
		let alpha = 1.0;
		if (progress.isPlaying) {
			if (sec1 < 55) {
				alpha = 1.0 - (MathHelper.clamp(sec1 - 15, 0, 5) / 5.0);
			} else {
				alpha = (MathHelper.clamp(sec1 - 55, 0, 5) / 5.0);
			}
		}
		this.data.clockNeedleSprite.alpha = alpha;

		this.debugLabel.text = ``;
		this.label.text = `スコア ${progress.score}\n${progress.tapCount}秒`;


		// sort
		this.layer1.children.sort((a, b) => {
			return a.priority - b.priority;
		});
	},
});

// メイン処理
phina.main(function() {
  // アプリケーション生成
  let app = GameApp({
    startLabel: 'main', // メインシーンから開始する
		fps: 60,
		width: DF.SC_W,
		height: DF.SC_H,
    assets: ASSETS,
  });
  // アプリケーション実行
  app.run();
});

