function addArrowToCanvas(canvas) {
	var line,
		arrow,
		circle;

	line = new fabric.Line([50, 50, 100, 100], {
		stroke: "#000",
		selectable: true,
		strokeWidth: "2",
		padding: 5,
		hasBorders: false,
		hasControls: false,
		originX: "center",
		originY: "center",
		lockScalingX: true,
		lockScalingY: true
	});

	var centerX = (line.x1 + line.x2) / 2,
		centerY = (line.y1 + line.y2) / 2;
	deltaX = line.left - centerX,
		deltaY = line.top - centerY;

	arrow = new fabric.Triangle({
		left: line.get("x1") + deltaX,
		top: line.get("y1") + deltaY,
		originX: "center",
		originY: "center",
		hasBorders: false,
		hasControls: false,
		lockScalingX: true,
		lockScalingY: true,
		lockRotation: true,
		pointType: "arrow_start",
		angle: -45,
		width: 20,
		height: 20,
		fill: "#000"
	});
	arrow.line = line;

	circle = new fabric.Circle({
		left: line.get("x2") + deltaX,
		top: line.get("y2") + deltaY,
		radius: 3,
		stroke: "#000",
		strokeWidth: 3,
		originX: "center",
		originY: "center",
		hasBorders: false,
		hasControls: false,
		lockScalingX: true,
		lockScalingY: true,
		lockRotation: true,
		pointType: "arrow_end",
		fill: "#000"
	});
	circle.line = line;

	line.customType = arrow.customType = circle.customType = "arrow";
	line.circle = arrow.circle = circle;
	line.arrow = circle.arrow = arrow;

	console.log("add line")
	canvas.add(line, arrow, circle);

	function moveEnd(obj) {
		var p = obj,
			x1, y1, x2, y2;

		if (obj.pointType === "arrow_end") {
			obj.line.set("x2", obj.get("left"));
			obj.line.set("y2", obj.get("top"));
		} else {
			obj.line.set("x1", obj.get("left"));
			obj.line.set("y1", obj.get("top"));
		}

		obj.line._setWidthHeight();

		x1 = obj.line.get("x1");
		y1 = obj.line.get("y1");
		x2 = obj.line.get("x2");
		y2 = obj.line.get("y2");

		angle = calcArrowAngle(x1, y1, x2, y2);

		if (obj.pointType === "arrow_end") {
			obj.arrow.set("angle", angle - 90);
		} else {
			obj.set("angle", angle - 90);
		}

		obj.line.setCoords();
		canvas.renderAll();
	}

	function moveLine() {
		var oldCenterX = (line.x1 + line.x2) / 2,
			oldCenterY = (line.y1 + line.y2) / 2,
			deltaX = line.left - oldCenterX,
			deltaY = line.top - oldCenterY;

		line.arrow.set({
			"left": line.x1 + deltaX,
			"top": line.y1 + deltaY
		}).setCoords();

		line.circle.set({
			"left": line.x2 + deltaX,
			"top": line.y2 + deltaY
		}).setCoords();

		line.set({
			"x1": line.x1 + deltaX,
			"y1": line.y1 + deltaY,
			"x2": line.x2 + deltaX,
			"y2": line.y2 + deltaY
		});

		line.set({
			"left": (line.x1 + line.x2) / 2,
			"top": (line.y1 + line.y2) / 2
		});
	}

	arrow.on("moving", function () {
		moveEnd(arrow);
	});

	circle.on("moving", function () {
		moveEnd(circle);
	});

	line.on("moving", function () {
		moveLine();
	});
}

function calcArrowAngle(x1, y1, x2, y2) {
	var angle = 0,
		x, y;

	x = (x2 - x1);
	y = (y2 - y1);

	if (x === 0) {
		angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
	} else if (y === 0) {
		angle = (x > 0) ? 0 : Math.PI;
	} else {
		angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
	}

	return (angle * 180 / Math.PI);
}
