class Thing extends createjs.Container {
    constructor(options = {}) {
        super();
        this.init(options);
    }

    // options: thingId(物品id)，classId(分类id，每个thing只能有一个，不传则自动分配__classId_?)，props(物品属性)，child(孩子)，children(孩子们)
    init(options) {
        this.things = {};
        this.selected = false;
        this._countId = 0;

        if (options.thingId) {
            this.thingId = options.thingId;
        }

        if (options.classId) {
            this.classId = options.classId;
        }

        if (options.props) {
            for (let param in options.props) {
                this[param] = options.props[param];
            }
        }

        let child = options.child;
        if (child) {
            this.addThing({
                thingId: child.thingId,
                classId: child.classId,
                object: child.object,
                props: child.props
            });
        }

        let children = options.children;
        if (children && children.length) {
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                this.addThing({
                    thingId: child.thingId,
                    classId: child.classId,
                    object: child.object,
                    props: child.props
                });
            }
        }
    }

    // 通过分类id获取物品
    getThing(classId) {
        return this.things[classId];
    }

    // 添加物品
    addThing({thingId, classId, object, props}) {
        if (thingId) {
            object.thingId = thingId;
        }

        let cid = classId;
        if (!cid) {
            this._countId++;
            cid = '__classId_' + this._countId;
        }

        object.classId = cid;

        if (props) {
            for (let param in props) {
                object[param] = props[param];
            }
        }

        if (this.things[cid]) {
            let childIndex = this.getChildIndex(this.things[cid]);
            this.addChildAt(object, childIndex);
            this.removeThing(cid);
        } else {
            this.addChild(object);
        }
        this.things[cid] = object;

        if (this.selected && this.menus) {
            this.menus.refresh();
        }
    }

    // 判断某物品是非已加
    checkThing({thingId, classId}) {
        if (!thingId) {
            return false;
        }
        if (classId) {
            let thing = this.getThing(classId);
            if (thing && thing.thingId === thingId) {
                return true;
            } else {
                return false;
            }
        } else {
            for (let classId in this.things) {
                if (this.things[classId].thingId === thingId) {
                    return true;
                }
            }

            return false;
        }
    }

    // 移除某物品
    removeThing(classId) {
        let thing = this.things[classId];

        if (thing.remove) {
            thing.remove();
        } else {
            this.removeChild(thing);
            delete this.things[classId];
        }
    }

    // 移除自身
    remove() {
        let parent = this.parent;
        let things = parent.things;
        if (things) {
            for (let classId in things) {
                if (this === things[classId]) {
                    delete things[classId];
                }
            }
        }
        parent.removeChild(this);

        if (parent.selected && parent.menus) {
            parent.menus.refresh();
        }

        if (this.onRemove) {
            this.onRemove();
        }
    }

    // 设置拖动触发事件，object为指定触发拖动的物品、无则为自身
    setDrag({object, onDrag} = {}) {
        let target = object || this;
        target.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.select();
            this._touch = {
                x: e.stageX,
                y: e.stageY
            };

            let curZoom = this.getRelativeZoom();
            target.addEventListener('pressmove', this._pressmoveHandler = (e) => {
                this.x += (e.stageX - this._touch.x) / curZoom;
                this.y += (e.stageY - this._touch.y) / curZoom;
                this._touch.x = e.stageX;
                this._touch.y = e.stageY;
                if (onDrag) {
                    onDrag();
                }
                if (this.onDrag) {
                    this.onDrag();
                }
            });

            target.addEventListener('pressup', this._pressupHnadler = (e) => {
                target.removeEventListener('pressmove', this._pressmoveHandler);
                target.removeEventListener('pressup', this._pressupHnadler);
            });
        });
    }

    // 设置删除触发事件，object为指定触发删除的物品、无则为自身
    setDelete({object, onDelete} = {}) {
        let target = object || this;
        target.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.remove();
            if (onDelete) {
                onDelete();
            }
            if (this.onDelete) {
                this.onDelete();
            }
        });
    }

    // 设置缩放触发事件，object为指定触发缩放的物品、无则为自身
    setZoom({object, onZoom, min, max} = {}) {
        let target = object || this;
        let minZoom = min || 0.5;
        let maxZoom = max;
        target.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.regY = this.getBounds().height;
            this.y += this.getTransformedBounds().height;
            this._touch = {
                x: e.stageX,
                y: e.stageY,
                scale: this.scaleX
            };

            let curZoom = this.getRelativeZoom();

            target.addEventListener('pressmove', this._pressmoveHandler = (e) => {
                let x = (e.stageX - this._touch.x) / curZoom;
                let y = (e.stageY - this._touch.y) / curZoom;

                let scale = (this.getBounds().height * this._touch.scale - y) / this.getBounds().height;

                this._touch.x = e.stageX;
                this._touch.y = e.stageY;

                if (scale < minZoom) {
                    scale = minZoom;
                } else if (maxZoom && scale > maxZoom) {
                    scale = maxZoom;
                }
                this.scaleX = this.scaleY = scale;
                this._touch.scale = scale;

                if (onZoom) {
                    onZoom();
                }

                if (this.onZoom) {
                    this.onZoom();
                }
            });

            target.addEventListener('pressup', this._pressupHnadler = (e) => {
                this.y -= this.getTransformedBounds().height;
                this.regY = 0;
                target.removeEventListener('pressmove', this._pressmoveHandler);
                target.removeEventListener('pressup', this._pressupHnadler);
            });
        });
    }

    // 设置菜单ui及事件，drag/delete/zoom;
    setMenus(options = {}) {
        let zoom = options.zoom;
        if (zoom && zoom.object) {
            zoom = zoom.object;
        }
        this.menus = new Menus({
            target: this,
            drag: options.drag,
            delete: options.delete,
            zoom: zoom
        });

        let _this = this;
        if (options.drag) {
            this.setDrag({
                onDrag () {
                    if (_this.selected) {
                        _this.menus.refresh();
                    }
                }
            });
        }

        if (options.delete) {
            this.setDelete({
                object: options.delete,
                onDelete() {
                    _this.menus.parent.removeChild(_this.menus);
                    _this.menus = null;
                }
            });
        }

        if (options.zoom) {
            let params = {};
            if (options.zoom.object) {
                params.object = options.zoom.object;
                params.min = options.zoom.min;
                params.max = options.zoom.max;
            } else {
                params.object = options.zoom;
            }
            this.setZoom({
                object: params.object,
                min: params.min,
                max: params.max,
                onZoom() {
                    if (_this.selected) {
                        _this.menus.refresh();
                    }
                }
            });
        }

        this.parent.addChild(this.menus);

        this.menus.visible = false;
    }

    // 遍历父级，获取相对stage的缩放大小
    getRelativeZoom(obj) {
        let object = obj || this;
        let parent = object.parent;
        let curZoom = 1;
        while (parent) {
            curZoom = curZoom * parent.scaleX;
            parent = parent.parent;
        }
        return curZoom;
    }

    // 在物品底层填充alpha为0.01的shape，用以解决点击事件中点击透明处不触发的问题
    fixClickArea(obj) {
        let object = obj || this;
        let bounds = object.getBounds();
        let shape = new createjs.Shape();
        shape.graphics.beginFill("#fff").drawRect(0, 0, bounds.width, bounds.height);
        shape.alpha = 0.01;
        object.addChildAt(shape, 0);
    }

    // 设置遮罩，裁剪溢出
    createMask(area) {
        let maskArea = area;
        if (maskArea.getBounds) {
            maskArea.width = maskArea.getBounds().width;
            maskArea.height = maskArea.getBounds().height;
        }
        let rect = new createjs.Shape();
        rect.graphics.rect(maskArea.x, maskArea.y, maskArea.width, maskArea.height).closePath();
        this.mask = rect;
    }

    // 选中状态
    select() {
        if (this.selected) {
            return;
        }

        this.parent.setChildIndex(this, this.parent.children.length - 1);
        if (this.menus) {
            this.parent.setChildIndex(this.menus, this.parent.children.length - 1);
            this.menus.refresh();
            this.menus.visible = true;
        }

        this.selected = true;
        if (this.onSelect) {
            this.onSelect();
        }
    }

    // 取消选中状态
    unSelect() {
        this.selected = false;
        if (this.menus) {
            this.menus.visible = false;
        }
    }
}

