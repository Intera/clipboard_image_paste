// this file implements image editing functionality for the clipboard_paste overlay with fabric.js and replaces jcrop for cropping

function callEach(array) {
	// call each function in array without arguments
	array.forEach(function (a) {
		a()
	})
}

var fabricHelper = {
	// depends only on fabric.js

	keepObjectsInsideCanvas: function (canvas) {
		canvas.on("object:moving", function (e) {
			var top_margin = 0
			var bottom_margin = 0
			var left_margin = 0
			var right_margin = 0
			var obj = e.target
			var canvas = obj.canvas
			var top = obj.top
			var left = obj.left
			var zoom = canvas.getZoom()
			var pan_x = canvas.viewportTransform[4]
			var pan_y = canvas.viewportTransform[5]
			var c_width = canvas.width / zoom
			var c_height = canvas.height / zoom
			var w = obj.getScaledWidth()
			var left_adjust, right_adjust
			if (obj.originX == "center") {
				left_adjust = right_adjust = w / 2
			} else {
				left_adjust = 0
				right_adjust = w
			}
			var h = obj.getScaledHeight()
			var top_adjust, bottom_adjust
			if (obj.originY == "center") {
				top_adjust = bottom_adjust = h / 2
			} else {
				top_adjust = 0
				bottom_adjust = h
			}
			var top_bound = top_margin + top_adjust - pan_y
			var bottom_bound = c_height - bottom_adjust - bottom_margin - pan_y
			var left_bound = left_margin + left_adjust - pan_x
			var right_bound = c_width - right_adjust - right_margin - pan_x
			if (w > c_width) {
				obj.set("left", left_bound)
			} else {
				obj.set("left", Math.min(Math.max(left, left_bound), right_bound))
			}
			if (h > c_height) {
				obj.set("top", top_bound)
			} else {
				obj.set("top", Math.min(Math.max(top, top_bound), bottom_bound))
			}
		})
	},

	keepStrokeWidthWhenScaling: function (canvas) {
		// by default fabricjs scales the strokewidth.
		// on each scaling event, either save the unscaled strokewidth in a property
		// or use it to reset the current strokewidth
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

	objectExists: function (canvas, a) {
		return canvas.getObjects().includes(a)
	},

	setSelectableOnly: function (canvas, object, selectable) {
		// set the selectable property to true only for the given object and set it to false for all other objects.
		// selectable:
		//   true: make the given object selectable and all other objects unselectable
		//   false: make the given object unselectable and all other objects selectable
		canvas.getObjects().forEach(function (a) {
			a.selectable = false;
		})
		object.selectable = true;
	},

	disableDeselection: function (canvas, object) {
		// fabric -> function():reenable
		// make it impossible to deselect an object by always automatically
		// selecting it if deselected
		var handler = function (event) {
			if (fabricHelper.objectExists(canvas, object)) {
				canvas.setActiveObject(object);
			}
		}
		object.on("deselected", handler)
		return function () {
			object.off("deselected", handler)
		}
	}
}

var imageEditor = {
	// accepts a canvas element and an image, displays the image and adds a toolbar.
	// fabric.Canvas
	canvas: null,
	// fabric.Image
	image: null,
	toolbar: null,
	activeTool: false,
	// functions from clipboard_image_paste.js
	deinitPasteListener: null,
	setPastedImage: null,
	colors: {
		red: "#dd0000"
	},
	init: function (options) {
		this.deinitPasteListener = options.deinitPasteListener
		this.setPastedImage = options.setPastedImage
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
	createToolbarButton: function (name, handler) {
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
		row.append(toolNames.map(this.createToolbarButton))
		this.toolbar = row
		return row
	},
	documentOnKeypress: function (event) {
		console.log("documentonclick")
		// remove selected elements on delete press
		var deleteKey = 46;
		if (deleteKey == event.which) {
			fabricHelper.removeSelected(imageEditor.canvas)
		}
	},
	setImage: function (canvasEl, image, width, height) {
		// element image number number -> jQuery
		if (this.canvas) this.canvas.dispose()
		if (this.activeTool) this.deactivateTool(this.activeTool)
		this.toolbar.show()
		// disable the listener for new pasted images because it easily conflicts with tools,
		// for example because it eventually uses an input field that is repeatedly re-focused.
		// it is re-initialised when the dialog is opened again
		this.deinitPasteListener()
		var canvas = new fabric.Canvas(canvasEl)
		fabricHelper.keepObjectsInsideCanvas(canvas)
		//fabricHelper.keepStrokeWidthWhenScaling(canvas)
		this.canvas = canvas
		var image = new fabric.Image(image, {
			selectable: false
		});
		this.image = image
		image.scaleToWidth(width)
		canvas.setWidth(width)
		canvas.setHeight(height)
		canvas.add(image)
		// initialise remove element on delete press functionality
		var doc = $(document)
		doc.off("keydown", this.documentOnKeypress).keydown(this.documentOnKeypress)
	},
	getDataUrl: function () {
		// -> string
		// get a browser internal url to the final image
		return this.canvas.toDataURL()
	}
}

imageEditor.tools = {
	// each entry is automatically available for activation in the toolbar and the
	// activate/deactivate functions, if available, are eventually called
	// when a tool is selected in the toolbar.
	/*
	"select": {
    description: "free object selection/move/resize/delete/etc mode",
		activate: function () {
			imageEditor.canvas.selection = true
			// fabric has selection functionality by default.
			// this is a mode where all other modes are disabled
		}
	},
	*/
	"crop": {
		description: "crop the image to a rectangular area",
		activate: function () {
			fabricCrop.init(imageEditor.canvas, imageEditor.image)
			//x imageEditor.canvas.selection = false
			fabricCrop.enable(imageEditor.canvas)
		},
		deactivate: function () {
			fabricCrop.disable(imageEditor.canvas)
		}
	},
	"marker": {
		description: "draw freehand paths",
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
	  description: "add text objects",
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
    description: "add arrow objects with handles for length and angle",
		activate: function () {
			return
			addArrowToCanvas(imageEditor.canvas)
			imageEditor.deactivateTool("arrow")
		}
	}
	*/
}

var fabricRectangleMask = {
	// insert a resizable rectangle with the surrounding area in a different color
	options: null,
	rect: null,
	// image width/height
	width: null,
	height: null,
	mask: {
		top: null,
		right: null,
		bottom: null,
		left: null,
		fill: null
	},
	createRectangle(width, height) {
		return new fabric.Rect({
			fill: "transparent",
			visible: true,
			hasRotatingPoint: false,
			width: width,
			height: height,
			selectable: true,
			strokeWidth: 0,
			top: this.height / 2 - height / 2,
			left: this.width / 2 - width / 2
		})
	},
	init: function (options) {
		// creates a transparent center rectangle and 4 half transparent rectangles surrounding it.
		// clipTo would clip the whole canvas, and globalCompositeOperation would affect all layers
		var o = options
		this.options = o
		this.width = o.width || 100
		this.height = o.height || 100
		this.mask.fill = o.maskFill || "rgba(0,0,0,0.25)"
		// create a center area rectangle object
		this.rect = this.createRectangle(o.rectangleWidth || o.width * 0.5, o.rectangleHeight || o.height * 0.5)
		// set initial properties
		var rect = this.rect
		var mask = this.mask
		var defaultOptions = {
			fill: mask.fill,
			visible: true,
			selectable: false,
			strokeWidth: 0,
			stroke: false
		};
		["top", "right", "bottom", "left"].forEach(function (name) {
			mask[name] = new fabric.Rect(defaultOptions)
		})
		mask.top.width = mask.bottom.width = this.width
		mask.right.height = mask.left.height = rect.height
		mask.top.top = mask.top.left = mask.left.left = mask.bottom.left = 0
		mask.top.height = rect.top
		this.updateMask()
	},
	deinit: function () {
		this.options = this.rect = this.width = this.height = null
		this.mask = {}
	},
	removeFrom: function (canvas) {
		var a = this.mask
		canvas.remove(a.top, a.right, a.bottom, a.left, this.rect)
	},
	addTo: function (canvas) {
		var a = this.mask
		canvas.add(a.top).add(a.right).add(a.bottom).add(a.left)
		// insert the center rectangle only if it has been automatically created
		if (!this.options.rect) canvas.add(this.rect)
		this.rect.on({
			"scaling": fabricRectangleMask.updateMask,
			"moving": fabricRectangleMask.updateMask
		})
	},
	hide: function () {
		this.rect.visible = false
		this.mask.top.visible = false
		this.mask.right.visible = false
		this.mask.bottom.visible = false
		this.mask.left.visible = false

	},
	show: function () {
		this.rect.visible = true
		this.mask.top.visible = true
		this.mask.right.visible = true
		this.mask.bottom.visible = true
		this.mask.left.visible = true
	},
	updateMask: function () {
		// update properties
		var mask = fabricRectangleMask.mask
		var rect = fabricRectangleMask.rect
		mask.top.set("height", rect.top)
		mask.right.set({
			left: rect.left + rect.width * rect.scaleX,
			top: mask.top.height,
			width: fabricRectangleMask.width - rect.left + rect.width * rect.scaleX,
			height: rect.height * rect.scaleY
		})
		var bottomHeight = fabricRectangleMask.height - mask.top.height - rect.height * rect.scaleY
		mask.bottom.set({
			height: bottomHeight,
			top: fabricRectangleMask.height - bottomHeight
		})
		mask.left.set({
			top: mask.top.height,
			width: rect.left,
			height: rect.height * rect.scaleY
		})
		mask.top.setCoords()
		mask.right.setCoords()
		mask.bottom.setCoords()
		mask.left.setCoords()
	}
}

var fabricCrop = {
	// for a canvas with image, to draw a rectangle with a transparent background mask
	// and get the cropped result or replace the canvas with the cropped result
	selection: null,
	image: null,
	canvas: null,
	mask: null,
	onDisable: [],
	onDeinit: [],
	init: function (canvas, image) {
		this.deinit()
		this.canvas = canvas
		this.image = image
		fabricRectangleMask.init({
			width: imageEditor.image.width,
			height: imageEditor.image.height
		})
		fabricRectangleMask.addTo(canvas)
		this.selection = fabricRectangleMask.rect
		var onDblClick = function (event) {
			var target = canvas.findTarget(event)
			if (fabricCrop.selection === target) {
				fabricCrop.applyCrop()
			}
		}
		var upperCanvasEl = this.canvas.upperCanvasEl
		fabric.util.addListener(upperCanvasEl, "dblclick", onDblClick);
		this.onDeinit.push(function () {
			fabric.util.removeListener(upperCanvasEl)
			fabricRectangleMask.removeFrom(canvas)
			fabricRectangleMask.deinit()
		})
		this.canvas.setActiveObject(this.selection)
	},
	deinit: function () {
		callEach(this.onDeinit)
	},
	applyCrop: function () {
		// replace canvas contents with the cropped result.
		// fabric objects get converted to pixels.
		// the image could alternatively be clipped, but then fabric objects
		// might cross image boundaries
		var canvas = this.canvas
		var selection = this.selection
		var cropped = new Image()
		// remove the selection mask
		fabricRectangleMask.removeFrom(canvas)
		fabricRectangleMask.deinit()
		cropped.src = this.getDataUrl()
		// remove old image and fabric objects
		canvas.remove(this.image)
		canvas.getObjects().forEach(function (a) {
			canvas.remove(a)
		})
		// replace the old image with the cropped image
		cropped.onload = function () {
			image = new fabric.Image(cropped)
			image.selectable = false
			image.visible = true
			fabricCrop.image = image
			imageEditor.setPastedImage(cropped)
			imageEditor.image = cropped
			canvas.add(image)
			canvas.sendToBack(image)
			canvas.setWidth(image.width)
			canvas.setHeight(image.height)
			canvas.renderAll()
		};
	},
	enable: function () {
		this.selection.visible = true
		// disable other objects, allow only the selection to be selected
		//fabricHelper.setSelectableOnly(this.canvas, this.selection, true)
		var reenableDeselection = fabricHelper.disableDeselection(this.canvas, this.selection)
		this.onDisable.push(reenableDeselection)
		fabricRectangleMask.show()
		this.canvas.renderAll()
	},
	disable: function () {
		fabricRectangleMask.hide()
		this.selection.visible = false
		// enable other objects
		//fabricHelper.setSelectableOnly(this.canvas, this.selection, false)
		this.image.selectable = false
		callEach(this.onDisable)
		this.canvas.discardActiveObject()
		this.canvas.renderAll()
	},
	getCropArea: function () {
		// return coordinates for the selected area
		var a = this.selection
		return {
			left: a.left,
			top: a.top,
			width: a.width * a.scaleX,
			height: a.height * a.scaleY
		}
	},
	getDataUrl: function () {
		// return a browser internal data url for the cropped image
		return this.canvas.toDataURL(this.getCropArea())
	}
}
