/**
 * @name Chart.js
 * @author Rolf Lindén
 * @email rolind@utu.fi
 */

function Chart(place, config, callback) {
	this.config = {
		rows: 5,
		cols: 5,
		content: null,
		editable: true
	};
	this.initialize(place, config, callback);
}

Chart.prototype.initialize = function(place, config, callback) {
	this.place = place;
	if (typeof(config) !== 'undefined') for (var item in config) this.config[item] = config[item];
	
	if (this.config.content === null) {
		this.config.content = new CSVFile();
		this.config.content.createEmptyContent(this.config.rows, this.config.cols);
	}
	this.firstTab = null;
	this.selectedCell = null;
	this.onEdge = false;
	this.draw();
	
	if (typeof(callback) === 'function') callback();
}

Chart.prototype.selectCell = function(cellElem) {
	var row, col, newRow, newCol;
	
	if (this.selectedCell !== null) {
		row = this.selectedCell.attributes['data-row-id'].value | 0;
		col = this.selectedCell.attributes['data-column-id'].value | 0;
	
		newRow = cellElem.attributes['data-row-id'].value | 0;
		newCol = cellElem.attributes['data-column-id'].value | 0;
		
		if ((row === newRow) && (col === newCol)) return;
		
		var val = this.selectedCell.querySelector('input').value;
		//console.log(row, col, val);
		this.config.content.setCell(row, col, val);
		
		this.selectedCell.classList.remove('selected');
		this.selectedCell.innerHTML = this.config.content.getCell(row, col).data;
	}
	
	this.selectedCell = cellElem;
	this.selectedCell.classList.add('selected');
	
	row = this.selectedCell.attributes['data-row-id'].value;
	col = this.selectedCell.attributes['data-column-id'].value;
	//console.log(row, col, cellElem);
		
	this.selectedCell.innerHTML = `<input type="text" value="${this.config.content.getCell(row, col).data}"/>`;
	this.selectedCell.querySelector('input').focus();
}

Chart.prototype.__clickHandler = function(ev) {
	//console.log('click!');
	var elem = ev.currentTarget;
	this.selectCell(elem);
	this.firstTab = null;
	this.onEdge = true;
}

Chart.prototype.__getCaretPosition = function(input) {
	// Initialize
	var iCaretPos = 0;

	// IE Support
	if (document.selection) {

		// Set focus on the element
		input.focus();

		// To get cursor position, get empty selection range
		var oSel = document.selection.createRange();

		// Move selection start to 0 position
		oSel.moveStart ('character', -input.value.length);

		// The caret position is selection length
		iCaretPos = oSel.text.length;
	}

	// Firefox support
	else if (input.selectionStart || input.selectionStart == '0')
		iCaretPos = input.selectionStart;
		
	// Return results
	return (iCaretPos);
}

Chart.prototype.__setCaretPosition = function(input, caretStartPos, caretEndPos) {
	
	if (input !== null) {
		if (typeof(caretEndPos) !== 'number') caretEndPos = caretStartPos;
		
		if (typeof(input.createTextRange) !== 'undefined') {
			var range = input.createTextRange();
			range.move('character', caretStartPos);
			range.select();
		}
		else {
			if (typeof(input.setSelectionRange) !== 'undefined') {
				input.focus();
				input.setSelectionRange(caretStartPos, caretEndPos);
			}
			else input.focus();
		}
	}
}

Chart.prototype.__keyUpHandler = function(ev) {
	ev.preventDefault();
	ev.stopPropagation();
}