// 菜单ui类，与target同级
class Menus extends createjs.Container {
    constructor(options = {}) {
        super();
        this.init(options);
    }

    init(options) {
        this.target = options.target;
        let transformedBounds = this.target.getTransformedBounds();
        if (options.drag) {
            this.border = new createjs.Shape();
            this.addChild(this.border);
        }
        if (options.delete) {
            this.delete = options.delete;
            this.addChild(this.delete);
        }
        if (options.zoom) {
            this.zoom = options.zoom;
            this.addChild(this.zoom);
        }
        this.refresh();
    }

    // 遍历父级，获取相对stage的缩放大小
    getRelativeZoom(obj) {
        let object = obj || this;
        let parent = object.parent;
        let curZoom = 1;
        while (parent) {
            curZoom = curZoom * parent.scaleX;
            parent = parent.parent;
        }
        return curZoom;
    }

    // 更新菜单位置
    refresh() {
        let transformedBounds = this.target.getTransformedBounds();
        if (this.border) {
            this.border.graphics.clear();
            this.border.graphics.setStrokeStyle(2, 0, 0, 10, true).beginStroke("#fff").drawRect(0, 0, transformedBounds.width, transformedBounds.height);
        }

        this.x = transformedBounds.x;
        this.y = transformedBounds.y;

        let curZoom = 1;
        if (this.zoom || this.delete) {
            curZoom = this.getRelativeZoom();
        }
        if (this.zoom) {
            this.zoom.scaleX = this.zoom.scaleY = 1 / curZoom;
            this.zoom.x = transformedBounds.width - this.zoom.getTransformedBounds().width / 2;
            this.zoom.y = -this.zoom.getTransformedBounds().height / 2;
        }

        if (this.delete) {
            this.delete.scaleX = this.delete.scaleY = 1 / curZoom;
            this.delete.x = -this.delete.getTransformedBounds().width / 2;
            this.delete.y = transformedBounds.height - this.delete.getTransformedBounds().height / 2;
        }
    }
}

