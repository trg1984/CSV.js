function CSVFile(content, config) {
    this.type = null;
    this.firstLine = 0;
	this.charset = 'utf-8';
	this.hasRowNames = true;
	this.hasColumnNames = true;
    this.columnSeparator = ',';
    this.decimalSeparator = '.';
    this.quote =  '"';
    this.escape = '\\';
	this.rowSeparator = '\n';
	this.keepEmptyRows = false;
	this.data = [[]];
	this.maxParseCount = 100000;
	
	// Copy the configuration over the default setup.
    if (typeof(config) !== 'undefined') for (var item in config) this[item] = config[item];
	
    this.import(content);
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
	while ( (i < this.maxParseCount) && (temp.length > 0) ) {
		
		//console.log(i, row, currentMode, matched, primary, secondary, temp.substr(0, 20));
		
		if (currentMode === 'inMain') {
			
			var searchBlock = '^(\\d+|' + this.columnSeparator + '|' + this.quote + '|' + this.decimalSeparator + '|' + this.rowSeparator + ')';
			var matched = temp.match(searchBlock);
			if (matched !== null) {
				matched = matched[0];
				//console.log(matched, temp);
				
				temp = temp.substr(matched.length);
				//console.log(temp);
				
				switch ( matched ) {
					case this.columnSeparator: case this.rowSeparator: {
						var item = currentType === 'int' ? primary | 0 : currentType === 'string' ? primary : (primary | 0) + (secondary | 0) * Math.pow(10, -secondary.length);
						
						this.data[row].push(item);
						currentType = 'int';
						primary = "";
						secondary = "";
						
						if ((matched === this.rowSeparator) && ((this.data[row].length > 0) || this.keepEmptyRows)) {
							
							++row;
							this.data.push([]);
						}
						
					} break;
					case this.quote: {
						currentMode = 'inQuote';
						currentType = 'string';
					} break;
					case this.decimalSeparator: {
						currentType = 'float';
					} break;
					default: {
						if (currentType === 'float') secondary = matched;
						else {
							if ((currentMode !== 'string') && (matched.search(/^\d+$/) < 0)) currentType = 'string';
							primary += matched;
						}
					} break;
				}
			} else {
				currentType = 'string';
				primary += temp.substr(0, 1);
				temp = temp.substr(1); // Remove one item at a time.
			}
		} 
		else if (currentMode === 'inQuote') {
			
			var firstQuote = temp.indexOf(this.quote);
			var firstEscape = temp.indexOf(this.escape);
			if (firstQuote === -1) firstQuote = Number.MAX_VALUE;
			if (firstEscape === -1) firstEscape = Number.MAX_VALUE;
			
			var leap = firstEscape < firstQuote ? firstEscape + this.escape.length + 1 : firstQuote === 0 ? this.quote.length : firstQuote;
			matched = temp.substr(0, leap);
			
			if (matched === this.quote) {
				do { primaryOld = primary; primary = primary.replace(this.escape, ""); ++i; } while ((primaryOld !== primary) && (i < this.maxParseCount));
				currentMode = 'inMain';
			}
			else primary += matched;
			
			temp = temp.substr(leap);
		}
		++i;
	}
	
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
					case 'string': content += this.quote + tempData[i][j] + this.quote; break;
					case 'number': {
						if (tempData[i][j] === (tempData[i][j] | 0)) content += '' + tempData[i][j];
						else content += ("" + tempData[i][j]).replace('.', this.decimalSeparator);
					} break;
				}
				content += this.columnSeparator;
			}
			content += this.rowSeparator;
		}
		
		return content;
	}
	
}

CSVFile.prototype.getRow = function(index) {
	return {
		rowNames: [this.rowNames[index]],
		colNames: this.columnNames,
		data: this.data[index]
	}
}

CSVFile.prototype.getColumn = function(index) {
	var temp = new Array(this.rowNames.length);
	for (var i = 0; i < temp.length; ++i) temp[i] = this.data[i][index];
	
	return {
		rowNames: this.rowNames,
		colNames: [this.columnNames[index]],
		data: temp
	}
}