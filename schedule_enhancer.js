/*
  Script to enhance "https://shmoocon.org/schedule/"
  Adds a link to the time column, opening a dialog containing 
  descriptions of the talks at that time.
*/

const SPEAKER_PAGE = '/speakers';
var gSpeakerPage = null;


function makeTag(tag, options) {
	// create an html tag and assign options
	// example: makeTag('a', {href='someurl', innerText='click me'});
	var out = Object.assign(document.createElement(tag), options);
	return out;
}

function time_click_handler(element) {
	
	// new table that we create
	var newTable = document.createElement('table');
	newTable.style.width='calc(100% - 10px)';
	newTable.style.maxHeight = 'calc(100vh - 50px)';
	newTable.style.display = 'block';
	var newTr = newTable.insertRow();
	
	// existing table we will scrape data from
	var td = this.closest('td');
	var tr = td.closest('tr');
	var table = tr.closest('table');
	var cells = table.rows[tr.rowIndex].cells;
	
	// get time
	var when = cells[0].innerText
	
	for(var j=1; j<cells.length; j++) {
		
		// get room
		var where = '?';
		xcoord = cells[j].getBoundingClientRect().right;
		for(var k=0; k<table.rows[1].cells.length; k++) {
			if(table.rows[1].cells[k].getBoundingClientRect().right == xcoord) {
				where = table.rows[1].cells[k].innerText;
				break;
			}
		}
		
		// get talk name and presenters
		var summary = cells[j].innerText.split(/\r?\n/);
		var what = summary[0];
		var who = summary[summary.length-1];
		
		// new table cell
		var newTd = newTr.insertCell();
		newTd.style.border = '1px solid black';
		newTd.style.verticalAlign = 'top';
		newTd.style.overflow = 'auto';
		
		newTd.appendChild(makeTag('span', {innerText: 'Where: '}));
		newTd.appendChild(makeTag('b', {innerText: where}));
		newTd.appendChild(makeTag('br'));
		
		newTd.appendChild(makeTag('span', {innerText: 'When: '}));
		newTd.appendChild(makeTag('b', {innerText: when}));
		newTd.appendChild(makeTag('br'));
		
		newTd.appendChild(makeTag('span', {innerText: 'What: '}));
		newTd.appendChild(makeTag('b', {innerText: what}));
		newTd.appendChild(makeTag('br'));
		
		newTd.appendChild(makeTag('span', {innerText: 'Who: '}));
		newTd.appendChild(makeTag('b', {innerText: who}));
		newTd.appendChild(makeTag('br'));
		

		// find anchor name for this talk
		var anchors = cells[j].getElementsByTagName('a');
		var anchorName = null;
		for(var k=0; k<anchors.length; k++) {
			if(anchors[k].name != ''){
				anchorName = anchors[k].name;
				break;			
			}
		}
		// console.log(anchorName);
		
		// find corresponding anchor from speaker page
		var speakerElement = null;
		if(anchorName != null) {
			anchors = gSpeakerPage.getElementsByTagName('a');
			for(var k=0; k<anchors.length; k++) {
				if(anchors[k].name == anchorName) {
					var speakerElement = anchors[k].parentElement;
					break;
				}
			}
		}
		var count = 0;
		while(speakerElement != null) {
			count++;
			// console.log(speakerElement);
			if((speakerElement.tagName == 'P')&&(count > 5)) {
				if(!speakerElement.style.fontStyle.includes('italic')) {
					var newP = document.createElement('p');
					newP.innerHTML = speakerElement.innerHTML;
					newTd.appendChild(newP);
				}
			}
			if((speakerElement.tagName == 'HR')||(count > 20)) {
				break;
			}
			speakerElement = speakerElement.nextElementSibling;
		}
		
	}
	
	// make dialog
	var dlg = document.getElementById('previewDialog');
	if(dlg == null) {
		document.body.insertAdjacentHTML("beforeend", "<div id='previewDialog'></div>");
		dlg = document.getElementById('previewDialog');
	}
	
	// style dialog
	dlg.style.position='fixed';
    dlg.style.width='100%';
    dlg.style.height='100%';
    dlg.style.left=0;
    dlg.style.top=0;
    dlg.style.zIndex=4000;
    dlg.style.padding='4px'
	dlg.style.backgroundColor=getComputedStyle(document.body).backgroundColor;
	dlg.style.color=getComputedStyle(document.body).color;

	// add content to dialog
	dlg.innerText = table.rows[0].cells[0].innerText  // date from top of original table
	
	// add close button
	dlg.innerHTML += '<button style="float:right;margin-right:20px;" onclick="closePreviewDialog()">Close</button>';
	
	// add table
	dlg.appendChild(newTable)
	
	// add history entry next back button press can just close dialog
	window.history.pushState('forward', null);
	
}

function closePreviewDialog() {
	var dlg = document.getElementById('previewDialog');
	if(dlg != null) {
		dlg.remove();
	}
}

function keyPress (e) {
	// console.log('key press: '+e.key);
    if(e.key === "Escape") {
    	closePreviewDialog();
    }
}

function init_part_1() {
	// load speaker page
	fetch(SPEAKER_PAGE).then(function(response) {
		return response.text();
	}).then(function(string) {
		gSpeakerPage = document.createElement('html');
		gSpeakerPage.innerHTML = string;
		init_part_2();
	});
}

function init_part_2() {

	// add key handler so that 'esc' can close dialog
	document.addEventListener('keydown', keyPress);
	
	// add popstate handler so that back button can close modal dialog
	addEventListener('popstate', closePreviewDialog);

	// get all table cells
	var tds = document.getElementsByTagName('td');

	// filter to just cells with time values
	const time_re = new RegExp('^\s*[0-9]+\s*$');
	tds = Array.from(tds).filter(function (td) { return time_re.test(td.innerText); });

	// turn times into links
	for(var i = 0; i < tds.length; i++) {

		// are there links in this row?
		var td = tds[i];
		var tr = td.closest('tr');
		var table = tr.closest('table');
		var cells = table.rows[tr.rowIndex].cells;
		var has_links = false;
		for(var j=1; j<cells.length; j++) {
			if(cells[j].getElementsByTagName('a').length > 0) {
				if(cells[j].innerHTML.includes(SPEAKER_PAGE)) {
					has_links = true;
					break;
				}
			}
		}
		if(!has_links) {
			continue;
		}
		
		td.innerHTML = '<a><b>' + td.innerText + '</b></a>';
		td.getElementsByTagName('a')[0].onclick = time_click_handler;
	}
}

init_part_1();