class Game {
    constructor({ canvas, width = window.innerWidth, height = window.innerHeight }) {
        this.width = width;
        this.height = height;

        this.stage = new createjs.Stage(canvas);
        this.stage.canvas.width = this.width;
        this.stage.canvas.height = this.height;

        createjs.Touch.enable(this.stage);
        createjs.Ticker.timingMode = createjs.Ticker.RAF;
        createjs.Ticker.setFPS(60);

        this._paused = true;
        this._loader;
    }
    preload({ manifest, onProgress, onComplete } = {}) {
        let images = manifest || this.manifest;
        let onLoadProgress = onProgress || this.onLoadProgress;
        let onLoadComplete = onComplete || this.onLoadComplete;
        this._loader = new createjs.LoadQueue(false);
        this._loader.addEventListener('error', (e) => {
            console.log(e);
        });
        if (onLoadProgress) {
            this._loader.addEventListener('progress', (e) => {
                onLoadProgress(e);
            });
        }
        if (onLoadComplete) {
            this._loader.addEventListener('complete', (e) => {
                onLoadComplete(e);
            });
        }

        this._loader.loadManifest(images);
    }

    // 获取图片资源
    getResource(id) {
        return this._loader.getResult(id);
    }

    // 直接获取bitmap
    getBitmap(id) {
        return new createjs.Bitmap(this.getResource(id));
    }

