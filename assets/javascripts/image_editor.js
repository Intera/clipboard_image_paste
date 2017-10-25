// this file implements image editing functionality for the clipboard_paste overlay and replaces jcrop for cropping

var fabricHelper = {
	// only depends on fabric.js

	keepObjectsInsideCanvas: function (canvas) {
		canvas.on("object:moving", function (e) {
			var top_margin = 0;
			var bottom_margin = 0;
			var left_margin = 0;
			var right_margin = 0;
			var obj = e.target
			var canvas = obj.canvas
			var top = obj.top
			var left = obj.left
			var zoom = canvas.getZoom()
			var pan_x = canvas.viewportTransform[4]
			var pan_y = canvas.viewportTransform[5]

			// width & height we are constraining to must be calculated by applying the inverse of the current viewportTransform
			var c_width = canvas.width / zoom
			var c_height = canvas.height / zoom

			var w = obj.width
			var left_adjust, right_adjust
			if (obj.originX == "center") {
				left_adjust = right_adjust = w / 2
			} else {
				left_adjust = 0
				right_adjust = w
			}

			var h = obj.height;
			var top_adjust, bottom_adjust;
			if (obj.originY == "center") {
				top_adjust = bottom_adjust = h / 2;
			} else {
				top_adjust = 0;
				bottom_adjust = h;
			}

			var top_bound = top_margin + top_adjust - pan_y;
			var bottom_bound = c_height - bottom_adjust - bottom_margin - pan_y;
			var left_bound = left_margin + left_adjust - pan_x;
			var right_bound = c_width - right_adjust - right_margin - pan_x;
			if (w > c_width) {
				obj.left = left_bound;
			} else {
				obj.left = Math.min(Math.max(left, left_bound), right_bound);
			}

			if (h > c_height) {
				obj.top = top_bound;
			} else {
				obj.top = Math.min(Math.max(top, top_bound), bottom_bound);
			}
		})
	},

	keepStrokeWidthWhenScaling: function (canvas) {
		// fabricjs scales the strokewidth the object by default.
		canvas.on("object:scaling", function (event) {
			var a = event.target;
			if (a.strokeWidthUnscaled) {
				a.strokeWidth = a.strokeWidthUnscaled / ((a.scaleX + a.scaleY) / 2);
			} else if (a.strokeWidth) {
				a.strokeWidthUnscaled = a.strokeWidth;
			}
		})
	},

	removeSelected: function (canvas) {
		// remove/delete all currently selected objects.
		// for some reason, group selections stay visible until the next action
		canvas.getActiveObjects().forEach(function (a) {
			canvas.remove(a)
		})
	},

	setSelectableOnly: function (canvas, object, selectable) {
		// set .selectable only for the given object and set it to the opposite for all other objects.
		// * true: make the given object selectable and all other objects unselectable
		// * false: make the given object unselectable and all other objects selectable
		canvas.getObjects().forEach(function (a) {
			a.selectable = false;
		})
		object.selectable = true;
	}
}

var imageEditor = {
	canvas: null,
	image: null,
	toolbar: null,
	activeTool: false,
	deinitPasteListener: null,
	colors: {
		red: "#dd0000"
	},
	init: function (options) {
		this.deinitPasteListener = options.deinitPasteListener
	},
	hide: function (options) {
		this.toolbar.hide()
	},
	activateTool: function (name) {
		// activate a tool, disabling others.
		// ignore if there is no image and therefore no editor
		if (!this.image) return
		// ignore if called for inactive tool
		if (this.activeTool == name) return
		// deactivate active tool
		if (this.activeTool) this.deactivateTool(this.activeTool)
		this.tools[name].activate()
		$(".toolbar.image_editor .button.name-" + name).addClass("active")
		this.activeTool = name
	},
	deactivateTool: function (name) {
		// string ->
		// ignore if called for inactive tool
		if (this.activeTool != name) return
		// get deactivate function
		var deactivate = this.tools[name].deactivate
		deactivate && deactivate.apply(this)
		this.activeTool = false
		$(".toolbar.image_editor .button.name-" + name).removeClass("active")
	},
	createToolButton: function (name, handler) {
		// string function -> jQuery
		// create one button for the toolbar
		return $("<span>", {
			html: name,
			"class": "button name-" + name,
			click: function () {
				imageEditor.activateTool(name)
			}
		})
	},
	createToolbar: function () {
		// -> jQuery
		// create the toolbar dom/jquery object
		toolNames = Object.keys(imageEditor.tools)
		var row = $("<div>").addClass("toolbar image_editor").hide()
		row.append(toolNames.map(this.createToolButton))
		this.toolbar = row
		return row
	},
	documentOnClick: function (event) {
		console.log("called")
		// remove selected elements on delete press
		var deleteKey = 46;
		if (deleteKey == event.which) {
			fabricHelper.removeSelected(canvas)
		}
	},
	setImage: function (canvasEl, image, width, height) {
		// element image number number -> jQuery
		if (this.canvas) this.canvas.dispose()
		this.toolbar.show()
		this.image = image
		// disable the listener for new pasted images because it easily conflicts with tools,
		// for example because it eventually uses an input field that is repeatedly re-focused.
		// it is re-initialised when the dialog is opened again
		this.deinitPasteListener()
		var canvas = new fabric.Canvas(canvasEl)
		//fabricHelper.keepObjectsInsideCanvas(canvas)
		fabricHelper.keepStrokeWidthWhenScaling(canvas)
		this.canvas = canvas
		var image = new fabric.Image(image, {
			width: width,
			height: height,
			selectable: false
		});
		canvas.setWidth(width)
		canvas.setHeight(height)
		canvas.add(image)
		// initialise remove element on delete press functionality
		//var doc = $(document)
		//doc.off(this.documentOnClick).keydown(this.documentOnClick)
	},
	getDataUrl: function () {
		// -> string
		// get a browser internal url to the final image
		//return fabricCrop.getDataUrl()
		return this.canvas.toDataURL()
	}
}

