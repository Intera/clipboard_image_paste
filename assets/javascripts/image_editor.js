// new intera code
// tool only valid on canvas
// mousepointer change
// remove individual shapes
// undo

function limitObjectsToCanvas(canvas) {
	canvas.on("object:moving", function (e) {
		var obj = e.target
		if (obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width) {
			return
		}
		obj.setCoords();
		// top left corner
		if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
			obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top)
			obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left)
		}
		// bottom right corner
		if (obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height || obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width) {
			obj.top = Math.min(obj.top, obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top)
			obj.left = Math.min(obj.left, obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left)
		}
	});
}

function canvasFixStrokeWidthScaling(canvas) {
	canvas.on("object:scaling", function (event) {
		var o = event.target;
		if (!o.strokeWidthUnscaled && o.strokeWidth) {
			o.strokeWidthUnscaled = o.strokeWidth;
		}
		if (o.strokeWidthUnscaled) {
			o.strokeWidth = o.strokeWidthUnscaled / o.scaleX;
		}
	})
}

var imageEditor = {
	canvas: null,
	image: null,
	activeTool: false,
	activateTool: function (name, args) {
		// activate a tool, disabling others, passing args to its activate handler
		if (!this.image) return
		if (this.activeTool == name) return
		if (this.activeTool) this.deactivateTool(this.activeTool)
		this.tools[name].activate.apply(this, args ? args : [])
		this.activeTool = name
	},
	deactivateTool: function (name) {
		if (this.activeTool != name) return
		var deactivate = this.tools[name].deactivate
		deactivate &&	deactivate.apply(this)
		this.activeTool = false
	},
	createToolButton: function (name, handler) {
		return $("<a>", {
			html: name,
			href: "#",
			click: function() { imageEditor.activateTool(name) }
		})
	},
	insertToolbar: function () {
		toolNames = Object.keys(imageEditor.tools)
		var row = $("<div>")
		var columnOne = $("<div>")
		columnOne.append(toolNames.map(this.createToolButton))
		row.append(columnOne)
		$("#cbp_header_box").append(row)
	},
	getImageUrl: function () {
		return fabricCrop.getImageUrl(imageEditor.canvas)
	}
}

imageEditor.tools = {
	"crop": {
		activate: function () {
			console.log("activate")
			fabricCrop.create(imageEditor.canvas, imageEditor.image)
		},
		deactivate: function () {
			fabricCrop.destroy()
		}
	},
	"eraser": {
		activate: function () {},
		deactivate: function () {}
	},
	"marker": {
		activate: function () {
			imageEditor.canvas.isDrawingMode = true
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
	},
	"arrow": {
		activate: function () {
			addArrowToCanvas(imageEditor.canvas)
			imageEditor.deactivateTool("arrow")
		}
	}
}

var fabricCrop = {
	rectangle: null,
	create: function (canvas, image) {
		// fabric.Canvas fabric.Image ->
		rectangle = new fabric.Rect({
			fill: "transparent",
			stroke: "#ccc",
			strokeWidth: 2,
			strokeDashArray: [2, 2],
			visible: true,
			hasRotatingPoint: false,
			width: 240,
			height: 240
		});
		this.rectangle = rectangle
		canvas.add(rectangle).setActiveObject(rectangle)
		/*
		canvas.clipTo = function (ctx) {
			ctx.rect(rectangle.left, rectangle.top, rectangle.getWidth(), rectangle.getHeight())
		}
		*/
		canvas.on("mouse:down", function () {
			console.log(imageEditor.getImageUrl())
		})
	},
	getImageUrl: function (canvas) {
		var a = this.rectangle
		return canvas.toDataURL({
			left: a.left,
			top: a.top,
			width: a.width,
			height: a.height
		})
	},
	destroy: function () {
		imageEditor.canvas.remove(this.rectangle);
	}
}