    render() {
        this.stage.update();
    }

    run() {
        this._paused = false;
        createjs.Ticker.addEventListener('tick', this._ticking = () => {
            if (!this._paused) {
                this.render();
            }
        });
    }

    pause() {
        this._paused = true;
    }

    resume() {
        this._paused = false;
    }

    stop() {
        this._paused = true;
        createjs.Ticker.removeEventListener('tick', this._ticking);
    }

    showFPS() {
        this._fpsText = new createjs.Text('', 'Bold 20px Arial', '#f00');
        this._fpsText.y = 24;
        this.stage.addChild(this._fpsText);
        this._fpsText.addEventListener('tick', () => {
            this._fpsText.text = Math.round(createjs.Ticker.getMeasuredFPS()) + 'fps';
        });
    }
};

class MyGame extends Game {
    constructor(options) {
        super(options);

        // 预加载列表
        this.manifest = [
            {
                id: 'girlHead',
                src: 'images/girl_head.png'
            }, {
                id: 'boyHead',
                src: 'images/boy_head.png'
            }, {
                id: 'close',
                src: 'images/icon_close.png'
            }, {
                id: 'zoom',
                src: 'images/icon_zoom.png'
            }, {
                id: 'girlCloth',
                src: 'images/girl_cloth.png'
            }, {
                id: 'boyCloth',
                src: 'images/boy_cloth.png'
            }, {
                id: 'kidsCloth01',
                src: 'images/kids_cloth_01.png'
            }, {
                id: 'kidsCloth02',
                src: 'images/kids_cloth_02.png'
            }, {
                id: 'kidsCloth03',
                src: 'images/kids_cloth_03.png'
            }, {
                id: 'kidsCloth04',
                src: 'images/kids_cloth_04.png'
            }, {
                id: 'kidsOthers01',
                src: 'images/kids_others_01.png'
            }, {
                id: 'kidsOthers02',
                src: 'images/kids_others_02.png'
            }, {
                id: 'kidsOthers03',
                src: 'images/kids_others_03.png'
            },
            {
                id: 'kidsOthers04',
                src: 'images/kids_others_04.png'
            },
            {
                id: 'kidsOthers05',
                src: 'images/kids_others_05.png'
            },
            {
                id: 'kidsOthers06',
                src: 'images/kids_others_06.png'
            },
            {
                id: 'kidsOthers07',
                src: 'images/kids_others_07.png'
            },
            {
                id: 'kidsOthers08',
                src: 'images/kids_others_08.png'
            },
            {
                id: 'boyClothFather01',
                src: 'images/boy_cloth_father_01.png'
            },
            {
                id: 'boyClothFather02',
                src: 'images/boy_cloth_father_02.png'
            },
            {
                id: 'boyClothFather03',
                src: 'images/boy_cloth_father_03.png'
            },

            {
                id: 'boyOthersFather01',
                src: 'images/boy_others_father_01.png'
            },
            {
                id: 'boyOthersFather02',
                src: 'images/boy_others_father_02.png'
            },
            {
                id: 'boyOthersFather03',
                src: 'images/boy_others_father_03.png'
            },
            {
                id: 'boyOthersFatherHand',
                src: 'images/boy_others_father_hand.png'
            },

            {
                id: 'boyClothMother01',
                src: 'images/boy_cloth_mother_01.png'
            },
            {
                id: 'boyClothMother02',
                src: 'images/boy_cloth_mother_02.png'
            },
            {
                id: 'boyClothMother03',
                src: 'images/boy_cloth_mother_03.png'
            },

            {
                id: 'boyOthersMother01',
                src: 'images/boy_others_mother_01.png'
            },
            {
                id: 'boyOthersMother02',
                src: 'images/boy_others_mother_02.png'
            },
            {
                id: 'boyOthersMother03',
                src: 'images/boy_others_mother_03.png'
            },

            {
                id: 'girlClothFather01',
                src: 'images/girl_cloth_father_01.png'
            },
            {
                id: 'girlClothFather02',
                src: 'images/girl_cloth_father_02.png'
            },
            {
                id: 'girlClothFather03',
                src: 'images/girl_cloth_father_03.png'
            },

            {
                id: 'girlClothMother01',
                src: 'images/girl_cloth_mother_01.png'
            },
            {
                id: 'girlClothMother02',
                src: 'images/girl_cloth_mother_02.png'
            },
            {
                id: 'girlClothMother03',
                src: 'images/girl_cloth_mother_03.png'
            },
            {
                id: 'scene01',
                src: 'images/scene_01.jpg'
            },
            {
                id: 'scene02',
                src: 'images/scene_02.jpg'
            },
            {
                id: 'scene03',
                src: 'images/scene_03.jpg'
            },
            {
                id: 'text',
                src: 'images/text.png'
            },
            {
                id: 'textLine',
                src: 'images/text_line.png'
            },
            {
                id: 'face01',
                src: 'images/face_01.png'
            },
            {
                id: 'face02',
                src: 'images/face_02.png'
            },
            {
                id: 'face03',
                src: 'images/face_03.png'
            },
            {
                id: 'face04',
                src: 'images/face_04.png'
            },
            {
                id: 'face05',
                src: 'images/face_05.png'
            },
            {
                id: 'face06',
                src: 'images/face_06.png'
            },
            {
                id: 'face07',
                src: 'images/face_07.png'
            },
            {
                id: 'face08',
                src: 'images/face_08.png'
            },
            {
                id: 'face09',
                src: 'images/face_09.png'
            },
            {
                id: 'face10',
                src: 'images/face_10.png'
            },
            {
                id: 'face11',
                src: 'images/face_11.png'
            },
            {
                id: 'face12',
                src: 'images/face_12.png'
            },
            {
                id: 'face13',
                src: 'images/face_13.png'
            },
            {
                id: 'face14',
                src: 'images/face_14.png'
            },
            {
                id: 'face15',
                src: 'images/face_15.png'
            },
            {
                id: 'face16',
                src: 'images/face_16.png'
            },
            {
                id: 'face17',
                src: 'images/face_17.png'
            },
            {
                id: 'face18',
                src: 'images/face_18.png'
            },
            {
                id: 'face19',
                src: 'images/face_19.png'
            },
            {
                id: 'face20',
                src: 'images/face_20.png'
            },
            {
                id: 'photoBar',
                src: 'images/photo_bar.png'
            },
        ];
    }

