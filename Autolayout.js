//
//
// Auto Layout by tim lindner (tlindner@macmess.org)
//
// https://github.com/tlindner/Auto-Layout/wiki
//

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elem, fromIndex){  
         fromIndex = fromIndex || 0;  
         for(var i = fromIndex; i < this.length; i++){  
              if(this[i] == elem){  
                    return i;  
              }  
         }  
         return -1;  
    }
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position){
        position = position || 0;
        return this.lastIndexOf(searchString, position) === position;
    }
}

Array.prototype.map = Array.prototype.map || function(_x) {
    for(var o=[], i=0; i<this.length; i++) { 
        o[i] = _x(this[i]); 
    }
    return o;
};

var auto_layout_file = File.openDialog("Choose an Auto Layout File");
auto_layout_file.open("r");

var page_width = 0;
var page_height = 0;
var layout = [];
var gutters = [];
var offset_y = 0;
var offset_x = 1;
var angle = 2;
var counter = 3;
var count = 4;

var gutter_index_primary = 0;
var gutter_index_secondary = 0;

var cur_x = 0;
var cur_y = 0;

var nxt_x = 0;
var nxt_y = 0;

var max_page_width = 0;
var max_page_height = 0;

app.pdfPlacePreferences.pdfCrop = PDFCrop.CROP_BLEED;
app.pdfPlacePreferences.transparentBackground = false;

var myDocument = app.documents.add();

with (myDocument.documentPreferences) {
    pageHeight = "4in";
    pageWidth = "4in";
    pageOrientation = PageOrientation.landscape;
    facingPages = false;
}

var myRegistrationColor = myDocument.colors.item("Registration");
var myNoneSwatch = myDocument.swatches.item("None");
var myLayer = myDocument.layers.add({name:"myCropMarks"});
myLayer.move(LocationOptions.AT_END);
var recLayer = myDocument.layers[0];

var myPage = myDocument.pages.item(0);
var newPageFlag = false;

myPage.marginPreferences.properties = { top: 0, left: 0, right: 0, bottom:0 };
     
var layout_file_line, layout_file_line_lc;

layout_file_line = auto_layout_file.readln().toLowerCase();

if( layout_file_line.startsWith("one sided") ) {
    // Good to go
}
else if( layout_file_line.startsWith("sheetwise")) {
    alert( "Flow file must being with 'one sided'");
    exit();
}
else {
    alert( "Flow file must being with 'one sided'");
    exit();
}

