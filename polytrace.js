var center = new createjs.Shape();
var dot = new createjs.Shape();
var poly = new createjs.Shape();

var pointPos = [];// global array of animate objects 

var x = 275;
var y = 275;
//properties of finding the next polygon point using polar coordinates 
var r = 60;
var dr = 15;
var angle = 0;//Measured in radians 
var angleOffset = -Math.PI / 2;
var maxSides = 15;

function plotOrigin(x, y){
    center.graphics.beginFill("black");
    center.graphics.drawCircle(x, y, 4);
    return center;
}


function getPlotData(maxSides){
    //Resets angle properties so there is a flat
    var dx = r * Math.cos(angle);
    var dy = r * Math.sin(angle);
    var sides = 3;//creates triangle first 
    
    var polygons = new Array();

    //Loops through shapes (triangle square...)
    for(sides = 3; sides <= maxSides; sides++){
        //Every other polygon needed to be rotated based on overall edges 
        angleOffset = (sides % 2) == 0 ? (-Math.PI / 2) + Math.PI / sides: -Math.PI / 2;
        
        angle = 0;
        dx = r * Math.cos(angle + angleOffset);
        dy = r * Math.sin(angle + angleOffset);

        var tempArray = new Array();

        //plot points around the origin based on polygon being made
        for(var i = 0; i <= sides; i++){ 
            var point = new createjs.Point(x + dx, y + dy);
            tempArray.push(point);
            //get new angle and dx dy
            angle += 2* Math.PI / sides;
            dx = r * Math.cos(angle + angleOffset);
            dy = r * Math.sin(angle + angleOffset);    
        }
        polygons.push(tempArray);
        r = r + dr;
    }
    
    return polygons;
}


function drawPolygons(polyArr, stage){
    
    var line = new createjs.Shape();
    line.graphics.setStrokeStyle(2);
    line.graphics.beginStroke("black");

    var hue = 0;

    for(var i = 0; i < polyArr.length; i++){
        line.graphics.setStrokeStyle(2);
        line.graphics.beginStroke(`hsl(${hue}, 100%, 50%)`);
        line.graphics.moveTo(polyArr[i][0].x, polyArr[i][0].y);
        hue += 25;
        for(var j = 1; j < polyArr[i].length; j++){
            line.graphics.lineTo(polyArr[i][j].x, polyArr[i][j].y);
        }
        line.graphics.endStroke();
        stage.addChild(line);
    }
}

function interpolate(pt1, pt2, f, pt) {
    pt = pt || new createjs.Point();
    pt.x = pt2.x + f * (pt1.x - pt2.x);
    pt.y = pt2.y + f * (pt1.y - pt2.y);
    return pt;
}

function findStart(polyArr, stage){
    var interpVal = .5;
    
    for(var i = 0; i < polyArr.length; i++){
        var dot = new createjs.Shape();
        stage.addChild(dot);
        var start;
        for(var j = 1; j < polyArr[i].length; j++){
            //Check for reaching the second half of polygon
            if(j >= (polyArr[i].length / 2 )){
                //Object will recieve all data needed for animating 
                var result = {
                    pos: new createjs.Point(),
                    nextIndex: 0,
                    interp: .5,
                    shape: new createjs.Shape(),
                    len: 0,
                    segDist: 0
                }; 

                if(polyArr[i].length % 2 == 0){
                    start = interpolate(polyArr[i][j - 1], polyArr[i][j], interpVal);
                    result.pos = start;
                    result.nextIndex = j;
                    //get distance of one segment 
                    var tempX = polyArr[i][j - 1].x - polyArr[i][j].x; 
                    var tempY = polyArr[i][j - 1].y - polyArr[i][j].y;
                    result.segDist = Math.sqrt((tempX)^2 + (tempY)^2);
                }
                else{
                    start = interpolate(polyArr[i][j - 2], polyArr[i][j - 1], interpVal);
                    result.pos = start;
                    result.nextIndex = j - 1;
                    //get distance of one segment 
                    var tempX = polyArr[i][j - 2].x - polyArr[i][j - 1].x; 
                    var tempY = polyArr[i][j - 2].y - polyArr[i][j - 1].y;
                    result.segDist = Math.sqrt((tempX)^2 + (tempY)^2);
                }
                result.interp = interpVal;
                result.shape = dot;
                result.len = polyArr[i].length - 1;
                pointPos.push(result);
                setSpeed();
                break;
            }
        }
    }
}

// sets the speed of each dot by mutliplying a shapes side count 
// by the segment distance (created in findStart())
// each segment of the from the outside in rotates 1 more time than
// the segment adjacent to it
function setSpeed(){
    var time = (1000 * 60) / 4; //15 second rotate time
    var rotations = 14; 
    for(var i = 0; i < pointPos.length; i++){
        var dist = pointPos[i].len * pointPos[i].segDist * 1.25;
        pointPos[i].totalDist = dist * rotations;
        rotations--;
        pointPos[i].speed = pointPos[i].totalDist / time;
    }
    console.log("speed set");
}


function animateDots(polyArr, stage){
    
    var speed = .06;
    var hue = 0;
    for(var i =  0; i < pointPos.length; i++){
        
        var nextIndex = pointPos[i].nextIndex;
        var maxLen = pointPos[i].len;
        
        pointPos[i].interp = pointPos[i].interp - pointPos[i].speed; //move the dots by specific speeds 

        //reset array to start
        if(pointPos[i].interp <= 0){
            pointPos[i].interp = 1;
            pointPos[i].nextIndex = pointPos[i].nextIndex + 1;
            if(pointPos[i].nextIndex > pointPos[i].len){
                pointPos[i].nextIndex = 1;
            }
        }
        //find spot on line between two points 
        pointPos[i].pos = interpolate(polyArr[i][pointPos[i].nextIndex - 1], polyArr[i][pointPos[i].nextIndex], pointPos[i].interp);
        var pos = pointPos[i].pos;
        var interpVal = pointPos[i].interp;
        var startDot = pointPos[i].shape;

        startDot.graphics.clear();
        startDot.graphics.beginFill(`hsl(${hue}, 100%, 0%)`);
        startDot.graphics.drawCircle(pos.x, pos.y , 5);
        startDot.graphics.endFill();
        hue += 25;
    }
    stage.update();
}

//Create timer 
var btnPause = document.getElementById("btn-Pause");
var isSlow = false;
btnPause.addEventListener('click', function(){
    if(isSlow){
        createjs.Ticker.framerate = 60;
        isSlow = false;
    }
    else{
        createjs.Ticker.framerate = 1;
        isSlow = true;
    }
});

//Create reset 
var btnReset = document.getElementById("btn-Reset");
btnReset.addEventListener('click', function(){
    createjs.Ticker.off();
    findStart(pointData, stage);
});

function init() {
    var stage = new createjs.Stage("demoCanvas");
    x = stage.canvas.width / 2;
    y = stage.canvas.height / 2;

    //create origin 
    stage.addChild(plotOrigin(x, y));
    
    var pointData = getPlotData(maxSides);
    
    drawPolygons(pointData, stage);
    
    findStart(pointData, stage);
    
    createjs.Ticker.addEventListener("tick",() => animateDots(pointData, stage));
    createjs.Ticker.framerate = 60;
    
    console.log(pointData);
    console.log(pointPos);
}