    init(options) {
        // 视图框
        this.views = new Thing();
        this.stage.addChild(this.views);

        // 当前选中人物
        this.person = null;

        // 已有人物列表
        this.persons = [];

        // 当前选中物品
        this.selectedThing = null;

        // 相关物品信息列表，menus(false/true/{drag, delete, zoom: true/{min, max}})
        this.thingsData = {
            girlHead: {
                image: 'girlHead', // 图片id
                parent: 'person', // 父级id，即this[parent]
                props: {
                    x: 34,
                    y: 34
                }
            },
            boyHead: {
                image: 'boyHead',
                parent: 'person',
                props: {
                    x: 30,
                    y: 20
                }
            },
            girlCloth: {
                image: 'girlCloth',
                parent: 'person',
                props: {
                    x: 32,
                    y: 193
                }
            },
            boyCloth: {
                image: 'boyCloth',
                parent: 'person',
                props: {
                    x: 32,
                    y: 193
                }
            },
            kidsCloth01: {
                image: 'kidsCloth01',
                parent: 'person',
                props: {
                    x: -44,
                    y: 177
                }
            },
            kidsCloth02: {
                image: 'kidsCloth02',
                parent: 'person',
                props: {
                    x: -15,
                    y: 136
                }
            },
            kidsCloth03: {
                image: 'kidsCloth03',
                parent: 'person',
                props: {
                    x: 14,
                    y: 143
                }
            },
            kidsCloth04: {
                image: 'kidsCloth04',
                parent: 'person',
                props: {
                    x: -18,
                    y: 182
                }
            },

            kidsOthers01: {
                image: 'kidsOthers01',
                parent: 'person',
                props: {
                    x: 36,
                    y: -15
                },
                menus: false
            },
            kidsOthers02: {
                image: 'kidsOthers02',
                parent: 'person',
                props: {
                    x: 61,
                    y: 111
                },
                menus: false
            },
            kidsOthers03: {
                image: 'kidsOthers03',
                parent: 'person',
                props: {
                    x: 59,
                    // y: 121
                    y: 123
                },
                menus: false
            },
            kidsOthers04: {
                image: 'kidsOthers04',
                parent: 'person',
                props: {
                    x: 4,
                    y: 247
                },
                menus: false
            },
            kidsOthers05: {
                image: 'kidsOthers05',
                parent: 'person',
                props: {
                    x: 42,
                    y: -45
                },
                menus: false
            },
            kidsOthers06: {
                image: 'kidsOthers06',
                parent: 'person',
                props: {
                    x: 206,
                    y: 371
                },
                menus: false
            },
            kidsOthers07: {
                image: 'kidsOthers07',
                parent: 'person',
                props: {
                    x: 48,
                    y: -8
                },
                menus: false
            },
            kidsOthers08: {
                image: 'kidsOthers08',
                parent: 'person',
                props: {
                    x: 98,
                    y: 198
                },
                menus: false
            },

            boyClothFather01: {
                image: 'boyClothFather01',
                parent: 'person',
                props: {
                    x: 39,
                    y: 175
                },
                related: [{
                    id: 'hand',
                    object: 'othersFatherHand'
                }]
            },
            boyClothFather02: {
                image: 'boyClothFather02',
                parent: 'person',
                props: {
                    x: 35,
                    y: 192
                }
            },
            boyClothFather03: {
                image: 'boyClothFather03',
                parent: 'person',
                props: {
                    x: 11,
                    y: 177
                }
            },

            othersFather01: {
                image: 'boyOthersFather01',
                parent: 'person',
                props: {
                    x: 60,
                    y: 116
                },
                menus: false
            },
            othersFather02: {
                image: 'boyOthersFather02',
                parent: 'person',
                props: {
                    x: 5,
                    y: -17
                },
                menus: false
            },
            othersFather03: {
                image: 'boyOthersFather03',
                parent: 'person',
                props: {
                    x: 88,
                    y: 205
                },
                menus: false
            },
            othersFatherHand: {
                image: 'boyOthersFatherHand',
                parent: 'person',
                props: {
                    x: 107,
                    y: 175
                }
            },
            boyClothMother01: {
                image: 'boyClothMother01',
                parent: 'person',
                props: {
                    x: -59,
                    y: 179
                }
            },
            boyClothMother02: {
                image: 'boyClothMother02',
                parent: 'person',
                props: {
                    x: 25,
                    y: 191
                }
            },
            boyClothMother03: {
                image: 'boyClothMother03',
                parent: 'person',
                props: {
                    x: 20,
                    y: 184
                }
            },

            othersMother01: {
                image: 'boyOthersMother01',
                parent: 'person',
                props: {
                    x: 93,
                    y: 202
                },
                menus: false
            },
            othersMother02: {
                image: 'boyOthersMother02',
                parent: 'person',
                props: {
                    x: 18,
                    y: -19
                },
                menus: false
            },
            othersMother03: {
                image: 'boyOthersMother03',
                parent: 'person',
                props: {
                    x: 63,
                    y: 107
                },
                menus: false
            },
            girlClothFather01: {
                image: 'girlClothFather01',
                parent: 'person',
                props: {
                    x: 27,
                    y: 134
                }
            },
            girlClothFather02: {
                image: 'girlClothFather02',
                parent: 'person',
                props: {
                    x: 35,
                    y: 190
                }
            },
            girlClothFather03: {
                image: 'girlClothFather03',
                parent: 'person',
                props: {
                    x: -48,
                    y: 111
                }
            },
            girlClothMother01: {
                image: 'girlClothMother01',
                parent: 'person',
                props: {
                    x: -47,
                    y: 187
                }
            },
            girlClothMother02: {
                image: 'girlClothMother02',
                parent: 'person',
                props: {
                    x: 3,
                    y: 189
                }
            },
            girlClothMother03: {
                image: 'girlClothMother03',
                parent: 'person',
                props: {
                    x: -28,
                    y: 191
                }
            },

            boy: {
                props: {
                    sex: 0
                },
                type: 'Person',
                children: [
                    {
                        id: 'boyBody',
                        class: 'cloth',
                        object: 'boyCloth'
                    }, {
                        id: 'boyHead',
                        class: 'head',
                        object: 'boyHead'
                    }
                ],
                menus: true
            },
            girl: {
                props: {
                    sex: 1
                },
                type: 'Person',
                children: [
                    {
                        id: 'girlBody',
                        class: 'cloth',
                        object: 'girlCloth',
                    }, {
                        id: 'girlHead',
                        class: 'head',
                        object: 'girlHead'
                    }
                ],
                menus: {
                    drag: true,
                    delete: true,
                    zoom: true
                }
            },
            scene01: {
                id: 'scene',
                image: 'scene01'
            },
            scene02: {
                id: 'scene',
                image: 'scene02'
            },
            scene03: {
                id: 'scene',
                image: 'scene03'
            },
            textLine: {
                id: 'textLine',
                image: 'textLine',
                props: {
                    x: 253,
                    y: 139
                }
            },
            text: {
                id: 'text',
                image: 'text',
                children: [{
                    id: 'textLine',
                    object: 'textLine'
                }],
                props: {
                    x: 88,
                    y: this.height - 480
                },
                menus: {
                    drag: true
                }
            },
            face01: {
                image: 'face01',
                parent: 'text'
            },
            face02: {
                image: 'face02',
                parent: 'text'
            },
            face03: {
                image: 'face03',
                parent: 'text'
            },
            face04: {
                image: 'face04',
                parent: 'text'
            },
            face05: {
                image: 'face05',
                parent: 'text'
            },
            face06: {
                image: 'face06',
                parent: 'text'
            },
            face07: {
                image: 'face07',
                parent: 'text'
            },
            face08: {
                image: 'face08',
                parent: 'text'
            },
            face09: {
                image: 'face09',
                parent: 'text'
            },
            face10: {
                image: 'face10',
                parent: 'text'
            },
            face11: {
                image: 'face11',
                parent: 'text'
            },
            face12: {
                image: 'face12',
                parent: 'text'
            },
            face13: {
                image: 'face13',
                parent: 'text'
            },
            face14: {
                image: 'face14',
                parent: 'text'
            },
            face15: {
                image: 'face15',
                parent: 'text'
            },
            face16: {
                image: 'face16',
                parent: 'text'
            },
            face17: {
                image: 'face17',
                parent: 'text'
            },
            face18: {
                image: 'face18',
                parent: 'text'
            },
            face19: {
                image: 'face19',
                parent: 'text'
            },
            face20: {
                image: 'face20',
                parent: 'text'
            },
            photoBar: {
                image: 'photoBar',
                parent: 'stage',
                props: {
                    x: 0,
                    y: this.height,
                }
            }
        };

        // 添加背景图
        this.addThing({
            thingId: 'scene01',
            classId: 'scene'
        });

        // 添加文字
        this.text = this.getThing('text');
        this.addThing({
            object: this.text
        });
    }

