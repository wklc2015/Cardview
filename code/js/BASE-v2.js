/*
 * ---------------------------------------------
 * website:
 * filename: LOMARK.js
 * revision: 1.0
 * createdate: 2014-09-17 17:22
 * author: lc
 * description: 
 * ---------------------------------------------
 */
var LOMARK = LOMARK || {};
/**
 * 命名空间函数
 * */
LOMARK.namespace = function (_name) {
    var parts = _name.split('.'), i, size, parent = LOMARK;
    //去掉全局变量
    if (parts[0] === 'LOMARK') {
        parts = parts.slice(1);
    }
    size = parts.length;
    for (i = 0; i < size; i++) {
        //不存在就建一个空对象
        if (typeof parent[parts[i]] === 'undefined') {
            parent[parts[i]] = {};
        }
        //层层深入
        parent = parent[parts[i]];
    }
    return parent;
};

/**
 * 常量 constant
 * */
LOMARK.namespace('LOMARK.COM.Constant');
LOMARK.COM.Constant = (function () {

    //生成一个8位唯一字符串
    function prefix() {
        return ( +new Date().getTime() + '' ).slice(-8);
    }

    //提示一个文本
    function toast(_txt, _time) {
        var $toastNode = $('#toast'), time = _time || 1000, timer;
        clearTimeout(timer);
        if (!$toastNode.length) {
            $toastNode = $('<div id="toast" class="toast"></div>').appendTo('body');
        }
        $toastNode.removeClass('show').html(_txt).addClass('show').css('z-index', prefix());
        timer = setTimeout(function () {
            $toastNode.remove();
        }, time)
    }

    return {
        prefix: prefix,
        toast : toast
    }
}());


/*
 * app 滑动模块
 * */
