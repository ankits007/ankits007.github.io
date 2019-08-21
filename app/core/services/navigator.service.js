/**
 * Created by AnkitS on 12/13/2017.
 */
(function (angular) {
    'use strict';

    angular.module('SurveyEngineCore')
        .service("SurveyEngine.NavigatorService", ["$timeout","SurveyEngine.ValidatorService", navigatorService]);

    function navigatorService($timeout, ValidatorService) {
        var vm = this;
        var KeyPress = {
            SPACE : 32,
            ENTER : 13,
            ESCAPE : 27,
            TAB : 9,
            IS_NUM : function (keyCode) {
                return (keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105);
            }
        }
        vm.Direction = {
            LEFT : 1,
            RIGHT : 2,
            UP : 3,
            DOWN : 4
        }
        var next = null, back = null;
        vm.checkBackDisable = function () { return true;};
        vm.setListener= null, vm.focusListener = null, vm.submit = null, vm.toggleSelection = null, vm.TOGGLE_BUTTON = false,
            vm.numKeyListener = null, vm.tabPressListener = null, vm.startUpSubmit = null;

        vm.IS_BLUR_EVENT = false;

        vm.IS_BLUR_EVENT = false;

        var nav = {
            // Mouse events.
            mouse: {

                // Slidr's with mouseover.
                over: [],

                // Whether a slidr-id already has mouseover.
                isOver: function (id) {
                    return indexOf(nav.mouse.over, id) >= 0;
                },

                // Add a slidr-id with mouseover event.
                add: function (id) {
                    if (!nav.mouse.isOver(id)) nav.mouse.over.push(id);
                },

                // Remove a slidr-id from mouseover event.
                remove: function (id) {
                    if (nav.mouse.isOver(id)) nav.mouse.over.splice(indexOf(nav.mouse.over, id), 1);
                },

                // Get the current top level Slidr being mouse'd over.
                current: function () {
                    var c = nav.mouse.over[nav.mouse.over.length - 1];
                    for (var i = 0, l = nav.mouse.over.length, m = nav.mouse.over[i]; i < l; i++) if (contains(c, m)) c = m;
                    return c;
                },

                // Track mouseenter/mouseleave events.
                track: function (el) {
                    bind(el, 'mouseenter', function (e) {
                        nav.mouse.add(sanitize(e).currentTarget.id);
                    });
                    bind(el, 'mouseleave', function (e) {
                        nav.mouse.remove(sanitize(e).currentTarget.id);
                    });
                }
            },

            // Keyboard events.
            keyboard: (function () {
                bind(document, 'keydown', function (e) {
                    e = sanitize(e);
                    if(isInputKeyDown(e)){
                        ValidatorService.HideError();
                    }
                    vm.TOGGLE_BUTTON = false;
                    // On tab click move next
                    if(e.which == KeyPress.ESCAPE){
                        // Remove all the dialogs in the page
                        var page = document.getElementById('page');
                        var modals = document.getElementsByClassName("modal");
                        Array.prototype.slice.call(modals).map(function (modal) {
                            page.removeChild(modal);
                        });
                    }else if(e.which == KeyPress.ENTER){
                        if(typeof vm.startUpSubmit == "function"){
                            vm.startUpSubmit();
                            vm.startUpSubmit = null;
                        }else if (typeof vm.submit == "function") {
                            vm.submit();
                        }
                    }else if(e.which == KeyPress.SPACE){
                        if (typeof vm.toggleSelection == "function") {
                            vm.toggleSelection();
                        }
                        // toggle
                    }else if(e.which == KeyPress.TAB){
                        if(typeof vm.tabPressListener == "function"){
                            vm.tabPressListener();
                        }
                    }else if(KeyPress.IS_NUM(e.which)){
                        var number = getNumberFromKey(e.which);
                        onNumPress(number);
                    }else {
                        if(!(e.ctrlKey||e.altKey||e.shiftKey)){
                            if (e.which <= 40 && e.which >= 37) {
                                var div = document.getElementById('surveyParent');
                                var dir = null;
                                if (e.which === 40) {
                                    dir = vm.Direction.DOWN;
                                    if (div.scrollHeight > div.clientHeight) {
                                        if ((div.scrollTop + div.clientHeight) < div.scrollHeight) {
                                            div.scrollTop += 20;
                                            return;
                                        } else {
                                            nav.slide(dir);
                                        }
                                    } else {
                                        nav.slide(dir);
                                    }
                                }
                                else if (e.which === 39) {
                                    dir = vm.Direction.RIGHT;
                                }
                                else if (e.which === 38) {
                                    dir = vm.Direction.UP;
                                    if (div.scrollHeight > div.clientHeight) {
                                        if (div.scrollTop == 0) {
                                            nav.slide(dir);
                                        } else {
                                            div.scrollTop -= 20;
                                            return;
                                        }
                                    } else {
                                        nav.slide(dir);
                                    }
                                }
                                else if (e.which === 37) {
                                    dir = vm.Direction.LEFT;
                                }
                                shiftCaret(e, dir);
                                changeFocus(dir);
                            }
                        }
                    }
                });
            })(),

            stop: function (e) {
                e = e || window.event;
                e.cancelBubble = true;
                e.returnValue = false;
                if (e.stopPropagation) e.stopPropagation();
                if (e.preventDefault) e.preventDefault();
                return false;
            },

            // Touch events.
            touch: function () {
                var start = {};
                var delta = {};
                bind(document, 'touchstart', function (e) {
                    e = sanitize(e);
                    start = {x: e.touches[0].pageX, y: e.touches[0].pageY, time: +new Date};
                    delta = {x: 0, y: 0, duration: 0};
                    // Position of scroll when touch start
                    delta['scrollPosition'] = document.getElementById('surveyParent').scrollTop;
                });
                bind(document, 'touchmove', function (e) {
                    e = sanitize(e);
                    if (e.touches.length > 1 || e.scale && e.scale !== 1) return;
                    var div = document.getElementById('surveyParent');
                    var dirV = (e.touches[0].pageY - start.y) < 0 ? vm.Direction.DOWN : vm.Direction.UP;
                    delta.duration = +new Date - start.time;
                    if (delta.duration > 100 && (Math.abs(delta.x) + Math.abs(delta.y)) / delta.duration < 0.25) return;
                    if (div.scrollHeight > div.clientHeight) {
                        if (delta.scrollPosition == 0) {
                            if (dirV == vm.Direction.UP) {
                                nav.slide(dirV);
                            } else {
                                return;
                            }
                        }
                        if (dirV == vm.Direction.DOWN) {
                            if ((div.scrollTop + div.clientHeight) < div.scrollHeight) {
                                return;
                            } else {
                                nav.slide(dirV);
                            }
                        } else {
                            return;
                        }
                    }
                    delta.x = e.touches[0].pageX - start.x;
                    delta.y = e.touches[0].pageY - start.y;
                    var ques = div.getElementsByTagName('survey-question')[0];
                    /* if (ques && !vm.checkBackDisable()) {
                     ques.style.position = 'relative';
                     ques.style.top = delta.y + 'px';
                     console.log(div.style.top)
                     }*/
                    nav.stop(e);
                });
                bind(document, 'touchend', function (e) {
                    var div = document.getElementById('surveyParent');
                    var ques = div.getElementsByTagName('survey-question')[0];
                    e = sanitize(e);
                    var isSlided = false;
                    if (Number(+new Date - start.time) < 250) {
                        var dx = Math.abs(delta.x);
                        var dy = Math.abs(delta.y);
                        var validH = dx > 20;
                        var validV = dy > 20;
                        var dirH = delta.x < 0 ? vm.Direction.RIGHT : vm.Direction.LEFT;
                        var dirV = delta.y < 0 ? vm.Direction.DOWN : vm.Direction.UP;
                        var dir = (validH && validV ? (dx > dy ? dirH : dirV) : (validH ? dirH : (validV ? dirV : null)));
                        if (dir) {
                            isSlided = true;
                            nav.slide(dir)
                        }
                        ;
                        //browser.stop(e);
                    }
                    if (ques && !isSlided) {
                        ques.style.position = 'relative';
                        ques.style.top = '0px';
                    }
                });
            },

            slide: function (d) {
                // specific slide off for mobiliar
                var projectID = r('ProjectGUID').GetValue();
                if(projectID == 'eccaad3e-59b1-6af8-1407-4a3baf54c153'){
                    return;
                }
                if(!moveCaret(d)){
                    if (d == vm.Direction.UP && !vm.checkBackDisable()) {
                        vm.Back();
                    } else if (d == vm.Direction.DOWN) {
                        vm.Next();
                    }
                }
            },

            mouseDown:(function () {
                bind(document, 'mousedown', function (e) {
                    vm.TOGGLE_BUTTON = false;
                    /*var par = e.target.parentNode;
                    if(e.target.classList.contains('clickable') || (par && (par.classList.contains('clickable') || par.classList.contains('right-btn')))){
                        e.preventDefault();
                    }*/
                });
            })()
        };

        vm.bindListeners = function (n, b) {
            next = n, back = b, nav.keyboard, nav.touch();
        };

        vm.removeListeners = function () {
            next = null;
            back = null;
        };

        vm.Next = function () {
            if (typeof next == "function") {
                next();
            }
        }

        vm.Back = function () {
            if (typeof back == "function") {
                back();
            }
        }

        vm.blockNavigation = false;

        function isInputKeyDown(e){
            return e.target.tagName == "INPUT";
        }
        
        function changeFocus(dir) {
            if(typeof vm.focusListener == "function"){
                vm.focusListener(dir);
            }
        }

        function onNumPress(number) {
            if(typeof vm.numKeyListener == "function"){
                vm.numKeyListener(number);
            }
        }

        function shiftCaret(e, direction) {
            if((e.target.tagName == "INPUT" || e.target.tagName == "TEXTAREA") && e.target.type != "number"){
                switch (direction){
                    case vm.Direction.LEFT:
                        e.target.selectionEnd--;
                        nav.stop(e);
                        break;
                    case vm.Direction.RIGHT:
                        e.target.selectionEnd++;
                        nav.stop(e);
                        break;
                    case vm.Direction.UP:
                       // ele.selectionEnd = 0;
                        break;
                    case vm.Direction.DOWN:
                        break;

                }
               // ele.selectionStart = ele.selectionEnd;
            }else if(e.target.tagName == "BODY"){
                var focusable = document.getElementsByClassName('focusableInput');
                if(focusable.length > 0 && !window.jsrcb.isMobile ){
                    focusable[0].focus();
                }
            }
        }

        function moveCaret(dir) {
            // do not navigate if input element is focused
            var focusable = document.getElementsByClassName('focusableInput');
            var focusedIndex = -1;
            var isFocused = Array.prototype.slice.call(focusable).reduce(function (prev, curr, i) {
                if(curr == document.activeElement){
                    focusedIndex = i;
                }
                return prev || focusedIndex > -1;
            },false);
            if(isFocused){
                if(dir == vm.Direction.UP){
                    if(focusedIndex == 0){
                        focusable[focusable.length-1].focus();
                    }else{
                        focusable[focusedIndex-1].focus();
                    }
                }else if(dir == vm.Direction.DOWN){
                    if(focusedIndex < (focusable.length-1)){
                        focusable[focusedIndex+1].focus();
                    }else{
                        focusable[0].focus();
                    }
                }
            }
            return isFocused;
        }

        // Sanitize events for IE.
        function sanitize(e) {
            e = e || window.event;
            if (!e.target) e.target = e.srcElement;
            if (!e.currentTarget) e.currentTarget = e.srcElement;
            if (!e.which && e.keyCode) e.which = e.keyCode;
            return e;
        }

        // Simple indexOf polyfill for IE8.
        function indexOf(list, val) {
            if (Array.prototype.indexOf) return list.indexOf(val);
            for (var i = 0, len = list.length; i < len; i++) if (list[i] === val) return i;
            return -1;
        }

        // Check whether node a contains node b.
        function contains(a, b) {
            return (a.contains) ? a.contains(b) : (a.compareDocumentPosition) ? a.compareDocumentPosition(b) & 16 : 0;
        }

        // Bind element event(s) to a callback.
        function bind(el, ev, callback, optUnbind) {
            if (typeof(ev) === 'string') ev = [ev];
            for (var i = 0, e; e = ev[i]; i++) {
                e = (e === 'click' && 'ontouchstart' in window) ? 'touchend' :
                    (el.attachEvent) ? 'on' + e : e;
                (el.attachEvent) ? (optUnbind ? el.detachEvent(e, callback) : el.attachEvent(e, callback)) :
                    (optUnbind ? el.removeEventListener(e, callback) : el.addEventListener(e, callback, {passive: false}));
            }
        }

        function getNumberFromKey(key) {
            return key % 48;
        }
    }

})(angular);