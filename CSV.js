function CSVFile(content, config) {
	this.charset = 'utf-8';
	this.hasRowNames = false;
	this.hasColumnNames = false;
    this.columnSeparator = /^\,/;
	this.columnSeparatorStr = ',';
    this.decimalSeparator = /^\./;
	this.decimalSeparatorStr = '.';
    this.quote =  /^\"/;
	this.quoteStr =  '"';
    this.escape = /^\"\"/;
	this.escapeStr = '""';
	this.number = /^\d+/;
	this.rowSeparator = /^\r?\n/;
	this.rowSeparatorStr = "\r\n";
	this.keepEmptyRows = false;
	this.data = [[]];
	this.skipRowCount = 0;
	
	// Copy the configuration over the default setup.
    if (typeof(config) !== 'undefined') for (var item in config) this[item] = config[item];
	
    if (typeof(content) === 'string') this.import(content);
}

CSVFile.prototype.createEmptyContent = function(rows, columns) {
	this.data = new Array(rows);
	for (var row = 0; row < rows; ++row) {
		this.data[row] = new Array(columns);
		for (var col = 0; col < columns; ++col) {
			this.setCell(row, col, '');
		}
	}
}

CSVFile.prototype.import = function(content) {
    
	// Parse the file content to this variable.
	
	var temp = content + "";
    var currentType = 'int'; // int, float, string, date
	var currentMode = 'inMain';
	var primary = "";
	var secondary = "";
	this.data = [[]];
	
	var i = 0;
	var row = 0;
	var columnCount = null;
	var self = this;
	var matched = null;
	var maxParseCount = temp.length * 2;
	
	var __addCell = function() {
		// if (i < this.skipRowCount) return; // TODO not tested
		
		if (primary.trim() === "") currentType = 'string';
		var item = currentType === 'int' ? primary | 0 : currentType === 'string' ? primary : (primary | 0) + (secondary | 0) * Math.pow(10, -secondary.length);
		
		self.data[row].push(item);
		currentType = 'int';
		primary = "";
		secondary = "";
		
		if ((matched !== null) && (matched.search(self.rowSeparator) >= 0) && ((self.data[row].length > 0) || self.keepEmptyRows)) {
			if ((row === 0) || (columnCount === self.data[row].length)) {
				columnCount = self.data[0].length;
				++row;
				self.data.push([]);
			}
			else throw('row lengths differ from each other on row ' + row);
		}
		
	}
	
	while ( (i < maxParseCount) && (temp.length > 0) ) {
		
		if (currentMode === 'inMain') {
			
			var searchBlock = [
				this.number,
				this.columnSeparator,
				this.quote,
				this.decimalSeparator,
				this.rowSeparator
			];
			
			var check = Number.MAX_VALUE;
			var closest = -1;
			matched = null;
			for (var item in searchBlock) {
				var index = temp.search(searchBlock[item]);
				if ((index >= 0) && (index < check)) {
					matched = temp.match(searchBlock[item]);
					
					// Reserved for future use.
					check = index;
					closest = item;
				}
			}
			
			if (matched !== null) {
				matched = matched[0];
				
				temp = temp.substr(matched.length);
				
				if ((matched.search(this.columnSeparator) >= 0) || (matched.search(this.rowSeparator) >= 0)) __addCell();
				else if (matched.search(this.quote) >= 0) {
					currentMode = 'inQuote';
					currentType = 'string';
				}
				else if (matched.search(this.decimalSeparator) >= 0) {
					if (currentType === 'string') primary += this.decimalSeparatorStr;
					else currentType = 'float';
				}
				else {
					if (currentType === 'float') secondary = matched;
					else {
						if ((currentMode !== 'string') && (matched.search(/^\d+$/) < 0)) currentType = 'string';
						primary += matched;
					}
				}
			} else {
				currentType = 'string';
				primary += temp.substr(0, 1);
				temp = temp.substr(1); // Remove one item at a time.
			}
		} 
		else if (currentMode === 'inQuote') {
			
			var firstQuote = temp.search(this.quote);
			var firstEscape = temp.search(this.escape);
			if (firstQuote === -1) firstQuote = temp.length;
			if (firstEscape === -1) firstEscape = temp.length;

			var leap;
			if (firstEscape < temp.length) leap = firstEscape + temp.match(this.escape)[0].length;
			else if (firstQuote < temp.length) leap = firstQuote + temp.match(this.quote)[0].length;
			else leap = 1;
			
			matched = temp.substr(0, leap);
			
			// For a well defined file, variable 'matched' now contains either (a) an escaped quote, (b) one quote, or (c) one character.
			if (matched.search(this.escape) >= 0) primary += this.quoteStr;
			else if (matched.search(this.quote) >= 0) currentMode = 'inMain';
			else primary += matched;
			
			temp = temp.substr(leap);
		}
		++i;
	}
	
	if ((primary !== "") || (secondary !== "")) __addCell();
	
	// Remove trailing empty row if such rows should not be kept.
	if ((this.data[row].length === 0) && !this.keepEmptyRows) {
		
		--row;
		this.data.pop();
	}
	
	// Detach the row and column names from the file.
	if (this.hasRowNames) {
		this.rowNames = new Array(this.data.length - this.hasColumnNames);
		for (var i = 0; i < this.data.length - this.hasColumnNames; ++i) this.rowNames[i] = this.data[i + this.hasColumnNames][0];
		
		for (var i = 0; i < this.data.length; ++i) this.data[i].splice(0, 1);
	}
	
	if (this.hasColumnNames) {
		this.columnNames = new Array(this.data[0].length);
		for (var i = 0; i < this.data[0].length; ++i) this.columnNames[i] = this.data[0][i];
		
		this.data.splice(0, 1);
	}
	
}

