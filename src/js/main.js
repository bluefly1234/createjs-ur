const app = {
    // 工具函数
    utils: {
        // 获取url中的get参数
        getQueryString (name) {
            const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
            const url = window.location.search.replace(/&amp;(amp;)?/g, '&');
            const r = url.substr(1).match(reg);
            if (r !== null) {
                return unescape(r[2]);
            }
            return null;
        },

        // 是否在微信上打开
        isWeixin () {
            const ua = navigator.userAgent.toLowerCase();
            if (ua.match(/MicroMessenger/i) === 'micromessenger') {
                return true;
            } else {
                return false;
            }
        },

        // 获取随机整数
        getRandomInt (min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },

        // 图片预加载 config: {onProgress, onComplete, crossOrigin} 或者 config: callback
        loadImages (sources, config = {}) {
            const loadData = {
                sources: sources,
                images: sources instanceof Array ? [] : {},
                config: config,
                loadedImages: 0,
                totalImages: 0,
                countTotalImages () {
                    this.totalImages = 0;
                    for (let src in this.sources) {
                        this.totalImages += 1;
                    }
                    return this.totalImages;
                },
                load (src, crossOrigin) {
                    this.images[src] = new Image();
                    this.images[src].onload = () => {
                        this.loadedImages += 1;
                        let progress = Math.floor(this.loadedImages / this.totalImages * 100);

                        if (this.config.onProgress) {
                            this.config.onProgress(progress);
                        }
                        if (this.loadedImages >= this.totalImages) {
                            if (this.config.onComplete) {
                                this.config.onComplete(this.images);
                            }
                            if (this.config instanceof Function) {
                                this.config(this.images);
                            }
                        }
                    };

                    this.images[src].onerror = (e) => {
                        console.log('图片加载出错：' + src);
                    };

                    if (crossOrigin) {
                        this.images[src].crossOrigin = '*';
                    }
                    this.images[src].src = this.sources[src];
                }
            };

            loadData.countTotalImages();

            if (!loadData.totalImages) {
                if (loadData.config.onComplete) {
                    loadData.config.onComplete(loadData.images);
                }

                if(loadData.config instanceof Function) {
                    loadData.config(loadData.images);
                }
            } else {
                for (let src in loadData.sources) {
                    if (loadData.config.crossOrigin) {
                        loadData.load(src, true);
                    } else {
                        loadData.load(src);
                    }
                }
            }
        }
    },

    // 音乐
    musics: {
        // 背景音乐id (将自动播放)
        bg: '',

        // 其他音效ids
        others: [],

        // 音乐播放处理入口
        main () {
            if (!this.bg && !this.others.length) {
                return;
            }

            const bgMusic = document.getElementById(this.bg);
            let autoplay = true;

            $(bgMusic).parent().on('touchstart', (event) => {
                event.stopPropagation();
                autoplay = false;

                if ($(this).hasClass('animating')) {
                    $(this).removeClass('animating');
                    bgMusic.pause();
                } else {
                    $(this).addClass('animating');
                    bgMusic.play();
                }
            });

            $(document).one('touchstart', () => {
                if (bgMusic && bgMusic.paused && autoplay) {
                    bgMusic.play();
                    if (bgMusic.paused) {
                        $(document).one('touchend', () => {
                            bgMusic.play();
                        });
                    }
                }
                for (let i = 0; i < this.others.length; i++) {
                    let other = document.getElementById(this.others[i]);
                    other.play();
                    other.pause();
                }
            });
        }
    },

    // 交互事件
    events: {
        preventDefault () {
            document.addEventListener('touchmove', (event) => {
                event.preventDefault();
            }, {
                passive: false
            });
        },

        initMenus () {
            let _this = this;

            let touchMoved = false;
            let swiperSelectors = ['#viewKidsCloth', '#viewBoyClothFather','#viewBoyClothMother', '#viewGirlClothFather', '#viewGirlClothMother', '#viewFace'];

            for (let i = 0; i < swiperSelectors.length; i++) {
                let $wrapper = $(swiperSelectors[i]);
                let mySwiper = new Swiper (swiperSelectors[i], {
                    // followFinger: false,
                    on: {
                        touchMove: function () {
                            if (touchMoved) {
                                return;
                            }
                            touchMoved = true;
                            $wrapper.find('.arrow-prev').addClass('active');
                            $wrapper.find('.arrow-next').addClass('active');
                        },
                        touchEnd: function () {
                            touchMoved = false;
                            $wrapper.find('.arrow-prev').removeClass('active');
                            $wrapper.find('.arrow-next').removeClass('active');
                        }
                    },
                });

                $wrapper.find('.arrow-prev').on('click', () => {
                    mySwiper.slidePrev();
                });
                $wrapper.find('.arrow-next').on('click', () => {
                    mySwiper.slideNext();
                });
            }

            this.setTab();
            this.changeCloset('kids');
        },

        setTab () {
            this.$viewItem = $('.view-item');
            this.$tabItem = $('.tab-item');
            this.tabIndex = 0;
            this.$viewItem.eq(this.tabIndex).addClass('active').siblings().removeClass('active');

            let _this = this;
            this.$tabItem.on('click', function () {
                let index = $(this).index();
                _this.changeTab(index);
            });
        },

        changeTab(index) {

            if (index === this.tabIndex) {
                return;
            }

            this.tabIndex = index;
            this.$tabItem.eq(index).addClass('active').siblings().removeClass('active');
            this.$viewItem.eq(index).addClass('active').siblings().removeClass('active');
        },

        showText() {
            if (!this.game.text) {
                this.game.text = this.game.getThing('text');
                this.game.addThing({
                    id: 'text',
                    obj: this.game.text
                });
                this.game.text.fixClickArea();
                this.game.text.menuDelete.visible = false;
                this.game.text.menuZoom.visible = false;

                $('.btn-create').addClass('active');
            } else {
                this.game.text.select();
            }
            this.game.text.visible = true;
        },

        changeCloset(name) {
            if (!this.$closet) {
                this.$closet = $('.closet');
                this.closetName = '';
                $('.closet-arrow-father').on('click', () => {
                    $('.closet-arrow-father').removeClass('active');
                    $('.closet-arrow-mother').removeClass('active');
                    $('.closet-arrow-kids-left').addClass('active');
                    this.changeCloset('father');
                });
                $('.closet-arrow-mother').on('click', () => {
                    $('.closet-arrow-father').removeClass('active');
                    $('.closet-arrow-mother').removeClass('active');
                    $('.closet-arrow-kids-right').addClass('active');
                    this.changeCloset('mother');
                });
                $('.closet-arrow-kids-left').on('click', () => {
                    $('.closet-arrow-father').addClass('active');
                    $('.closet-arrow-mother').addClass('active');
                    $('.closet-arrow-kids-left').removeClass('active');
                    this.changeCloset('kids');
                });
                $('.closet-arrow-kids-right').on('click', () => {
                    $('.closet-arrow-father').addClass('active');
                    $('.closet-arrow-mother').addClass('active');
                    $('.closet-arrow-kids-right').removeClass('active');
                    this.changeCloset('kids');
                });
            } else {
                $('.closet-open').removeClass('active');
                setTimeout(() => {
                    $('.closet-open').addClass('active');
                    this.changeClothView();
                }, 1000);
            }

            if (name !== this.closetName) {
                this.$closet.removeClass(this.closetName).addClass(name);
                this.closetName = name;
            }
        },

        changeClosetArrow() {
            if (this.closetName === 'kids') {
                $('.closet-arrow-mother').addClass('active');
                $('.closet-arrow-father').addClass('active');
            } else if (this.closetName === 'mother') {
                $('.closet-arrow-kids-right').addClass('active');
            } else if (this.closetName === 'father') {
                $('.closet-arrow-kids-left').addClass('active');
            }
        },

        changeClothView() {
            if (!this.$clothViews) {
                this.$clothViews = $('#viewCloth > div');
            }
            if (!this.game || !this.game.curPerson) {
                // this.$clothViews.removeClass('active');
                this.$clothViews.eq(5).addClass('active').siblings().removeClass('active');
            } else if (this.closetName === 'kids') {
                this.$clothViews.eq(0).addClass('active').siblings().removeClass('active');
            } else {
                if (this.closetName === 'father') {
                    if (this.game.curPerson.sex === 0) {
                        this.$clothViews.eq(1).addClass('active').siblings().removeClass('active');
                    } else if (this.game.curPerson.sex === 1) {
                        this.$clothViews.eq(3).addClass('active').siblings().removeClass('active');
                    }
                } else if (this.closetName === 'mother') {
                    if (this.game.curPerson.sex === 0) {
                        this.$clothViews.eq(2).addClass('active').siblings().removeClass('active');
                    } else if (this.game.curPerson.sex === 1) {
                        this.$clothViews.eq(4).addClass('active').siblings().removeClass('active');
                    }
                }
            }
        },

        createGame () {
            this.game = new MyGame({
                canvas: 'game',
                width: $('.container').width(),
                height: $('.container').height()
            });

            let _this = this;
            this.game.preload({
                onProgress(e) {
                    console.log(e.progress);
                },
                onComplete(e) {
                    console.log(e);
                    _this.game.init();
                    _this.game.run();
                    let objects = $('.icon');
                    objects.on('click', function () {
                        let classId = $(this).attr('data-id');
                        let thingId = $(this).attr('data-oid');
                        if (!thingId) {
                            return;
                        }

                        _this.game.addThing({
                            classId,
                            thingId
                        });
                    });
                }
            });
            // this.game = new MyGame({
            //     canvas: 'game',
            //     width: $('.container').width(),
            //     height: $('.container').height()
            // });

            // let $loadFace = $('.loading-face');
            // let $loadBar = $('.loading-bar');
            // this.game.onLoadProgress = (e) => {
            //     console.log(e.progress);
            //     let progress = e.progress * 100 + '%';
            //     $loadFace.css({
            //         '-webkit-transform': 'translate3d(' + progress + ', 0, 0)'
            //     });
            //     $loadBar.css({
            //         '-webkit-transform': 'translate3d(' + progress + ', 0, 0)'
            //     });
            // }
            // this.game.onLoadComplete = () => {
            //     this.game.init(() => {
            //         let _this = this;

            //         this.game.addThing({
            //             id: 'scene',
            //             oid: 'scene01',
            //             props: {
            //                 alpha: 0.01
            //             }
            //         });
            //         let objects = $('.icon');
            //         objects.on('click', function () {
            //             let id = $(this).attr('data-id');
            //             let oid = $(this).attr('data-oid');
            //             if (!oid) {
            //                 return;
            //             }

            //             _this.game.addThing({
            //                 id,
            //                 oid
            //             });
            //         });

            //         this.game.onAddPerson = () => {
            //             setTimeout(() => {
            //                 this.changeTab(1);
            //             }, 200);
            //         };
            //         this.game.onSelectPerson = () => {

            //             this.changeClothView();
            //         };
            //         this.game.onDeletePerson = () => {
            //             this.changeClothView();
            //         };

            //         setTimeout(() => {
            //             $('.home-start').addClass('active');
            //             $('.loading').removeClass('active');

            //             $('.home-start').on('click', () => {
            //                 $('.home').removeClass('active');
            //                 $('.game').addClass('active');
            //                 this.game.run();
            //             })
            //         }, 1000);
            //         // this.game.run();
            //     });
            // }

            // $('.btn-create').on('click', () => {
            //     $('.btn-create').removeClass('active');
            //     $('.photo').addClass('active');
            //     this.game.createPhoto((src) => {
            //         $('#photo').attr('src', src);
            //     });
            // });

            this.initMenus();
            // this.game.preload();
        },

        main () {
            this.preventDefault();
            this.createGame();
        }
    },

    // app主入口
    main () {
        // 微信分享
        // app.api.weixin.ready(() => {
        //     if (app.musics.bg) {
        //         document.getElementById((app.musics.bg)).play();
        //     }

        //     app.api.weixin.setShare({
        //         // callback: '', // 分享成功回调
        //         // link: '', // 分享链接
        //         title: '', // 分享标题
        //         desc: '', // 分享描述
        //         imgUrl: '' // 分享图标
        //     });
        // });

        // 图片预加载入口
        // app.preload.main();
        // app.utils.loadImages(['images/bg.jpg'], () => {
        //     app.preload.sources = [

        //     ];
        //     app.preload.main();
        // });

        // 音乐处理入口
        app.musics.main();

        // 用户交互事件入口
        app.events.main();
    }
};



app.main();
