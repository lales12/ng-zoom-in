(function () {
    angular.module('ngZoomIn', []).directive(
        'ngZoomIn',
        [ '$timeout', '$app', '$filter', '$rootScope',
        function ($timeout, $app, $filter, $rootScope) {
            return {
                restrict: 'A',
                scope: {
                    cancel: '=',
                    accept: '=',
                    type: '@',
                    value: '@',
                    widgetModel: '@',
                    id: '@'
                },
                templateUrl: 'widget-template.html',
                link: function ($scope, $element, $attrs) {
                    var parent = $element.parent(),
                        startSign = false,
                        $canvas = null,
                        oldStrokeEnd = null,
                        oldAddPoint  = null,
                        oldClear     = null,
                        hide, resizeCanvas;
                 
                    $scope.model = {
                        fontSize: null,
                        inputValue: $scope.type == '6'? new Date(): null,
                        pad: null,
                        signatureSrc: null,
                        canvasClean: true,
                        showCalendar: false,
                        posints: []
                    }

                    $scope.fnBeforeCreatePad = function ($element) {
                        $canvas = $element;
                        resizeCanvas();
                    }

                    $scope.fnCancel = function (event) {
                        event.stopPropagation();
                        if ($scope.widgetModel) {
                            $scope.model.inputValue = $scope.widgetModel;
                            $element.addClass('success');
                        } else if ($scope.type !== '6') {
                            $scope.model.inputValue = null;
                        }                 
                        hide();
                    }


                    $scope.fnAccept = function (event) {
                        event.stopPropagation();
                        $element.addClass('success');
                        $scope.widgetModel = $scope.model.inputValue;

                        if ($scope.type === "5") {
                            $scope.model.signatureSrc = $scope.model.pad.toDataURL();
                            $scope.widgetModel = {
                                imageSrc: $scope.model.signatureSrc,
                                points: $scope.model.points
                            }
                        }  

                        $rootScope.$broadcast('saveWidget', [$scope.id, $scope.widgetModel]);
                        hide(); 
                    }

                    $scope.fnClear = function () {
                        registerEvent('Clear');
                        $scope.model.pad.clear();

                        $canvas.css({
                            'background-position': (width/2 - 59) + 'px ' + (height/2 - 51) + 'px',
                            'background-image': 'url("/bundles/signaturitweb/img/assets/watermark.png")',
                            'background-repeat': 'no-repeat'
                        });

                    }

                    hide = function () {
                        $element.removeClass('active');
                        $scope.active = false;
                        $scope.model.showCalendar = false;
                        parent.css('z-index', 0); 
                    }

                    resizeCanvas = function () {
                        width   = $(window).width()*0.9;
                        height  = $(window).height()*0.7;

                        $canvas.css({
                            'background-position': (width/2 - 59) + 'px ' + (height/2 - 51) + 'px',
                            'background-image': 'url("/bundles/signaturitweb/img/assets/watermark.png")',
                            'width': width,
                            'height': height
                        });

                        $canvas.prop('width', width);
                        $canvas.prop('height', height);
                    }

                    registerEvent  = function (text) {
                        source = $app.document.sign.source;
                        source = source[0].toUpperCase() + source.slice(1);

                        label = source === 'Demo'? source: 'App';

                        ga('send', 'event', label, text, $app.document.signer_email);
                    }

                    //overwrite Signature pad functions
                    if ($scope.type === '5') {
                        oldStrokeEnd = SignaturePad.prototype._strokeEnd;
                        oldAddPoint  = SignaturePad.prototype._addPoint;
                        oldClear     = SignaturePad.prototype.clear;

                        SignaturePad.prototype._strokeEnd = function (event) {
                            oldStrokeEnd.call(this, event)

                            $scope.model.points.push('/');
                        }

                        SignaturePad.prototype._addPoint = function (point) {
                            if (!startSign) {
                                startSign = true;
                                registerEvent('draw_sign');
                            }

                            if ($scope.model.canvasClean) {
                                $scope.model.canvasClean = false;
                                $canvas.css('background', '');
                            }

                            oldAddPoint.call(this, point);

                            $scope.model.points.push({x: point.x, y: point.y, t: point.time});
                        }

                        SignaturePad.prototype.clear = function () {
                            $scope.model.points = [];

                            oldClear.call(this);
                            $scope.model.canvasClean = true;
                        }
                    }

                    // attach events to the widgets
                    $timeout (function () {
                        $element.css('font-size', $element.width()*0.1);

                        $element.click(function (event) {
                            if (!$element.hasClass('active')) {
                                //Preventdefaul if is checkbox
                                if ($scope.type === '3') {
                                    event.preventDefault();
                                    $timeout( function () {
                                        $scope.model.inputValue = null;
                                    })
                                }
                                parent.css('z-index',1004); 
                                $element.removeClass('success');
                                $element.addClass('active');
                                $timeout(function () {
                                    $scope.active = true;
                                })
                            }
                        })

                        $(window).on('resize', function () {
                            if ($scope.type == 5 && $scope.active === true) {
                                $scope.fnClear();
                                resizeCanvas()
                            } else if ($scope.type == 1 || $scope.type == 6) {
                                $element.css('font-size', $element.width()*0.1);
                            }
                        })
                        
                    })
                }
            }
        }]
    )

})()