while ( auto_layout_file.eof == false ) {
    layout_file_line = auto_layout_file.readln();
    layout_file_line_lc = layout_file_line.toLowerCase();
    
    if( layout_file_line_lc.startsWith("#" ) ) {
        continue;
    }
    
    if( layout_file_line_lc.startsWith("top to bottom:") ) {
        var layout_line = layout_file_line_lc.split(":")[1];
        var arguments = layout_line.split(",").map(Number);
        layout.push([1,0,arguments[1],0,arguments[0]]);
    }
    else if( layout_file_line_lc.startsWith("left to right:") ) {
        var layout_line = layout_file_line_lc.split(":")[1];
        var arguments = layout_line.split(",").map(Number);
        layout.push([0,1,arguments[1],0,arguments[0]]);
    }
    else if( layout_file_line_lc.startsWith("bottom to top:") ) {
        var layout_line = layout_file_line_lc.split(":")[1];
        var arguments = layout_line.split(",").map(Number);
        layout.push([-1,0,arguments[1],0,arguments[0]]);
    }
    else if( layout_file_line_lc.startsWith("right to left:") ) {
        var layout_line = layout_file_line_lc.split(":")[1];
        var arguments = layout_line.split(",").map(Number);
        layout.push([0,-1,arguments[1],0,arguments[0]]);
    }
    else if( layout_file_line_lc.startsWith("gutters:") ) {
        var gutter_line = layout_file_line_lc.split(":")[1];
        gutters.push( gutter_line.split(",").map(Number) );
    }
    else if( layout_file_line_lc.startsWith("pages:") ) {
       if( layout.length != gutters.length )
       {
            alert( "Problem parsing flow file. Number of layouts does not equal number of gutters" );
            exit();
       }
       
        var pages_line = layout_file_line.split(":")[1];
        
        var csv_file = File(auto_layout_file.path + "/" + pages_line.split(",")[0]);
        csv_file.open("r");
        
        var csv = parseCSV( csv_file.read() );
        
        var pdf_file_index = csv[0].indexOf( pages_line.split(",")[1] );
        
        if( pdf_file_index == -1 ) {
            alert( "Could not find PDF file column: " + pages_line.split(",")[1] + " in CSV file: " + pages_line.split(",")[0] );
            exit();
        }
        
        var pdf_pagenumber_index = csv[0].indexOf( pages_line.split(",")[2] );
        
        if( pdf_pagenumber_index == -1 ) {
            alert( "Could not find PDF page number column: " + pages_line.split(",")[2] + " in CSV file: " + pages_line.split(",")[0] );
            exit();
        }
        
        var nup_index = csv[0].indexOf( pages_line.split(",")[3] );
        
        if( nup_index == -1 ) {
            alert( "Could not find number up column: " + pages_line.split(",")[3] + " in CSV file: " + pages_line.split(",")[0] );
            exit();
        }
        
        var bleed = parseFloat(pages_line.split(",")[4]);
    
        if( bleed == undefined ) {
            alert( "Bleed distance was undefined in layout file."  );
            exit();
        }

        var ul_index = 0;
        var csv_length = csv.length;
        for (var i = 1; i < csv_length; i++) {
            for (var j=0; j<csv[i][nup_index]; j++) {
                var anchorCorner;
                
                if( newPageFlag == true ) {
                    myPage = myDocument.pages.add(LocationOptions.after, myPage);
                    myPage.marginPreferences.properties = { top: 0, left: 0, right: 0, bottom:0 };
                    gutter_index_primary = 0;
                    gutter_index_secondary = 0;
                    ul_index = 0;
                    cur_x = 0;
                    cur_y = 0;
                    nxt_x = 0;
                    nxt_y = 0;
                    page_width = 0;
                    page_height = 0;
                    max_page_width = 0;
                    max_page_height = 0;
                    newPageFlag = false;
                }

                anchorCorner = ResetOrigin( myDocument, myPage, layout[ul_index][offset_y], layout[ul_index][offset_x], layout[ul_index+1][offset_y], layout[ul_index+1][offset_x]);

                app.layoutWindows[0].zoom(ZoomOptions.FIT_PAGE);

                // Make new rectangle and place PDF inside it.
                var myRectangle = myPage.rectangles.add(recLayer, undefined, undefined, {strokeColor:"None",fillColor:"Paper",geometricBounds:[cur_y, cur_x, cur_y+1, cur_x+1]});
                myRectangle.absoluteRotationAngle = layout[ul_index][angle];
                app.pdfPlacePreferences.pageNumber = parseInt(csv[i][pdf_pagenumber_index]);
                var mypdf = myRectangle.place(File(auto_layout_file.path + "/" +csv[i][pdf_file_index]))[0];
                
                // Calculate auctual pdf height width.
                var pdf_height = mypdf.geometricBounds[2] - mypdf.geometricBounds[0] - (2 * bleed);
                var pdf_width = mypdf.geometricBounds[3] - mypdf.geometricBounds[1] - (2 * bleed);
                
                // Calculate box for rectangle
                var y1 = cur_y;
                var x1 = cur_x;
                var y2 = cur_y + (layout[ul_index][offset_y] * pdf_height) + (layout[ul_index+1][offset_y] * pdf_height);
                var x2 = cur_x + (layout[ul_index][offset_x] * pdf_width) + (layout[ul_index+1][offset_x] * pdf_width);
                
                // Calculate next box position
                nxt_x = cur_x + (layout[ul_index][offset_x] * (pdf_width + gutters[ul_index+0][gutter_index_primary]));
                nxt_y = cur_y + (layout[ul_index][offset_y] * (pdf_height + gutters[ul_index+0][gutter_index_primary]));
                
                // Set rectangle postition and size, and PDF position and size
                myRectangle.geometricBounds = [Math.min(y1, y2), Math.min(x1,x2), Math.max(y1, y2), Math.max(x1,x2)];
                mypdf.geometricBounds = [Math.min(y1, y2) - bleed, Math.min(x1,x2) - bleed, Math.max(y1, y2) + bleed, Math.max(x1,x2) + bleed];

                page_height = Math.max(Math.abs(y1), Math.abs(y2));
                page_width = Math.max(Math.abs(x1), Math.abs(x2));

                // Draw crop marks on rectangle, send to back layer.
                myDrawCropMarks (Math.min(x1,x2), Math.min(y1, y2), Math.max(x1,x2), Math.max(y1, y2), 0.25, 0.125, 0.25, myRegistrationColor, myNoneSwatch, myLayer);
                
                // Expand clipping rectangle to expose bleed.
                var previous_gutter_index_primary = gutter_index_primary - 1
                if( previous_gutter_index_primary == -1 ) {
                    previous_gutter_index_primary = gutters[ul_index+0].length - 1;
                }
                
                var previous_gutter_index_secondary = gutter_index_secondary - 1
                if( previous_gutter_index_secondary == -1 ) {
                    previous_gutter_index_secondary = gutters[ul_index+1].length - 1;
                }
                
                // Adjust bleeds for small gutters
                var left_bleed;
                var right_bleed;
                var top_bleed;
                var bottom_bleed;

                if( layout[ul_index][offset_y] != 0 && layout[ul_index+1][offset_y] == 0 ) {
                    left_bleed = Math.min(bleed, gutters[ul_index+1][previous_gutter_index_secondary] / 2.0 );
                    right_bleed = Math.min(bleed, gutters[ul_index+1][gutter_index_secondary] / 2.0 );
                    top_bleed = Math.min(bleed, gutters[ul_index+0][previous_gutter_index_primary] / 2.0 );
                    bottom_bleed = Math.min(bleed, gutters[ul_index+0][gutter_index_primary] / 2.0 );

                    if( layout[ul_index][counter] == 0 ) {
                        top_bleed = bleed;
                    }
                    
                    if( layout[ul_index][counter]+1 == layout[ul_index][count] ) {
                        bottom_bleed = bleed;
                    }

                    if( layout[ul_index+1][counter] == 0 ) {
                        left_bleed = bleed;
                    }
                    
                    if( layout[ul_index+1][counter]+1 == layout[ul_index+1][count] ) {
                        right_bleed = bleed;
                    }
                    
                }
                else {
                    left_bleed = Math.min(bleed, gutters[ul_index+0][previous_gutter_index_primary] / 2.0 );
                    right_bleed = Math.min(bleed, gutters[ul_index+0][gutter_index_primary] / 2.0 );
                    top_bleed = Math.min(bleed, gutters[ul_index+1][previous_gutter_index_secondary] / 2.0 );
                    bottom_bleed = Math.min(bleed, gutters[ul_index+1][gutter_index_secondary] / 2.0 );

                    if( layout[ul_index][counter] == 0 ) {
                        left_bleed = bleed;
                    }
                    
                    if( layout[ul_index][counter]+1 == layout[ul_index][count] ) {
                        right_bleed = bleed;
                    }

                    if( layout[ul_index+1][counter] == 0 ) {
                        top_bleed = bleed;
                    }
                    
                    if( layout[ul_index+1][counter]+1 == layout[ul_index+1][count] ) {
                        bottom_bleed = bleed;
                    }
                }
                
                myRectangle.geometricBounds = [Math.min(y1, y2)-top_bleed, Math.min(x1,x2)-left_bleed, Math.max(y1, y2)+bottom_bleed, Math.max(x1,x2)+right_bleed];

                cur_x = nxt_x;
                cur_y = nxt_y;
                
                // Increment primary counter
                layout[ul_index][counter] = layout[ul_index][counter] + 1;
                
                if( layout[ul_index][counter] == layout[ul_index][count] ) {
                    // Shift over (left or right) and back (top or bottom)
                    
                    if( layout[ul_index][offset_y] != 0 && layout[ul_index+1][offset_y] == 0 ) {
                        cur_y = nxt_y = 0;
                        cur_x = layout[ul_index+1][offset_x] * (page_width + gutters[ul_index+1][gutter_index_secondary]);
                    }
                    else if ( layout[ul_index][offset_y] == 0 && layout[ul_index+1][offset_y] != 0 ) {
                        cur_y = layout[ul_index+1][offset_y] * (page_height + gutters[ul_index+1][gutter_index_secondary]);
                        cur_x = nxt_x = 0;
                    }
                    
                    // reset primary counter, increment secondary counter.
                    layout[ul_index][counter] = 0;
                    layout[ul_index+1][counter] = layout[ul_index+1][counter] + 1;
                    
                    if ( layout[ul_index+1][counter] == layout[ul_index+1][count] )
                    {
                        layout[ul_index+1][counter] = 0;
                        
                        // Check if there is another flow
                        if( ul_index+2 < layout.length ) {
                            gutter_index_primary = -1;
                            gutter_index_secondary = -1;
                            ul_index += 2;
                        }
                        else {
                            // Start new page
                            newPageFlag = true;
                        }
                    }
                    
                    gutter_index_secondary++;
                    if( !(gutter_index_secondary < gutters[ul_index+1].length) ) {
                        gutter_index_secondary = 0;
                    }
                }
                
                // pages only get bigger
                page_width = Math.max( page_width, max_page_width);
                page_height = Math.max( page_height, max_page_height);
                myPage.resize(CoordinateSpaces.INNER_COORDINATES, anchorCorner, ResizeMethods.REPLACING_CURRENT_DIMENSIONS_WITH, [page_width*72, page_height*72]);
                max_page_width = page_width;
                max_page_height = page_height;
                
                gutter_index_primary++;
                if( !(gutter_index_primary < gutters[ul_index+0].length) ) {
                    gutter_index_primary = 0;
                }
            }
        }
    }
}