imageEditor.tools = {
	// each entry is automatically added to the toolbar and the
	// activate/deactivate functions, if available, are called
	// as appropriate when a tool is selected in the toolbar.
	/*
	"select": {
		activate: function () {
			imageEditor.canvas.selection = true
			// fabric has selection functionality by default.
			// this is a mode where all other modes are disabled
		}
	},
	*/
	"crop": {
		activate: function () {
			if (!fabricCrop.selection) {
				fabricCrop.init(imageEditor.canvas, imageEditor.image)
				imageEditor.canvas.selection = false
			}
			fabricCrop.show(imageEditor.canvas)
		},
		deactivate: function () {
			fabricCrop.hide(imageEditor.canvas)
		}
	},
	"marker": {
		width: 6,
		activate: function () {
			var a = imageEditor.canvas
			a.freeDrawingBrush.color = imageEditor.colors.red
			a.freeDrawingBrush.width = this.width
			a.isDrawingMode = true
		},
		deactivate: function () {
			imageEditor.canvas.isDrawingMode = false
		}
	},
	/*
	"text": {
		activate: function () {
			var text = new fabric.IText("tap and type", {
				fontFamily: "arial black",
				cursorDelay: 0,
				left: 100,
				top: 100
			})
			imageEditor.canvas.add(text).setActiveObject(text)
			imageEditor.canvas.bringToFront(text);
			// immediately deactivate because it is not a mode
			imageEditor.deactivateTool("text")
		}
	}
	"arrow": {
		activate: function () {
			return
			addArrowToCanvas(imageEditor.canvas)
			imageEditor.deactivateTool("arrow")
		}
	}
	*/
}

var fabricCrop = {
	selection: null,
	image: null,
	canvas: null,
	init: function (canvas, image) {
		console.log("init crop")
		this.canvas = canvas
		this.image = image
		this.selection = new fabric.Rect({
			fill: "transparent",
			visible: true,
			hasRotatingPoint: false,
			width: 240,
			height: 240
		})
		fabric.util.addListener(this.canvas.upperCanvasEl, "dblclick", function (event) {
			var target = canvas.findTarget(event)
			if (fabricCrop.selection === target) {
				fabricCrop.applyCrop()
			}
		});
		var a = this.selection
		this.canvas.add(a).setActiveObject(a)
	},
	resetSelection: function() {
		// make the selection smaller than the image and move it to the top left of the image
		this.selection.width = this.image.width * 0.8
		this.selection.height = this.image.height * 0.8
		this.selection.top = 0
		this.selection.left = 0
	},
	applyCrop: function () {
		canvas = this.canvas
		var cropped = new Image()
		cropped.src = this.getDataUrl()
		// debug
		$("#cbp_paste_dlg").append($("<img>", {src: cropped.src}))
		// remove old image
		canvas.remove(this.image)
		cropped.onload = function () {
			image = new fabric.Image(cropped)
			image.selectable = false
			image.visible = true
			//fabricCrop.image = image
			canvas.add(image)
			canvas.sendToBack(image)
			canvas.setWidth(image.width)
			canvas.setHeight(image.height)
			//fabricCrop.resetSelection()
			canvas.renderAll()
		};
	},
	show: function () {
		var a = this.selection
		a.visible = true
		// disable other objects, allow only the selection to be selected
		fabricHelper.setSelectableOnly(this.canvas, a, true)
	},
	hide: function () {
		this.selection.visible = false
		// enable other objects
		fabricHelper.setSelectableOnly(this.canvas, this.selection, false)
		this.image.selectable = false
		this.canvas.renderAll()
	},
	destroy: function () {
		this.canvas.remove(this.selection);
		this.canvas.renderAll()
	},
	getDataUrl: function () {
		// return a browser internal data url for the cropped image.
		var a = this.selection
		console.log(a.left, a.top, a.width, a.height, imageEditor.image.width, imageEditor.image.height)
		return this.canvas.toDataURL({
			left: a.left,
			top: a.top,
			width: a.width,
			height: a.height
		})
	}
}
