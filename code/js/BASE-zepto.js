/*
 * ---------------------------------------------
 * website:
 * filename: BASE.js
 * revision: 1.0
 * createdate: 2014-09-17 17:22
 * author: lc
 * description: use zepto.js
 * ---------------------------------------------
 */
var BASE = BASE || {};
/**
 * 命名空间函数
 * */
BASE.namespace = function(_name) {
	var parts = _name.split('.'), i, size, parent = BASE;
	//去掉全局变量
	if(parts[0] === 'BASE'){
		parts = parts.slice(1);
	}
	size = parts.length;
	for(i = 0; i < size; i++){
		//不存在就建一个空对象
		if(typeof parent[parts[i]] === 'undefined'){
			parent[parts[i]] = {};
		}
		//层层深入
		parent = parent[parts[i]];
	}
	return parent;
};

/*
 * Cardview 滑动模块
 * */
BASE.namespace('BASE.COM.Cardview');
BASE.COM.Cardview = (function() {
	var
		init = function(options) {
			return new App(options);
		};

	var utils = (function() {
		var me = {};

		var _elementStyle = document.createElement('div').style;
		var _vendor = (function() {
			var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			    transform,
			    i       = 0,
			    l       = vendors.length;

			for(; i < l; i++){
				transform = vendors[i] + 'ransform';
				if(transform in _elementStyle){
					return vendors[i].substr(0, vendors[i].length - 1);
				}
			}
			
			return false;
		})();

		function _prefixStyle(style) {
			if(_vendor === false) return false;
			if(_vendor === '') return style;
			return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
		}

		me.getTime = Date.now || function getTime() { return new Date().getTime(); };
		
		me.extend = function(target, obj) {
			for(var i in obj){
				target[i] = obj[i];
			}
		};
		me.addEvent = function(el, type, fn, capture) {
			el.addEventListener(type, fn, !!capture);
		};

		me.removeEvent = function(el, type, fn, capture) {
			el.removeEventListener(type, fn, !!capture);
		};
		me.addClass = function(_node, _class) {
			if(!(new RegExp('(^|\\s+)' + _class + '($|\\s+)')).test(_node.className)){
				_node.className = _node.className + ' ' + _class;
			}
		};
		me.removeClass = function(_node, _class) {
			_node.className = _node.className.replace(new RegExp('(^|\\s+)' + _class + '($|\\s+)'), ' ');
		};
		me.toggleClass = function(_node, _class) {
			_node.className.indexOf(_class) === -1 ? this.addClass(_node, _class) : this.removeClass(_node, _class);
		};
		
		var _transform = _prefixStyle('transform');
		var _perspective = _prefixStyle('perspective');

		me.extend(me, {
			hasTransform   : _transform != false,
			hasPerspective : _perspective != false,
			hasTouch       : 'ontouchstart' in window,
			hasTransition  : _prefixStyle('transition') in _elementStyle
		});

		me.extend(me.style = {}, {
			transform                : _transform,
			transitionTimingFunction : _prefixStyle('transitionTimingFunction'),
			transitionDuration       : _prefixStyle('transitionDuration'),
			transformOrigin          : _prefixStyle('transformOrigin'),
			perspective              : _perspective,
			transformStyle           : _prefixStyle('transformStyle')
		});
		me.extend(me.eventType = {}, {
			touchstart : 1,
			touchmove  : 1,
			touchend   : 1,

			mousedown : 2,
			mousemove : 2,
			mouseup   : 2,

			MSPointerDown : 3,
			MSPointerMove : 3,
			MSPointerUp   : 3
		});
		return me;
	})();

	////////////////////////////////////////////////////////////////////////////////////////////////////////

	function App(options) {
		this.options = {
			wraper     : '#CardviewWrapper',
			pages      : '.CardviewPage',
			startPage  : 1,
			duration   : 400,
			distance   : 100,
			scale      : 0.2,
			resizeTime : 100,
			translateZ : true,
			loopPage   : true,
			prevPage   : true,
			nextPage   : true,
			toastPage  : true,
			callback   : null
		};
		utils.extend(this.options, options);
		this.wrapper = document.querySelector(this.options.wraper);
		this.cards = this.wrapper.querySelectorAll(this.options.pages);
		this.length = this.cards.length;
		
		this.translateZ = this.options.translateZ && utils.hasPerspective ? ' translateZ(0)' : '';
		for(var i = 0; i < this.length; i++){
			this.cards[i].style[utils.style.transitionTimingFunction] = 'ease-out';
		}
		
		this.loop = this.options.loopPage;
		this.prev = this.options.prevPage;
		this.next = this.options.nextPage;
		this.toast = this.options.toastPage;
		
		this.isMouseDown = false;
		this.isAnimating = false;
		this._refresh();
		this._init();

	}

	App.prototype = {
		handleEvent    : function(e) {
			switch(e.type) {
				case 'touchstart':
				case 'MSPointerDown':
				case 'mousedown':
					this._start(e);
					break;
				case 'touchmove':
				case 'MSPointerMove':
				case 'mousemove':
					this._move(e);
					break;
				case 'touchend':
				case 'MSPointerUp':
				case 'mouseup':
				case 'touchcancel':
				case 'MSPointerCancel':
				case 'mousecancel':
					this._end(e);
					break;
				case 'orientationchange':
				case 'resize':
					this._resize();
					break;
				case 'transitionend':
				case 'webkitTransitionEnd':
				case 'oTransitionEnd':
				case 'MSTransitionEnd':
					this._transitionEnd(e);
					break;
				case 'DOMMouseScroll':
				case 'mousewheel':
					//this._wheel(e);
					break;
				case 'keydown':
					//this._key(e);
					break;
			}
		},
		_initEvents    : function(remove) {
			var eventType = remove ? utils.removeEvent : utils.addEvent;

			eventType(document, 'touchmove', function(e){
				e.preventDefault();
			}, false);

			eventType(window, 'orientationchange', this);
			eventType(window, 'resize', this);
			
			eventType(this.wrapper, 'mousedown', this);
			eventType(window, 'mousemove', this);
			eventType(window, 'mousecancel', this);
			eventType(window, 'mouseup', this);
			
			if(utils.hasPointer){
				eventType(this.wrapper, 'MSPointerDown', this);
				eventType(window, 'MSPointerMove', this);
				eventType(window, 'MSPointerCancel', this);
				eventType(window, 'MSPointerUp', this);
			}

			if(utils.hasTouch){
				eventType(this.wrapper, 'touchstart', this);
				eventType(window, 'touchmove', this);
				eventType(window, 'touchcancel', this);
				eventType(window, 'touchend', this);
			}
		},
		_destroy       : function() {
			this._initEvents(true);

			utils.removeEvent(this.activePage, 'transitionend', this);
			utils.removeEvent(this.activePage, 'webkitTransitionEnd', this);
			utils.removeEvent(this.activePage, 'oTransitionEnd', this);
			utils.removeEvent(this.activePage, 'MSTransitionEnd', this);
		},
		_refresh       : function() {
			this.wrapperSize = this.wrapper.offsetHeight;
		},
		_resize        : function() {
			clearTimeout(this.resizeTimeout);
			this.resizeTimeout = setTimeout(this._refresh.bind(this), this.options.resizeTime);
		},
		_init          : function() {
			this.current = this.options.startPage - 1;
			this.currentPage = this.cards[this.current];
			utils.addClass(this.currentPage, 'app-current');
			this._initEvents();
		},
		_start         : function(e) {
			//console.log('_start', this.direction)
			if(this.isAnimating){
				return;
			}
			if(!utils.hasTouch && e.button !== 0){
				return;
			}
			var point = e.touches ? e.touches[0] : e;
			this.direction = 0;
			this.isMouseDown = true;
			this.isAnimating = false;
			this.moved = false;
			this.startTime = utils.getTime();
			this.startY = point.pageY;
		},
		_move          : function(e) {
			if(this.isMouseDown){
				var point = e.touches ? e.touches[0] : e;
				this.endY = point.pageY;
				var distance = this.endY - this.startY;
				var absDistance = Math.abs(distance);
				this.direction = distance / absDistance;

				if(!this.moved){
					this._effectInit();
				}

				e.preventDefault();
				e.stopPropagation();
				if(this.direction == -1 && !this.next){
					return false;
				} else if(this.direction == 1 && !this.prev){
					return false;
				} else{
					this.moved = true;
					this._effectMove(distance);
					console.log(1)
				}
			}
		},
		_end           : function(e) {
			this.isMouseDown = false;
			if(!this.moved){
				return;
			}
			distance = this.endY - this.startY;
			this._effectEnd(distance);
		},
		_setActivePage : function() {
			var _max = this.length;
			var _cur = this.current;
			var _dir = this.direction;
			//console.log(this.loop)
			if(this.loop){
				//循环
				if(_dir == -1){
					this.active = _cur < _max - 1 ? _cur + 1 : 0;
				} else if(_dir == 1){
					this.active = _cur > 0 ? _cur - 1 : _max - 1;
				}
			} else{
				//不循环
				if(_dir == -1){
					this.active = _cur < _max - 1 ? _cur + 1 : "null";
				} else if(_dir == 1){
					this.active = _cur > 0 ? _cur - 1 : "null";
				}
			}
			if(this.active === "null"){
				this.activePage = null;
			} else{
				this.activePage = this.cards[this.active];
			}
		},
		_effectInit    : function(show) {
			if(!show){
				this._setActivePage();
			}
			var active = this.active, i = 0;
			for(; i < this.length; i++){
				this.cards[i].style[utils.style.transitionDuration] = '0ms';
				if(i == active && !isNaN(this.direction)){
					 this.cards[i].style[utils.style.transform] = 'translateY(' + this.direction * -100 + '%)' + this.translateZ;
				} else{
					this.cards[i].style[utils.style.transform] = 'translateY(-100%)';
				}
			}
		},
		_effectMove    : function(distance) {
			//console.log('_effectMove')
			this._setActivePage();
			this.isAnimating = true;
			var absDistance = Math.abs(distance);
			var translateY, scale, origin;
			if(this.direction == -1){
				translateY = this.wrapperSize - absDistance;
				origin = '50% 0';
			} else if(this.direction == 1){
				translateY = absDistance - this.wrapperSize;
				origin = '50% 100%';
			} else{
				//console.log(this.direction)
				translateY = 0;
			}
			scale = (this.wrapperSize - absDistance) / this.wrapperSize;
			scale = scale > this.options.scale ? scale : this.options.scale;
			for(var i = 0; i < this.length; i++){
				utils.removeClass(this.cards[i], 'app-active');
				//this.cards[i].style[utils.style.transitionDuration] = '0ms';
			}
			if(this.currentPage){
				//console.log(!!this.activePage)
				this.currentPage.style[utils.style.transformOrigin] = origin;
				if(this.activePage && translateY){
					utils.addClass(this.activePage, 'app-active');
					this.activePage.style[utils.style.transform] = 'translateY(' + translateY + 'px)' + this.translateZ;
					this.currentPage.style[utils.style.transform] = 'scale(' + scale + ')' + this.translateZ;
				} else{
					this.currentPage.style[utils.style.transform] = 'scale(' + scale + ') translateY(' + distance + 'px)' + this.translateZ;
				}
			}
		},
		_effectEnd     : function(distance) {
			//console.log(this.endY)
			var move = this.move = Math.abs(distance) >= this.options.distance;
			if(this.currentPage){
				this.currentPage.style[utils.style.transitionDuration] = this.options.duration + 'ms';
				if(this.activePage){
					this.activePage.style[utils.style.transitionDuration] = this.options.duration + 'ms';
					if(move){
						this.currentPage.style[utils.style.transform] = 'scale(' + this.options.scale + ')' + this.translateZ;
						this.activePage.style[utils.style.transform] = 'translateY(0)' + this.translateZ;
						utils.addClass(this.activePage, 'app-current');
						this.current = this.active;
						this.currentPage = this.activePage;
					} else{
						this.activePage.style[utils.style.transform] = 'translateY(' + this.direction * -100 + '%)' + this.translateZ;
						utils.addClass(this.currentPage, 'app-current');
						this.currentPage.style[utils.style.transform] = 'scale(1)' + this.translateZ;
					}
					this.activePage.addEventListener('transitionend', this);
					this.activePage.addEventListener('webkitTransitionEnd', this);
					this.activePage.addEventListener('oTransitionEnd', this);
					this.activePage.addEventListener('MSTransitionEnd', this);
				} else{
					this.currentPage.style[utils.style.transform] = 'scale(1)' + this.translateZ;
					this.currentPage.addEventListener('transitionend', this);
					this.currentPage.addEventListener('webkitTransitionEnd', this);
					this.currentPage.addEventListener('oTransitionEnd', this);
					this.currentPage.addEventListener('MSTransitionEnd', this);
				}
				//console.log(this.activePage)
			}
		},
		_transitionEnd : function() {
			//console.log('_transitionEnd');
			this.isAnimating = false;
			if(this.currentPage){
				utils.removeEvent(this.currentPage, 'transitionend', this);
				utils.removeEvent(this.currentPage, 'webkitTransitionEnd', this);
				utils.removeEvent(this.currentPage, 'oTransitionEnd', this);
				utils.removeEvent(this.currentPage, 'MSTransitionEnd', this);
			}
			if(this.activePage){
				utils.removeEvent(this.activePage, 'transitionend', this);
				utils.removeEvent(this.activePage, 'webkitTransitionEnd', this);
				utils.removeEvent(this.activePage, 'oTransitionEnd', this);
				utils.removeEvent(this.activePage, 'MSTransitionEnd', this);
				for(var i = 0; i < this.length; i++){
					utils.removeClass(this.cards[i], 'app-active');
					if(i != this.active){
						if(this.move){
							utils.removeClass(this.cards[i], 'app-current');
						}
						//this.cards[i].style[utils.style.transform] = 'none';
						//this.cards[i].style[utils.style.transitionDuration] = '0ms';
					}
				}
				this.activePage = null;
			}
			var _fn = this.options.callback;
			if(_fn && '[object Function]' === Object.prototype.toString.call(_fn)){
				_fn(this);
			}
		},
		_gotoPage      : function(_num) {
			var _this = this;
			var page = parseInt(_num, 10);
			var target = page - 1;
			if(page > this.length || page < 1){
				console.log('_num is not right!');
				return;
			}
			var origin;
			if(page > this.current){
				this.direction = -1;
				origin = '50% 0';
			} else if(page < this.current){
				this.direction = 1;
				origin = '50% 100%';
			} else{
				console.log('_num is current page!');
				return;
			}
			this.active = target;
			this.activePage = this.cards[this.active];
			this._effectInit(1);
			this.currentPage.style[utils.style.transformOrigin] = origin;
			setTimeout(function() {
				utils.addClass(_this.activePage, 'app-active');
				_this._effectEnd(_this.options.distance);
			}, 100);
		}
	};

	return {
		init  : init,
		utils : utils
	}
}());