Chart.prototype.__keyDownHandler = function(ev) {
	var current = ev.currentTarget;
	var row = this.selectedCell.attributes['data-row-id'].value | 0;
	var col = this.selectedCell.attributes['data-column-id'].value | 0;
	
	switch (ev.which) {
		case 27:
			if (this.selectedCell !== null) {
				var val = this.selectedCell.querySelector('input').value = this.config.content.getCell(row, col).data;
				this.firstTab = null;
			}
		break;
		case 37:
			if (this.selectedCell !== null) {
				var input = current.querySelector('input');
				if ((this.__getCaretPosition(current.querySelector('input')) === 0) && (this.onEdge === true)) {
					var newCell = this.place.querySelector('.cell[data-row-id="' + row + '"][data-column-id="' + (col > 0 ? col - 1 : col) + '"]');
					this.selectCell(newCell);
					
					var newInput = newCell.querySelector('input');
					var self = this;
					setTimeout(function() {self.__setCaretPosition(newInput, newInput.value.length, newInput.value.length)}, 5);
					this.firstTab = null;
					
				} else if (this.__getCaretPosition(input) < 1) {
					this.onEdge = true;
					setTimeout(function() {self.__setCaretPosition(newInput, 0, 0)}, 5);
				}
				//console.log(this.__getCaretPosition(input), input.value.length, this.__getCaretPosition(input) === input.value.length - 1, this.onEdge)
			}
		break;
		case 38:
			if (this.selectedCell !== null) {
				var newCell = this.place.querySelector('.cell[data-row-id="' + (row > 0 ? row - 1 : row) + '"][data-column-id="' + col + '"]');
				
				this.selectCell(newCell);
				var self = this;
				var input = newCell.querySelector('input');
				setTimeout(function() {self.__setCaretPosition(input, input.value.length, input.value.length)}, 5);
				this.firstTab = null;
			}
		break;
		case 39:
			if (this.selectedCell !== null) {
				var input = current.querySelector('input');
				if ((this.__getCaretPosition(input) > input.value.length - 1) && (this.onEdge === true)) {
					var newCell = this.place.querySelector('.cell[data-row-id="' + row + '"][data-column-id="' + (col < this.config.cols - 1 ? col + 1 : col) + '"]');
					this.selectCell(newCell);
					
					var newInput = newCell.querySelector('input');
					var self = this;
					setTimeout(function() {self.__setCaretPosition(newInput, 0, 0)}, 5);
					this.firstTab = null;
					
				} else if (this.__getCaretPosition(input) > input.value.length - 1) {
					this.onEdge = true;
				}
				//console.log(this.__getCaretPosition(input), input.value.length, this.__getCaretPosition(input) === input.value.length - 1, this.onEdge)
			}
		break;
		case 9:
			if (this.selectedCell !== null) {
				ev.preventDefault();
				ev.stopPropagation();
				
				var newCell;
				if (ev.shiftKey === true) newCell = this.place.querySelector('.cell[data-row-id="' + row + '"][data-column-id="' + (col > 0 ? col - 1 : col) + '"]');
				else newCell = this.place.querySelector('.cell[data-row-id="' + row + '"][data-column-id="' + (col < this.config.cols - 1 ? col + 1 : col) + '"]');
				
				if (this.firstTab === null) {
					this.firstTab = this.selectedCell;
				}
				this.selectCell(newCell);
				
			}
		break;
		case 40:
			if (this.selectedCell !== null) {
				var newCell = this.place.querySelector('.cell[data-row-id="' + (row < this.config.rows - 1 ? row + 1 : row) + '"][data-column-id="' + col + '"]');
				this.selectCell(newCell);
				var self = this;
				var input = newCell.querySelector('input');
				setTimeout(function() {self.__setCaretPosition(input, input.value.length, input.value.length)}, 5);
				this.firstTab = null;
			}
		break;
		case 13:
			if (this.selectedCell !== null) {
				var newCell;
				if (this.firstTab !== null) {
					var row = this.firstTab.attributes['data-row-id'].value | 0;
					var col = this.firstTab.attributes['data-column-id'].value | 0;
					//this.firstTab.attributes['data-row-id'].value;
					newCell = this.place.querySelector('.cell[data-row-id="' + (row < this.config.rows - 1 ? row + 1 : row) + '"][data-column-id="' + col + '"]');
					this.firstTab = newCell;
				} else newCell = this.place.querySelector('.cell[data-row-id="' + (row < this.config.rows - 1 ? row + 1 : row) + '"][data-column-id="' + col + '"]');
				
				this.selectCell(newCell);
			}
		break;
	}
}

Chart.prototype.draw = function() {
	var s = '';
	var self = this;
	s += '<table class="table">';
	for (var row = 0; row < this.config.rows; ++row) {
		
		s += '<tr class="row" data-row-id="' + row + '">'
		for (var col = 0; col < this.config.cols; ++col) {
			var cell = this.config.content.getCell(row, col);
			s += '<td class="cell" data-row-id="' + row + '" data-column-id="' + col + '">' + this.config.content.getCell(row, col).data + '</td>';
		}
		s += '</tr>';
	}
	s += '</table>';
	
	this.place.classList.add('chart');
	if (this.config.editable) this.place.classList.add('editable');
	this.place.innerHTML = s;
	
	if (this.config.editable === true) {
		this.place.querySelectorAll('.cell').forEach(function(item, index) { item.addEventListener('click', function(ev) { self.__clickHandler(ev); }) });
		this.place.querySelectorAll('.cell').forEach(function(item, index) { item.addEventListener('keydown', function(ev) { self.__keyDownHandler(ev); }) });
		this.place.querySelectorAll('.cell').forEach(function(item, index) { item.addEventListener('keyup', function(ev) { self.__keyUpHandler(ev); }) });
		
		//this.place.delegate('.cell', 'click.chart', function(ev) { self.__clickHandler(ev); })
		//this.place.delegate('.cell', 'keydown.chart', function(ev) { self.__keyDownHandler(ev); })
		//this.place.delegate('.cell', 'keyup.chart', function(ev) { self.__keyUpHandler(ev); })
	}
	
}