function ResetOrigin( doc, page, y1, x1, y2, x2) {
    
    if( y1 == 1 && x1 == 0 && y2== 0 && x2 == 1 ) {
        doc.zeroPoint = [0, 0];
        return AnchorPoint.TOP_LEFT_ANCHOR;
    }
    else if( y1 == 1 && x1 == 0 && y2 == 0 && x2 == -1 ) {
        doc.zeroPoint = [Math.abs(page.bounds[3] - page.bounds[1]), 0];
        return AnchorPoint.TOP_RIGHT_ANCHOR;
    }
    else if( y1 == 0 && x1 == 1 && y2 == 1 && x2 == 0 ) {
        doc.zeroPoint = [0, 0];
        return AnchorPoint.TOP_LEFT_ANCHOR;
    }
    else if( y1 == 0 && x1 == 1 && y2 == -1 && x2 == 0 ) {
        doc.zeroPoint = [0, Math.abs(page.bounds[2] - page.bounds[0])];
        return AnchorPoint.BOTTOM_LEFT_ANCHOR;
    }
    else if( y1 == -1 && x1 == 0 && y2 == 0 && x2 == 1 ) {
        doc.zeroPoint = [0, Math.abs(page.bounds[2] - page.bounds[0])];
        return AnchorPoint.BOTTOM_LEFT_ANCHOR;
    }
    else if( y1 == -1 && x1 == 0 && y2 == 0 && x2 == -1 ) {
        doc.zeroPoint = [Math.abs(page.bounds[3] - page.bounds[1]), Math.abs(page.bounds[2] - page.bounds[0])];
        return AnchorPoint.BOTTOM_RIGHT_ANCHOR;
    }
    else if( y1 == 0 && x1 == -1 && y2 == 1 && x2 == 0 ) {
        doc.zeroPoint = [Math.abs(page.bounds[3] - page.bounds[1]), 0];
        return AnchorPoint.TOP_RIGHT_ANCHOR;
    }
    else if( y1 == 0 && x1 == -1 && y2 == -1 && x2 == 0 ) {
        doc.zeroPoint = [Math.abs(page.bounds[3] - page.bounds[1]), Math.abs(page.bounds[2] - page.bounds[0])];
        return AnchorPoint.BOTTOM_RIGHT_ANCHOR;
    }
    else {
        return undefined;
    }
    
}