LOMARK.namespace('LOMARK.COM.APP');
LOMARK.COM.APP = (function () {
    var
        init = function (options) {
            return new App(options);
        };

    function App(options) {
        var _this = this, defaults = {
            container            : 'section.pageWraper',
            selector             : 'section.pageBox',
            firstPageNumber      : 1,
            isDisableLoopPage    : false,      //是否禁用循环翻页
            isDisableFlipPrevPage: false,      //是否禁用向上翻页
            isDisableFlipNextPage: false,      //是否禁用向下翻页
            isDisableTapPage     : true,      //是否禁用点击翻页
            isDisableToast       : false,      //是否禁用文本提示
            callback             : null
        };
        this.settings = $.extend({}, defaults, options);
        this.boxHeight = $(window).height();
        //定义属性对象
        this._$container = $(this.settings.container);							//app容器包装对象
        this._$pages = this._$container.find(this.settings.selector);	    //app中所有的页面集合
        this._$currentPage = null;		//当前页面
        this._$activePage = null;     //活动页面(即将显示的页面)
        this._length = this._$pages.length;
        this._callback = this.settings.callback;

        //定义状态属性
        this._isDisableLoopPage = this.settings.isDisableLoopPage;
        this._isDisableFlipPrevPage = this.settings.isDisableFlipPrevPage;
        this._isDisableFlipNextPage = this.settings.isDisableFlipNextPage;
        this._isDisableTapPage = this.settings.isDisableTapPage;
        this._isDisableToast = this.settings.isDisableToast;

        this._isAnimating = false;  			//是否翻页动画效果进行中
        this.time = 500;
        //定义临时变量
        var isFirstLoop = false;   //首次循环翻页时，禁止从首页进入尾页
        var startX = 0, startY = 0, moveDistanceX = 0, moveDistanceY = 0;

        var isMouseDown = false;      //是否可以滑动
        var isShowNext = false;       //是否显示下一屏(向上拉)
        var isFirstMoveEvent = true;   //是否启动后第一次进入move事件
        var isFirstPage = false, isLastPage = false;  //首页和尾页
        var tipDisablePrevText = false; 		//提示禁用向上翻页
        var tipDisableNextText = false; 		//提示禁用向下翻页
        var tipDisableLoopText = false; 		//提示禁用循环翻页

        init();

        //初始化函数
        function init() {
            initNode();
            event();
        }

        function initNode() {
            //显示初始化页
            _this._$pages.eq(_this.settings.firstPageNumber - 1).addClass('z-current');
            //禁止ios的浏览器容器弹性(暂时未做测试)
            $(window)
                .on('scroll.elasticity', function (e) {
                    e.preventDefault();
                })
                .on('touchmove.elasticity', function (e) {
                    e.preventDefault();
                })
                .delegate('img', 'mousemove', function (e) {
                    e.preventDefault();
                });
        }

        //绑定事件
        function event() {
            if (!_this._isDisableTapPage) {
                _this._$pages.on('tap', funcTap);
            }
            _this._$container.on('touchstart', funcStart);
            _this._$container.on('touchmove', funcMove);
            _this._$container.on('touchend', funcEnd);
        }

        function funcTap(e) {
            //console.log('touch tap')
            if (_this._isDisableFlipNextPage) {
                return false;
            }
            console.log(_this._isAnimating)

            if(_this._isAnimating){
                return false;
            }
            var $this = _this._$pages.filter('.z-current');
            var length = _this._length;
            var idx = $this.index() + 1;
            if (idx === length) {
                idx = 0;
            }
            _this.showPage(idx + 1);
        }

        //鼠标按下事件
        function funcStart(e) {
            console.log('touch start')
            //动画正在运行时不进行下一轮切换
            if (_this._isAnimating) {
                isMouseDown = false;
                return;
            }
            //获取当前显示的页面
            _this._$currentPage = _this._$pages.filter('.z-current');
            _this._$activePage = null;
            if (_this._$currentPage && _this._$currentPage.length) {
                //初始化变量
                isMouseDown = true;
                isShowNext = false;
                isFirstMoveEvent = true;
                isFirstPage = false;
                isLastPage = false;
                tipDisablePrevText = false;
                tipDisableNextText = false;
                tipDisableLoopText = false;
                moveDistanceX = 0;
                moveDistanceY = 0;
                startX = e.touches[0].pageX;
                startY = e.touches[0].pageY;
                _this._$currentPage.addClass('z-move');
                _this._$currentPage[0].style.webkitTransition = 'none';
                console.log(isMouseDown)
            }
        }

        //鼠标移动事件
        function funcMove(e) {
            console.log('touch move');
            //进入滑动
            if (isMouseDown && _this._$currentPage && _this._$currentPage.length && ((_this._$activePage && _this._$activePage.length) || isFirstMoveEvent)) {
                //获取移动距离
                moveDistanceX = e.touches[0].pageX - startX;
                moveDistanceY = e.touches[0].pageY - startY;
                //获取当前页的序号
                var idx = _this._$currentPage.index();
                //如果Y移动的距离大于X移动的距离，则进行翻页操作
                //console.log(Math.abs(moveDistanceY))
                if (Math.abs(moveDistanceY) > Math.abs(moveDistanceX)) {
                    //判断用户是向上还是向下拉
                    if (moveDistanceY > 0) {
                        //向下拉，显示上一页
                        if (_this._isDisableFlipPrevPage) {
                            //禁止向上翻页
                            tipDisablePrevText = true;
                            return;
                        }
                        if (isShowNext || isFirstMoveEvent) {
                            isShowNext = false;
                            isFirstMoveEvent = false;
                            //清除上次将要显示的页面
                            if (_this._$activePage && _this._$activePage.length) {
                                _this._$activePage.removeClass('z-active z-move');
                                _this._$activePage = null;
                            }
                            //获取当前将要显示的上一页,即 activePage
                            if (_this._isDisableLoopPage) {
                                //禁止循环翻页
                                if (idx == 0) {
                                    _this._$activePage = null;
                                    isFirstPage = true;
                                } else {
                                    _this._$activePage = _this._$pages.eq(idx - 1);
                                }
                            } else {
                                //循环翻页
                                if (idx == 0) {
                                    if (isFirstLoop) {
                                        _this._$activePage = _this._$pages.last();
                                    } else {
                                        _this._$activePage = null;
                                        isFirstPage = true;
                                    }
                                } else {
                                    _this._$activePage = _this._$pages.eq(idx - 1);
                                }
                            }

                            if (_this._$activePage && _this._$activePage.length) {
                                //获取成功：初始化上一页
                                _this._$activePage.addClass('z-active z-move');
                                _this._$activePage[0].style.webkitTransition = 'none';
                                _this._$activePage[0].style.webkitTransform = 'translateY(-100%) translateZ(0)';
                                _this._$currentPage[0].style.webkitTransformOrigin = 'bottom center';
                            } else {
                                //获取失败：重置当前页
                                _this._$currentPage[0].style.webkitTransform = 'translateY(0px) translateZ(0) scale(1)';
                            }
                        } else {
                            //移动时设置样式
                            _this._$activePage[0].style.webkitTransform = 'translateY(-' + (_this.boxHeight - moveDistanceY) + 'px) translateZ(0)';
                            _this._$currentPage[0].style.webkitTransform = 'scale(' + (_this.boxHeight / (_this.boxHeight + moveDistanceY)) + ') translateZ(0)';
                        }
                    } else if (moveDistanceY < 0) {
                        //向上拉，显示下一页
                        if (_this._isDisableFlipNextPage) {
                            //禁止向下翻页
                            tipDisableNextText = true;
                            return;
                        }
                        if (!isShowNext || isFirstMoveEvent) {
                            isShowNext = true;
                            isFirstMoveEvent = false;
                            //清除上次将要显示的页面
                            if (_this._$activePage && _this._$activePage.length) {
                                _this._$activePage.removeClass('z-active z-move');
                                _this._$activePage = null;
                            }
                            //获取当前将要显示的下一页
                            if (_this._isDisableLoopPage) {
                                //禁止循环切换
                                if (idx == _this._length - 1) {
                                    _this._$activePage = null;
                                    isLastPage = true;
                                } else {
                                    _this._$activePage = _this._$pages.eq(idx + 1);
                                }
                            } else {
                                //循环切换
                                if (idx != _this._length - 1) {
                                    _this._$activePage = _this._$pages.eq(idx + 1);
                                } else {
                                    _this._$activePage = _this._$pages.first();
                                    isFirstLoop = true;
                                }
                            }

                            if (_this._$activePage && _this._$activePage.length) {
                                //获取成功：初始化下一页
                                _this._$activePage.addClass('z-active z-move');
                                _this._$activePage[0].style.webkitTransition = 'none';
                                _this._$activePage[0].style.webkitTransform = 'translateY(' + _this.boxHeight + 'px) translateZ(0)';
                                _this._$currentPage[0].style.webkitTransformOrigin = 'top center';
                            } else {
                                //获取失败：重置当前页
                                _this._$currentPage[0].style.webkitTransform = 'translateY(0px) translateZ(0) scale(1)';
                            }
                        } else {
                            //移动时设置样式
                            _this._$currentPage[0].style.webkitTransform = 'scale(' + ((_this.boxHeight + moveDistanceY) / _this.boxHeight) + ') translateZ(0)';
                            _this._$activePage[0].style.webkitTransform = 'translateY(' + (_this.boxHeight + moveDistanceY) + 'px) translateZ(0)';
                        }
                    }
                }
            }
        }


        //鼠标松开事件
        function funcEnd(e) {
            //console.log('touch end')
            if (isMouseDown) {
                //设置临时变量
                isMouseDown = false;
                if (_this._$activePage && _this._$activePage.length) {
                    //启动转场动画
                    _this._$currentPage[0].style.webkitTransition = '-webkit-transform 0.4s ease-out';
                    _this._$activePage[0].style.webkitTransition = '-webkit-transform 0.4s ease-out';
                    if (Math.abs(moveDistanceY) > Math.abs(moveDistanceX) && Math.abs(moveDistanceY) > 100) {
                        _this.success(_this._$activePage, _this._$currentPage);
                    } else {
                        _this._isAnimating = true;
                        if (!isShowNext) {
                            _this._$currentPage[0].style.webkitTransform = 'scale(1) translateZ(0)';
                            _this._$activePage[0].style.webkitTransform = 'translateY(-100%) translateZ(0)';
                        } else {
                            _this._$currentPage[0].style.webkitTransform = 'scale(1) translateZ(0)';
                            _this._$activePage[0].style.webkitTransform = 'translateY(100%) translateZ(0)';
                        }
                        //页面动画运行完成后处理
                        setTimeout(function () {
                            _this._$activePage.removeClass('z-active z-move');
                            _this._isAnimating = false;
                        }, _this.time);
                    }
                } else {
                    _this._$currentPage.removeClass('z-move');
                    //开启提示信息
                    if (!_this._isDisableToast) {
                        //翻页相关
                        if (tipDisablePrevText) {
                            LOMARK.COM.Text.toast('禁用向上翻页！');
                        }
                        if (tipDisableNextText) {
                            LOMARK.COM.Text.toast('禁用向下翻页！');
                        }
                        //循环相关提示信息
                        if (_this._isDisableLoopPage) {
                            if (isLastPage && isShowNext) {
                                LOMARK.COM.Text.toast('已经是最后一页了！');
                            }
                            if (isFirstPage && !isShowNext) {
                                LOMARK.COM.Text.toast('已经是第一页了！');
                            }
                        } else {
                            if (!isFirstLoop && isFirstPage && !isShowNext) {
                                LOMARK.COM.Text.toast('已经是第一页了！');
                            }
                        }
                    }
                }
            }
        }
    }

    App.prototype = {
        showPage: function (page) {
            var _this = this;
            if (_this._isAnimating) {
                return false;
            }
            //找到要显示的页面
            var $page, type = typeof(page);
            switch (type) {
                case 'number':
                    //序号
                    $page = _this._$pages.eq(page - 1);
                    break;
                case 'string':
                    //选择器
                    $page = _this._$pages.filter(page - 1).first();
                    break;
                case 'object':
                    //dom  object
                    $page = $(page);
                    break;
                default:
                    //默认显示第一页
                    $page = _this._$pages.eq(0);
                    break;
            }
            var $curr = _this._$pages.filter('.z-current');
            var cIndex = $curr.index();
            var aIndex = $page.index();
            if ($page && $page.length && $curr && $curr.length && (cIndex !== aIndex)) {
                $page.addClass('z-active z-move');
                //$page[0].style.webkitTransition = 'none';
                if (cIndex > aIndex) {
                    //获取成功：初始化上一页
                    $page[0].style.webkitTransform = 'translateY(-100%) translateZ(0)';
                    $curr[0].style.webkitTransformOrigin = 'bottom center ';
                } else {
                    //获取成功：初始化下一页
                    $page[0].style.webkitTransform = 'translateY(' + _this.boxHeight + 'px) translateZ(0)';
                    $curr[0].style.webkitTransformOrigin = 'top center';
                }
                $curr[0].style.webkitTransition = '-webkit-transform 0.4s ease-out';
                $page[0].style.webkitTransition = '-webkit-transform 0.4s ease-out';
                //console.log(1)
                _this._isAnimating = true;
                setTimeout(function () {
                    //切换成功：设置当前页面动画
                    $curr[0].style.webkitTransform = 'scale(0.2) translateZ(0)';
                    $page[0].style.webkitTransform = 'translateY(0px) translateZ(0)';

                    setTimeout(function () {
                        $page.removeClass('z-active z-move').addClass('z-current');
                        $curr.removeClass('z-current z-move');
                        _this._isAnimating = false;
                        if ($.isFunction(_this._callback)) {
                            _this._callback($page, $curr);
                        }
                    }, _this.time);

                }, 100)
            }
        },
        success : function ($a, $c) {
            var _this = this;
            _this._isAnimating = true;
            //切换成功：设置当前页面动画
            $c[0].style.webkitTransform = 'scale(0.2) translateZ(0)';
            $a[0].style.webkitTransform = 'translateY(0px) translateZ(0)';
            //页面动画运行完成后处理
            setTimeout(function () {
                $a.removeClass('z-active z-move').addClass('z-current');
                $c.removeClass('z-current z-move');
                _this._isAnimating = false;
                if ($.isFunction(_this._callback)) {
                    _this._callback($a, $c);
                }
            }, _this.time);
        }
    };

    return {
        init: init
    }
}());