    // 添加物品
    addThing({thingId, classId, object, props}) {
        let thing = object || this.getThing(thingId);

        let parentId = thing.parentId || 'views';
        if (!this[parentId]) {
            alert('不存在：' + parentId);
            return;
        }

        if (classId && this[parentId].checkThing({ thingId, classId })) {
            let oldThing = this[parentId].getThing(classId || thing.classId);
            oldThing.remove();
            if (this.onCancelThing) {
                this.onCancelThing(oldThing);
            }
            // alert('已存在');
            return;
        }
        this[parentId].addThing({
            thingId,
            classId,
            object: thing,
            props
        });

        if (this.onAddThing) {
            this.onAddThing(thing);
        }

        if (thing.menusOptions) {
            let options = {}
            if (thing.menusOptions === true) {
                thing.menusOptions = {
                    drag: true,
                    delete: true,
                    zoom: true
                }
            }
            options.drag = thing.menusOptions.drag;
            if (thing.menusOptions.delete) {
                options.delete = this.getBitmap('close');
            }
            if (thing.menusOptions.zoom) {
                options.zoom = {};
                options.zoom.object = this.getBitmap('zoom');
                options.zoom.min = thing.menusOptions.zoom.min;
                options.zoom.max = thing.menusOptions.zoom.max;
            }
            thing.setMenus({
                drag: thing.menusOptions.drag,
                delete: options.delete,
                zoom: options.zoom
            });

            thing.onSelect = () => {
                if (this.onSelectThing) {
                    this.onSelectThing(thing);
                }
            }
            thing.select();
        }

        thing.onRemove = () => {
            if (this.onRemoveThing) {
                this.onRemoveThing(thing);
            }
        }
    }