function parseCSV(str) {
    var arr = [];
    var quote = false;  // true means we're inside a quoted field

    // iterate over each character, keep track of current row and column (of the returned array)
    for (var row = col = c = 0; c < str.length; c++) {
        var cc = str[c], nc = str[c+1];        // current character, next character
        arr[row] = arr[row] || [];             // create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') { quote = !quote; continue; }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { ++col; continue; }

        // If it's a newline and we're not in a quoted field, move on to the next
        // row and move to column 0 of that new row
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    return arr;
}

function myDrawCropMarks (myX1, myY1, myX2, myY2, myCropMarkLength, myCropMarkOffset, myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer){

    //Upper left crop mark pair.
    myDrawLine([myY1, myX1-myCropMarkOffset, myY1, myX1-(myCropMarkOffset + myCropMarkLength)], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);
    myDrawLine([myY1-myCropMarkOffset, myX1, myY1-(myCropMarkOffset+myCropMarkLength), myX1], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);

    //Lower left crop mark pair.
    myDrawLine([myY2, myX1-myCropMarkOffset, myY2, myX1-(myCropMarkOffset+myCropMarkLength)], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);
    myDrawLine([myY2+myCropMarkOffset, myX1, myY2+myCropMarkOffset+myCropMarkLength, myX1], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);

    //Upper right crop mark pair.
    myDrawLine([myY1, myX2+myCropMarkOffset, myY1, myX2+myCropMarkOffset+myCropMarkLength], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);
    myDrawLine([myY1-myCropMarkOffset, myX2, myY1-(myCropMarkOffset+myCropMarkLength), myX2], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);

    //Lower left crop mark pair.
    myDrawLine([myY2, myX2+myCropMarkOffset, myY2, myX2+myCropMarkOffset+myCropMarkLength], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);
    myDrawLine([myY2+myCropMarkOffset, myX2, myY2+myCropMarkOffset+myCropMarkLength, myX2], myCropMarkWidth, myRegistrationColor, myNoneSwatch, myLayer);
}

function myDrawLine(myBounds, myStrokeWeight, myRegistrationColor, myNoneSwatch, myLayer){
    app.activeWindow.activeSpread.graphicLines.add(myLayer, undefined, undefined,{strokeWeight:myStrokeWeight, fillColor:myNoneSwatch, strokeColor:myRegistrationColor, geometricBounds:myBounds})
}