CSVFile.prototype.export = function(asObject) {
	var tempData = new Array(this.data.length + this.hasColumnNames);
	for (var i = 0; i < tempData.length; ++i) {
		tempData[i] = new Array(this.data[0].length + this.hasRowNames);
		for (var j = 0; j < tempData[i].length; ++j) {
			if ((i === 0) && (j === 0) && this.hasRowNames && this.hasColumnNames) tempData[i][j] = "";
			else if ((i === 0) && this.hasColumnNames) tempData[i][j] = this.columnNames[j - this.hasRowNames];
			else if ((j === 0) && this.hasRowNames) tempData[i][j] = this.rowNames[i - this.hasColumnNames];
			else tempData[i][j] = this.data[i - this.hasColumnNames][j - this.hasRowNames];
		}
	}
	
	if (asObject) return tempData
	else {
		var content = "";
		for (var i = 0; i < tempData.length; ++i) {
			for (var j = 0; j < tempData[i].length; ++j) {
				switch (typeof(tempData[i][j])) {
					case 'string': content += this.quoteStr + tempData[i][j] + this.quoteStr; break;
					case 'number': {
						if (tempData[i][j] === (tempData[i][j] | 0)) content += '' + tempData[i][j];
						else content += ("" + tempData[i][j]).replace('.', this.decimalSeparatorStr);
					} break;
				}
				content += this.columnSeparatorStr;
			}
			content += this.rowSeparatorStr;
		}
		
		return content;
	}
}

CSVFile.prototype.setSeparators = function(rowSep, columnSep, decimalSep, quoteSep) {
	
	var __escapeEachChar = function(s) {
		result = "";
		for (var i = 0; i < s.length; ++i) result += '\\' + s[i];
		return result;
	}
	
	this.rowSeparatorStr = rowSep;
	this.rowSeparator = new RegExp('^' + __escapeEachChar(this.rowSeparatorStr));
	
	this.columnSeparatorStr = columnSep;
	this.columnSeparator = new RegExp('^' + __escapeEachChar(this.columnSeparatorStr));
	
	this.decimalSeparatorStr = decimalSep;
	this.decimalSeparator = new RegExp('^' + __escapeEachChar(this.decimalSeparatorStr));
	
	this.quoteStr = quoteSep;
	this.quote = new RegExp('^' + __escapeEachChar(this.quoteStr));
	
	this.escapeStr = quoteSep + quoteSep;
	this.escape = new RegExp('^' + __escapeEachChar(this.escapeStr));
}

CSVFile.prototype.setRow = function(index, arr) {
	var row = this.data[index];
	
	// Check that arr length is a multiple of the row length.
	if ((row.length / arr.length - (row.length / arr.length | 0)) === 0) {
		for (var i = 0; i < row.length; ++i) row[i] = arr[i % arr.length];
	} else throw('Array length not multiple of row length.');
}

CSVFile.prototype.setColumn = function(index, arr) {
	
	// Check that arr length is a multiple of the row length.
	if ((this.data.length / arr.length - (this.data.length / arr.length | 0)) === 0) {
		for (var i = 0; i < this.data.length; ++i) this.data[i][index] = arr[i % arr.length];
	} else throw('Array length not multiple of column length.');
}

CSVFile.prototype.setCell = function(row, column, value) {
	this.data[row][column] = value;
}

CSVFile.prototype.getCell = function(row, column) {
	return {
		rowName: this.rowNames ? this.rowNames[row] : null,
		colName: this.columnNames ? this.columnNames[column] : null,
		data: this.data[row][column]
	}
}

CSVFile.prototype.getRow = function(index) {
	return {
		rowNames: this.rowNames ? [this.rowNames[index]] : null,
		colNames: this.columnNames ? this.columnNames : null,
		data: this.data[index]
	}
}

CSVFile.prototype.getColumn = function(index) {
	var temp = new Array(this.data.length);
	for (var i = 0; i < temp.length; ++i) temp[i] = this.data[i][index];
	
	return {
		rowNames: this.rowNames ? this.rowNames : null,
		colNames: this.columnNames ? [this.columnNames[index]] : null,
		data: temp
	}
}
