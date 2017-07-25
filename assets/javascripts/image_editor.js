// this implements image editing functionality via the selection of tools and replaces jcrop for cropping.

var fabricHelper = {
	keepObjectsInsideCanvas: function (canvas) {
		canvas.on("object:moving", function (e) {
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

			var w = obj.getWidth()
			var left_adjust, right_adjust
			if (obj.originX == "center") {
				left_adjust = right_adjust = w / 2
			} else {
				left_adjust = 0
				right_adjust = w
			}

			var h = obj.getHeight();
			var top_adjust, bottom_adjust;
			if (obj.originY == "center") {
				top_adjust = bottom_adjust = h / 2;
			} else {
				top_adjust = 0;
				bottom_adjust = h;
			}

			// if you need margins set them here
			var top_margin = 0;
			var bottom_margin = 0;
			var left_margin = 0;
			var right_margin = 0;

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
	colors: {
		red: "#dd0000"
	},
	activateTool: function (name) {
		// activate a tool, disabling others, passing args to its activate handler
		if (!this.image) return
		if (this.activeTool == name) return
		if (this.activeTool) this.deactivateTool(this.activeTool)
		this.tools[name].activate()
		this.activeTool = name
	},
	deactivateTool: function (name) {
		if (this.activeTool != name) return
		var deactivate = this.tools[name].deactivate
		deactivate && deactivate.apply(this)
		this.activeTool = false
	},
	createToolButton: function (name, handler) {
		return $("<span>", {
			html: name,
			"class": "button",
			click: function () {
				imageEditor.activateTool(name)
			}
		})
	},
	insertToolbar: function () {
		toolNames = Object.keys(imageEditor.tools)
		var row = $("<div>").addClass("toolbar image_editor")
		row.append(toolNames.map(this.createToolButton))
		$("#cbp_header_box").append(row)
		this.toolbar = row
	},
	setCanvasAndImage: function (canvas, image) {
		this.canvas = canvas
		this.image = image
		$(document).keydown(function (event) {
			var deleteKey = 46;
			if (deleteKey == event.which) {
				fabricHelper.removeSelected(canvas)
			}
		})
	},
	getDataUrl: function () {
		// get a (browser internal) url to the final image
		return fabricCrop.getDataUrl()
	}
}

imageEditor.tools = {
	"select": {
		activate: function () {
			// fabric has selection functionality by default.
			// this is a mode where all other modes are disabled
		}
	},
	"crop": {
		activate: function () {
			if (!fabricCrop.selection) {
				fabricCrop.create(imageEditor.canvas, imageEditor.image)
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
			imageEditor.deactivateTool("text")
		}
	}
	/*
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
	create: function (canvas, image) {
		this.canvas = canvas
		this.image = image
		this.selection = new fabric.Rect({
			fill: "transparent",
			visible: true,
			hasRotatingPoint: false,
			width: 240,
			height: 240
		})
		var selection = fabricCrop.selection
		fabric.util.addListener(this.canvas.upperCanvasEl, "dblclick", function (event) {
			var target = canvas.findTarget(event)
			if (selection === target) {
				fabricCrop.applyCrop()
			}
		});
	},
	applyCrop: function () {
		console.log(this.getDataUrl())
		var cropped = new Image()
		var selection = fabricCrop.selection
		canvas = this.canvas
		cropped.src = this.getDataUrl()
		canvas.remove(this.image)
		canvas.remove(this.selection);
		canvas.clipTo = null
		cropped.onload = function () {
			image = new fabric.Image(cropped)
			image.selectable = false
			image.visible = true
			canvas.add(image)
			canvas.sendToBack(image)
			canvas.setWidth(image.width)
			canvas.setHeight(image.height)
			canvas.renderAll()
		};
	},
	show: function () {
		// fabric.Canvas ->
		var a = this.selection
		a.visible = true
		// disable all other objects
		fabricHelper.setSelectableOnly(this.canvas, a, true)
		this.canvas.add(a).setActiveObject(a)
		this.canvas.clipTo = function (ctx) {
			ctx.rect(a.left, a.top, a.getWidth(), a.getHeight())
		}
	},
	hide: function () {
		this.selection.visible = false
		this.canvas.clipTo = null
		// enable all other objects
		fabricHelper.setSelectableOnly(this.canvas, this.selection, false)
		this.image.selectable = false
		this.canvas.renderAll()
	},
	destroy: function () {
		this.canvas.remove(this.selection);
		this.canvas.clipTo = null
	},
	getDataUrl: function () {
		// disable clipping mask. otherwise the cropping coordinates get messed up
		this.canvas.clipTo = null
		var a = this.selection
		return this.canvas.toDataURL({
			left: a.left,
			top: a.top,
			width: a.getWidth(),
			height: a.getHeight()
		})
	}
}