    // 通过thingsData中的id创建并返回物品
    getThing(id) {
        let data = this.thingsData[id];
        let thing = null;
        let options = {};
        if (data.props) {
            options.props = data.props;
        }

        if (data.children && data.children.length) {
            options.children = [];
            for (let param in data.children) {
                let child = data.children[param];
                options.children.push({
                    thingId: child.id,
                    classId: child.class,
                    object: this.getThing(child.object || child.id),
                    props: child.props
                });
            }
        }

        if (data.image) {
            options.child = {
                object: this.getBitmap(data.image)
            };
        }
        thing = new Thing(options);

        if (data.parent) {
            thing.parentId = data.parent;
        }

        if (data.related) {
            thing.related = data.related;
        }

        if (data.menus) {
            thing.menusOptions = data.menus;
        }

        return thing;
    }

    // 添加物品回调
    onAddThing(thing) {
        console.log(this.views.things);
    }

    // 选中物品回调
    onSelectThing(thing) {
        if (this.selectedThing) {
            this.selectedThing.unSelect();
            this.selectedThing = null;
        }

        if (thing) {
            this.selectedThing = thing;

            if (thing.thingId === 'boy' || thing.thingId === 'girl') {
                this.person = thing;
            }
        }
    }

    // 物品移除回调
    onRemoveThing(thing) {
        if (thing === this.person) {
            delete this.person;
            this.person = null;
        }
    }

    // 物品取消回调，取消指再增加一个已存在的物品时为移除物品
    onCancelThing(thing) {
        if (thing.classId === 'cloth') {
            let cloth = null;
            if (this.person.sex === 0) {
                cloth = this.getThing('boyCloth');
            } else {
                cloth = this.getThing('girlCloth');
            }
            this.person.addThing({
                classId: 'cloth',
                object: cloth
            });
            this.person.setChildIndex(cloth, 0);
            console.log(this.person.things);
        }
    }
}

// let game = new MyGame({
//     canvas: 'game'
// });

// game.preload({
//     onProgress(e) {
//         console.log(e.progress);
//     },
//     onComplete(e) {
//         console.log(e);
//         game.init();
//         game.run();
//     }
// });
