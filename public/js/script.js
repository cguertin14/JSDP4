((win, $) => {
	function clone(src, out) {
		for (let attr in src.prototype)
			out.prototype[attr] = src.prototype[attr];
	}

	function Circle() {
		this.item = $('<div class="circle"></div>');
	}

	Circle.prototype.tint = function (clr) {
		this.item.css('background', clr);
	};

	Circle.prototype.move = function (left, top) {
		this.item.css('left', left);
		this.item.css('top', top);
	};

	Circle.prototype.get = function () {
		return this.item;
	};

	Circle.prototype.next = function (shp) {
		if (shp) {
			this.nextShape = shp;
		}

		return this.nextShape;
	};

	Circle.prototype.chainDo = function (action, args, count) {
		this[action].apply(this, args);
		
		if (count && this.nextShape) {
			setTimeout(binder(this, () =>{
				this.nextShape.chainDo(action, args, --count);
			}), 20);
		}
	};

	Circle.prototype.getID = function () {
		return this.id;
	};

	Circle.prototype.setID = function (id) {
		this.id = id;
	};

	function Rect() {
		this.item = $('<div class="rect"></div>');
	}
	clone(Circle, Rect);

	function binder(scope, fn) {
		return function () {
			return fn.apply(scope, arguments);
		};
	}

	function shapeFacade(shp) {
		return {
			tint: binder(shp, shp.tint),
			move: binder(shp, shp.move),
			getID: binder(shp, shp.getID),
			setID: binder(shp, shp.setID)
		};
	}

	function selfDestructDecorator(obj) {

		obj.item.click(function () {
			obj.kill();
		});

		obj.kill = function () {
			this.item.remove();
		};
	}

	function RedCircleBuilder() {
		this.item = new Circle();
		this.init();
	}

	RedCircleBuilder.prototype.init = function () {
		//NOTHING
	};

	RedCircleBuilder.prototype.get = function () {
		return this.item;
	};

	function BlueCircleBuilder() {
		this.item = new Circle();
		this.init();
	}

	BlueCircleBuilder.prototype.init = function () {
		this.item.tint('blue');
		let rect = new Rect();
		rect.tint('yellow');
		rect.move(40, 40);
		selfDestructDecorator(rect);

		this.item.get().append(rect.get());
	};

	BlueCircleBuilder.prototype.get = function () {
		return this.item;
	};

	function ShapeFactory() {
		this.types = {};
		this.create = (type) => {
			return new this.types[type]().get();
		};
		this.register = function (type, cls) {
			if (cls.prototype.init && cls.prototype.get) {
				this.types[type] = cls;
			}
		};
	}


	function StageAdapter(id) {
		this.index = 0;
		this.context = $(id);
		this.SIG = 'stageItem_';
	}

	StageAdapter.prototype.add = function (item) {
		++this.index;
		item.addClass(this.SIG + this.index);
		this.context.append(item);
	};

	StageAdapter.prototype.remove = function (index) {
		this.context.remove('.' + this.SIG + index);
	}

	function CompositeController(a) {
		this.a = a;
	}

	CompositeController.prototype.action = function (act) {
		let args = Array.from(arguments);
		args.shift();
		for (let item in this.a) {
			this.a[item][act].apply(this.a[item], args);
		}
	};

	const flyWeightFader = function (item) {
		if (item.hasClass('circle')) {
			item.fadeTo(.5, item.css('opacity') * .5);
		}
	};


	const CircleGeneratorSingleton = (() => {
		let instance;

		const init = () => {
			let _aCircle = [],
				_stage,
				_sf = new ShapeFactory(),
				_cc = new CompositeController(_aCircle);

			const _position = (circle, left, top) => {
				circle.move(left, top);
			};

			const registerShape = (name, cls) => {
				_sf.register(name, cls);
			};

			const setStage = (stg) => {
				_stage = stg.context;
			};

			const create = (left, top, type) => {
				var circle = _sf.create(type),
					index = _aCircle.length - 1;
				circle.move(left, top);
				circle.setID(_aCircle.length);
				_aCircle.push(circle);

				if (index !== -1) {
					_aCircle[index].next(circle);
				}

				return shapeFacade(circle);
			};

			const chainTint = (count) => {
				let index = Math.max(0, _aCircle.length - count),
					clr = `#${Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16) + Math.floor(Math.random() * 255).toString(16)}`;

				_aCircle[index].chainDo('tint', [clr], count);
			};

			const tint = (clr) => {
				_cc.action('tint', clr);
			};

			const move = (left, top) => {
				_cc.action('move', left, top);
			};

			const add = (circle) => {
				_stage.append(_aCircle[circle.getID()].get());
			};

			const index = () => {
				return _aCircle.length;
			};

			return { index, create, add, register: registerShape, setStage, tint, move, chainTint };
		};

		return {
			getInstance() {
				if (!instance) {
					instance = init();
				}

				return instance;
			}
		}
	})();

	$(win.document).ready(function () {

		var cg = CircleGeneratorSingleton.getInstance();
		cg.register('red', RedCircleBuilder);
		cg.register('blue', BlueCircleBuilder);
		cg.setStage(new StageAdapter('.advert'));

		$('.advert').click(function (e) {
			let circle = cg.create(e.pageX - 25, e.pageY - 25, 'red');

			cg.add(circle);
			cg.chainTint(5);

			flyWeightFader($(e.target));
		});

		$(document).keydown(function (e) {
			if (e.key === 'a') {
				var circle = cg.create(Math.floor(Math.random() * 600), Math.floor(Math.random() * 600), "blue");
				cg.add(circle);
			} else if (e.key === 't') {
				cg.tint('black');
			} else if (e.key === 'ArrowRight') {
				cg.move('+=5px', '+=0px');
			} else if (e.key === 'ArrowLeft') {
				cg.move('-=5px', '+=0px');
			}
		});
	});

})(window, $);